package com.uninode.smartcampus.modules.notifications.service;

import java.util.LinkedHashSet;
import java.util.Set;

import com.uninode.smartcampus.modules.notifications.entity.Notification;
import com.uninode.smartcampus.modules.notifications.entity.NotificationType;
import com.uninode.smartcampus.modules.notifications.repository.NotificationRepository;
import com.uninode.smartcampus.modules.tickets.entity.Ticket;
import com.uninode.smartcampus.modules.tickets.entity.TicketComment;
import com.uninode.smartcampus.modules.tickets.repository.TicketCommentRepository;
import com.uninode.smartcampus.modules.users.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketCommentNotificationService {

    private static final Long TECHNICIAN_USERTYPE_ID = 4L;
    private static final Long ADMIN_USERTYPE_ID = 5L;
    private static final int COMMENT_PREVIEW_LIMIT = 120;

    private final NotificationRepository notificationRepository;
    private final TicketCommentRepository ticketCommentRepository;

    @Transactional
    public void notifyRecipients(TicketComment comment) {
        if (comment == null || comment.getTicket() == null || comment.getUser() == null) {
            return;
        }

        Ticket ticket = comment.getTicket();
        User author = comment.getUser();

        Set<User> recipients = new LinkedHashSet<>();

        if (isAdmin(author)) {
            addIfEligible(recipients, ticket.getRaisedUser(), author, false);
            addIfEligible(recipients, ticket.getAssignedUser(), author, true);
        } else if (isTechnician(author)) {
            addIfEligible(recipients, ticket.getRaisedUser(), author, false);
        } else if (ticket.getAssignedUser() != null) {
            addIfEligible(recipients, ticket.getAssignedUser(), author, true);
        }

        if (recipients.isEmpty()) {
            log.debug(
                    "No ticket comment notifications required for comment id={} on ticket id={}",
                    comment.getCommentId(),
                    ticket.getTicketId()
            );
            return;
        }

        String message = buildNotificationMessage(comment, ticket, author, comment.getComment());

        recipients.forEach(recipient -> {
            createNotificationIfMissing(recipient, message, comment);
        });
    }

    @Transactional
    public void syncCommentNotifications() {
        ticketCommentRepository.findAll().forEach(this::notifyRecipients);
    }

    private void createNotificationIfMissing(User recipient, String message, TicketComment comment) {
        boolean alreadyExists = notificationRepository.existsByUserUserIdAndNotificationTypeAndMessage(
                recipient.getUserId(),
                NotificationType.TICKET,
                message
        );

        if (alreadyExists) {
            return;
        }

        Notification notification = Notification.builder()
                .notificationType(NotificationType.TICKET)
                .message(message)
                .user(recipient)
                .build();

        notificationRepository.save(notification);
        log.info(
                "Created ticket comment notification for comment id={} ticket id={} recipient id={}",
                comment.getCommentId(),
                comment.getTicket().getTicketId(),
                recipient.getUserId()
        );
    }

    private void addIfEligible(Set<User> recipients, User candidate, User author, boolean requireTechnician) {
        if (candidate == null || candidate.getUserId() == null) {
            return;
        }
        if (author.getUserId() != null && author.getUserId().equals(candidate.getUserId())) {
            return;
        }
        if (isAdmin(candidate)) {
            return;
        }
        if (requireTechnician && !isTechnician(candidate)) {
            return;
        }

        recipients.add(candidate);
    }

    private String buildNotificationMessage(TicketComment comment, Ticket ticket, User author, String commentText) {
        String actorLabel = resolveActorLabel(author);
        String preview = sanitizePreview(commentText);
        return "New comment on ticket %s from %s (comment %s): %s"
                .formatted(ticket.getTicketId(), actorLabel, comment.getCommentId(), preview);
    }

    private String resolveActorLabel(User user) {
        String displayName = resolveDisplayName(user);
        if (isAdmin(user)) {
            return "Admin %s".formatted(displayName);
        }
        if (isTechnician(user)) {
            return "Technician %s".formatted(displayName);
        }
        return displayName;
    }

    private String resolveDisplayName(User user) {
        if (user == null) {
            return "User";
        }
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName().trim();
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail().trim();
        }
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername().trim();
        }
        return "User";
    }

    private String sanitizePreview(String commentText) {
        if (commentText == null || commentText.isBlank()) {
            return "View the latest ticket reply.";
        }

        String normalized = commentText.trim().replaceAll("\\s+", " ");
        if (normalized.length() <= COMMENT_PREVIEW_LIMIT) {
            return normalized;
        }

        return normalized.substring(0, COMMENT_PREVIEW_LIMIT - 3) + "...";
    }

    private boolean isTechnician(User user) {
        Long userTypeId = user != null && user.getUserType() != null ? user.getUserType().getUsertypeId() : null;
        if (TECHNICIAN_USERTYPE_ID.equals(userTypeId)) {
            return true;
        }

        String roleName = user != null && user.getUserType() != null ? user.getUserType().getRoleName() : null;
        return roleName != null && "technician".equalsIgnoreCase(roleName.trim());
    }

    private boolean isAdmin(User user) {
        Long userTypeId = user != null && user.getUserType() != null ? user.getUserType().getUsertypeId() : null;
        if (ADMIN_USERTYPE_ID.equals(userTypeId)) {
            return true;
        }

        String roleName = user != null && user.getUserType() != null ? user.getUserType().getRoleName() : null;
        return roleName != null && "admin".equalsIgnoreCase(roleName.trim());
    }
}
