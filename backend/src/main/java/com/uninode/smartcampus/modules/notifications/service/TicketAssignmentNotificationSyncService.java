package com.uninode.smartcampus.modules.notifications.service;

import java.util.List;

import com.uninode.smartcampus.modules.notifications.entity.Notification;
import com.uninode.smartcampus.modules.notifications.entity.NotificationType;
import com.uninode.smartcampus.modules.notifications.repository.NotificationRepository;
import com.uninode.smartcampus.modules.users.entity.User;
import com.uninode.smartcampus.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketAssignmentNotificationSyncService {

    private static final Long TECHNICIAN_USERTYPE_ID = 4L;

    private final JdbcTemplate jdbcTemplate;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Scheduled(fixedDelayString = "${app.notifications.ticket-sync-delay-ms:2000}")
    @Transactional
    public void syncTicketAssignmentNotifications() {
        try {
            List<TicketAssignmentRow> rows = jdbcTemplate.query(
                    """
                            SELECT
                                t.ticket_id,
                                t.raised_user_id,
                                t.assigned_user_id
                            FROM "Tickets" t
                            WHERE t.assigned_user_id IS NOT NULL
                            ORDER BY t.ticket_id ASC
                            """,
                    (rs, rowNum) -> new TicketAssignmentRow(
                            asLong(rs.getObject("ticket_id")),
                            asLong(rs.getObject("raised_user_id")),
                            asLong(rs.getObject("assigned_user_id")))
            );

            log.debug("Ticket assignment sync scanned {} assigned tickets", rows.size());
            rows.forEach(this::createNotificationsIfMissing);
        } catch (RuntimeException exception) {
            log.error("Ticket assignment notification sync failed", exception);
        }
    }

    @Scheduled(fixedDelayString = "${app.notifications.ticket-status-sync-delay-ms:2000}")
    @Transactional
    public void syncTicketStatusNotifications() {
        try {
            List<TicketStatusRow> rows = jdbcTemplate.query(
                    """
                            SELECT
                                t.ticket_id,
                                t.raised_user_id,
                                t.status
                            FROM "Tickets" t
                            WHERE t.raised_user_id IS NOT NULL
                              AND t.status IS NOT NULL
                            ORDER BY t.ticket_id ASC
                            """,
                    (rs, rowNum) -> new TicketStatusRow(
                            asLong(rs.getObject("ticket_id")),
                            asLong(rs.getObject("raised_user_id")),
                            rs.getString("status"))
            );

            log.debug("Ticket status sync scanned {} tickets", rows.size());
            rows.forEach(this::createStatusNotificationIfMissing);
        } catch (RuntimeException exception) {
            log.error("Ticket status notification sync failed", exception);
        }
    }

    private void createNotificationsIfMissing(TicketAssignmentRow row) {
        if (row.ticketId() == null || row.assignedUserId() == null) {
            return;
        }

        User technician = userRepository.findById(row.assignedUserId()).orElse(null);
        if (technician == null || !isTechnician(technician)) {
            return;
        }

        String technicianName = resolveUserDisplayName(technician);

        // Technician notification
        createNotificationIfMissing(
                row.assignedUserId(),
                "The ticket %s has been assigned to you.".formatted(row.ticketId())
        );

        // End-user notification
        if (row.raisedUserId() != null) {
            createNotificationIfMissing(
                    row.raisedUserId(),
                    "Your ticket %s has been assigned to technician %s.".formatted(
                            row.ticketId(),
                    technicianName
                    )
            );
        }
    }

    private void createNotificationIfMissing(Long userId, String message) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return;
        }

        boolean alreadyExists = notificationRepository.existsByUserUserIdAndNotificationTypeAndMessage(
                userId,
                NotificationType.TICKET,
                message
        );

        if (alreadyExists) {
            return;
        }

        Notification notification = Notification.builder()
                .notificationType(NotificationType.TICKET)
                .message(message)
                .user(user)
                .build();

        notificationRepository.save(notification);
        log.info("Created ticket assignment notification for user id={} message={}", userId, message);
    }

    private void createStatusNotificationIfMissing(TicketStatusRow row) {
        if (row.ticketId() == null || row.raisedUserId() == null || row.status() == null || row.status().isBlank()) {
            return;
        }

        String message = "Your ticket %s status has been updated to %s."
                .formatted(row.ticketId(), normalizeStatus(row.status()));

        createNotificationIfMissing(row.raisedUserId(), message);
    }

    private boolean isTechnician(User user) {
        Long userTypeId = user.getUserType() != null ? user.getUserType().getUsertypeId() : null;
        if (TECHNICIAN_USERTYPE_ID.equals(userTypeId)) {
            return true;
        }

        String roleName = user.getUserType() != null ? user.getUserType().getRoleName() : null;
        return roleName != null && "technician".equalsIgnoreCase(roleName.trim());
    }

    private String resolveUserDisplayName(User user) {
        String name = user.getName();
        if (name != null && !name.isBlank()) {
            return name.trim();
        }

        String username = user.getUsername();
        if (username != null && !username.isBlank()) {
            return username.trim();
        }

        String email = user.getEmail();
        if (email != null && !email.isBlank()) {
            return email.trim();
        }

        return "Technician";
    }

    private Long asLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        throw new IllegalArgumentException("Unexpected numeric value type: " + value.getClass().getName());
    }

    private String normalizeStatus(String status) {
        return status.trim().replace('_', ' ');
    }

    private record TicketAssignmentRow(
            Long ticketId,
            Long raisedUserId,
            Long assignedUserId
    ) {
    }

        private record TicketStatusRow(
            Long ticketId,
            Long raisedUserId,
            String status
        ) {
        }
}