package com.uninode.smartcampus.modules.booking.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PendingBookingExpiryNotifier {

    private final JdbcTemplate jdbcTemplate;

    public PendingBookingExpiryNotifier(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void notifyExpiredPendingBookings() {
        List<PendingExpiryRow> rows = jdbcTemplate.query(
                """
                        SELECT
                            COALESCE(rb.booking_group_id, rb.booking_id) AS booking_group_id,
                            rb.user_id,
                            rb.created_at,
                            rb.date,
                            rb.resource_id,
                            r.name AS resource_name,
                            ds.slot
                        FROM "Resource_booking" rb
                        INNER JOIN "Ds_slot" ds ON ds.slot_id = rb.timeslot_id
                        LEFT JOIN "Resource" r ON r.id = rb.resource_id
                        WHERE LOWER(TRIM(COALESCE(rb.status, ''))) = 'pending'
                        ORDER BY COALESCE(rb.booking_group_id, rb.booking_id), rb.booking_id
                        """,
                (rs, rowNum) -> new PendingExpiryRow(
                        rs.getLong("booking_group_id"),
                        rs.getLong("user_id"),
                        rs.getObject("created_at", OffsetDateTime.class),
                        rs.getObject("date", LocalDate.class),
                        (Long) rs.getObject("resource_id"),
                        rs.getString("resource_name"),
                        (Long) rs.getObject("slot")));

        Map<Long, PendingExpiryAccumulator> grouped = new LinkedHashMap<>();
        for (PendingExpiryRow row : rows) {
            grouped.computeIfAbsent(
                    row.bookingGroupId(),
                    ignored -> new PendingExpiryAccumulator(
                            row.bookingGroupId(),
                            row.userId(),
                            row.createdAt(),
                            row.bookingDate(),
                            row.resourceId(),
                            row.resourceName()))
                    .addSlot(row.slot());
        }

        OffsetDateTime now = OffsetDateTime.now();
        for (PendingExpiryAccumulator booking : grouped.values()) {
            if (booking.createdAt() == null || booking.userId() == null) {
                continue;
            }

            if (!now.isAfter(booking.createdAt().plusHours(72))) {
                continue;
            }

            if (hasExistingExpiryNotification(booking.bookingGroupId(), booking.userId())) {
                continue;
            }

            String resourceText = booking.resourceName() == null || booking.resourceName().isBlank()
                    ? "Resource #" + booking.resourceId()
                    : booking.resourceName();
            String slotText = booking.formatSlots();
            String dateText = booking.bookingDate() == null ? "an unknown day" : booking.bookingDate().toString();
            String message = "Booking group "
                    + booking.bookingGroupId()
                    + " for resource '"
                    + resourceText
                    + "' on "
                    + dateText
                    + " for slots "
                    + slotText
                    + " has expired. Please try again to book it.";

            jdbcTemplate.update(
                    """
                            INSERT INTO "Notifications" (notification_type, notification, user_id)
                            VALUES (?, ?, ?)
                            """,
                    "Booking",
                    message,
                    booking.userId());
        }
    }

    private boolean hasExistingExpiryNotification(Long bookingGroupId, Long userId) {
        Boolean exists = jdbcTemplate.query(
                """
                        SELECT EXISTS(
                            SELECT 1
                            FROM "Notifications" n
                            WHERE n.user_id = ?
                              AND LOWER(TRIM(COALESCE(n.notification_type, ''))) = 'booking'
                              AND n.notification LIKE ?
                        )
                        """,
                rs -> rs.next() ? rs.getBoolean(1) : Boolean.FALSE,
                userId,
                "Booking group " + bookingGroupId + " %has expired.%");
        return Boolean.TRUE.equals(exists);
    }

    private record PendingExpiryRow(
            Long bookingGroupId,
            Long userId,
            OffsetDateTime createdAt,
            LocalDate bookingDate,
            Long resourceId,
            String resourceName,
            Long slot) {
    }

    private static final class PendingExpiryAccumulator {
        private final Long bookingGroupId;
        private final Long userId;
        private final OffsetDateTime createdAt;
        private final LocalDate bookingDate;
        private final Long resourceId;
        private final String resourceName;
        private final List<Long> slots = new ArrayList<>();

        private PendingExpiryAccumulator(
                Long bookingGroupId,
                Long userId,
                OffsetDateTime createdAt,
                LocalDate bookingDate,
                Long resourceId,
                String resourceName) {
            this.bookingGroupId = bookingGroupId;
            this.userId = userId;
            this.createdAt = createdAt;
            this.bookingDate = bookingDate;
            this.resourceId = resourceId;
            this.resourceName = resourceName;
        }

        private PendingExpiryAccumulator addSlot(Long slot) {
            if (slot != null && !slots.contains(slot)) {
                slots.add(slot);
            }
            return this;
        }

        private Long bookingGroupId() {
            return bookingGroupId;
        }

        private Long userId() {
            return userId;
        }

        private OffsetDateTime createdAt() {
            return createdAt;
        }

        private LocalDate bookingDate() {
            return bookingDate;
        }

        private Long resourceId() {
            return resourceId;
        }

        private String resourceName() {
            return resourceName;
        }

        private String formatSlots() {
            if (slots.isEmpty()) {
                return "N/A";
            }
            return slots.stream()
                    .map(String::valueOf)
                    .collect(java.util.stream.Collectors.joining(", "));
        }
    }
}
