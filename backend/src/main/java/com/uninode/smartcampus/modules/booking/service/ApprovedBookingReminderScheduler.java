package com.uninode.smartcampus.modules.booking.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ApprovedBookingReminderScheduler {

    private final JdbcTemplate jdbcTemplate;

    public ApprovedBookingReminderScheduler(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void sendApprovedBookingReminders() {
        LocalDateTime now = LocalDateTime.now();

        List<ApprovedBookingReminderRow> bookings = jdbcTemplate.query(
                """
                        SELECT
                            COALESCE(rb.booking_group_id, rb.booking_id) AS booking_group_id,
                            rb.user_id,
                            rb.date,
                            ds.slot
                        FROM "Resource_booking" rb
                        INNER JOIN "Ds_slot" ds ON ds.slot_id = rb.timeslot_id
                        WHERE LOWER(TRIM(COALESCE(rb.status, ''))) = 'approved'
                          AND rb.booking_id = (
                              SELECT MIN(rb_first.booking_id)
                              FROM "Resource_booking" rb_first
                              WHERE COALESCE(rb_first.booking_group_id, rb_first.booking_id)
                                    = COALESCE(rb.booking_group_id, rb.booking_id)
                          )
                        ORDER BY COALESCE(rb.booking_group_id, rb.booking_id)
                        """,
                (rs, rowNum) -> new ApprovedBookingReminderRow(
                        rs.getLong("booking_group_id"),
                        rs.getLong("user_id"),
                        rs.getObject("date", LocalDate.class),
                        (Long) rs.getObject("slot")));

        for (ApprovedBookingReminderRow booking : bookings) {
            if (booking.bookingDate() == null || booking.userId() == null) {
                continue;
            }

            LocalDateTime bookingStart = booking.bookingDate().atStartOfDay();
            LocalDateTime reminderStart = bookingStart.minusHours(24);

            if (now.isBefore(reminderStart) || !now.isBefore(bookingStart)) {
                continue;
            }

            if (hasExistingReminder(booking.bookingGroupId(), booking.userId())) {
                continue;
            }

            String slotText = booking.slot() == null
                    ? "Unknown slot"
                    : booking.slot() + " (" + booking.slot() + ":00 - " + (booking.slot() + 1) + ":00)";

            String message = "Booking reminder: your approved booking group "
                    + booking.bookingGroupId()
                    + " is scheduled for "
                    + booking.bookingDate()
                    + " at slot "
                    + slotText
                    + ".";

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

    private boolean hasExistingReminder(Long bookingGroupId, Long userId) {
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
                "Booking reminder: your approved booking group " + bookingGroupId + "%");
        return Boolean.TRUE.equals(exists);
    }

    private record ApprovedBookingReminderRow(
            Long bookingGroupId,
            Long userId,
            LocalDate bookingDate,
            Long slot) {
    }
}
