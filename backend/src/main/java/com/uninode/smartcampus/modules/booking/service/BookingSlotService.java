package com.uninode.smartcampus.modules.booking.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.uninode.smartcampus.modules.booking.dto.ApproveBookingRequest;
import com.uninode.smartcampus.modules.booking.dto.ApproveBookingResponse;
import com.uninode.smartcampus.modules.booking.dto.AvailableSlotResponse;
import com.uninode.smartcampus.modules.booking.dto.PendingBookingResponse;
import com.uninode.smartcampus.modules.booking.dto.RejectBookingRequest;
import com.uninode.smartcampus.modules.booking.dto.RejectBookingResponse;
import com.uninode.smartcampus.modules.booking.dto.ResourceAvailabilityResponse;
import com.uninode.smartcampus.modules.booking.dto.ResourceSlotMatchResponse;
import com.uninode.smartcampus.modules.booking.dto.SlotIdResponse;

import org.springframework.http.HttpStatus;

@Service
public class BookingSlotService {

        private final JdbcTemplate jdbcTemplate;

        public BookingSlotService(JdbcTemplate jdbcTemplate) {
                this.jdbcTemplate = jdbcTemplate;
        }

        @Transactional(readOnly = true)
        public SlotIdResponse getSlotIdByTimeDay(String day, Long slot) {
                String sql = """
                                SELECT s.slot_id
                                FROM "Ds_slot" s
                                WHERE LOWER(TRIM(s.day)) = LOWER(TRIM(?))
                                  AND s.slot = ?
                                LIMIT 1
                                """;

                Long slotId = jdbcTemplate.query(
                                sql,
                                rs -> rs.next() ? rs.getLong("slot_id") : null,
                                day,
                                slot);

                if (slotId == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No slot found for day '" + day + "' and slot '" + slot + "'.");
                }
                return new SlotIdResponse(slotId);
        }

        @Transactional(readOnly = true)
        public Boolean checkDynamicBooking(Long resourceId, Long timeslotId, LocalDate date) {
                String sql = """
                                SELECT EXISTS(
                                    SELECT 1
                                    FROM "Resource_booking" rb
                                    WHERE rb.resource_id = ?
                                      AND rb.timeslot_id = ?
                                      AND rb.date = ?
                                )
                                """;

                return jdbcTemplate.query(
                                sql,
                                rs -> rs.next() ? rs.getBoolean(1) : Boolean.FALSE,
                                resourceId,
                                timeslotId,
                                date);
        }

        @Transactional(readOnly = true)
        public List<PendingBookingResponse> viewPendingBookings(LocalDate createdDate) {
                String sql = """
                                SELECT
                                    rb.booking_id,
                                    rb.created_at,
                                    rb.attendees,
                                    rb.date,
                                    rb.timeslot_id,
                                    rb.purpose,
                                    rb.status,
                                    rb.resource_id,
                                    rb.user_id
                                FROM "Resource_booking" rb
                                WHERE CAST(rb.created_at AS DATE) = ?
                                  AND LOWER(TRIM(COALESCE(rb.status, ''))) = 'pending'
                                ORDER BY rb.created_at DESC, rb.booking_id DESC
                                """;

                return jdbcTemplate.query(
                                sql,
                                (rs, rowNum) -> new PendingBookingResponse(
                                                rs.getLong("booking_id"),
                                                rs.getObject("created_at", OffsetDateTime.class),
                                                (Long) rs.getObject("attendees"),
                                                rs.getObject("date", LocalDate.class),
                                                (Long) rs.getObject("timeslot_id"),
                                                rs.getString("purpose"),
                                                rs.getString("status"),
                                                (Long) rs.getObject("resource_id"),
                                                (Long) rs.getObject("user_id")),
                                createdDate);
        }

        @Transactional(readOnly = true)
        public List<Long> getOccupiedSlotIdsByResourceDay(Long resourceId, String day) {
                String sql = """
                                SELECT dr.slot_id
                                FROM "Ds_resource" dr
                                INNER JOIN "Ds_slot" ds ON ds.slot_id = dr.slot_id
                                WHERE dr.resource_id = ?
                                  AND LOWER(TRIM(ds.day)) = LOWER(TRIM(?))
                                ORDER BY dr.slot_id
                                """;

                return jdbcTemplate.query(
                                sql,
                                (rs, rowNum) -> rs.getLong("slot_id"),
                                resourceId,
                                day);
        }

        @Transactional(readOnly = true)
        public List<Long> getOccupiedTimeslotIdsByResourceDate(Long resourceId, LocalDate date) {
                String sql = """
                                SELECT rb.timeslot_id
                                FROM "Resource_booking" rb
                                WHERE rb.resource_id = ?
                                  AND rb.date = ?
                                ORDER BY rb.timeslot_id
                                """;

                return jdbcTemplate.query(
                                sql,
                                (rs, rowNum) -> rs.getLong("timeslot_id"),
                                resourceId,
                                date);
        }

        @Transactional(readOnly = true)
        public List<AvailableSlotResponse> getAvailableSlotsByResourceDay(Long resourceId, String day, LocalDate date) {
                String sql = """
                                SELECT ds.slot_id, ds.slot
                                FROM "Ds_slot" ds
                                WHERE LOWER(TRIM(ds.day)) = LOWER(TRIM(?))
                                  AND ds.slot_id NOT IN (
                                      SELECT dr.slot_id
                                      FROM "Ds_resource" dr
                                      INNER JOIN "Ds_slot" occupied_ds ON occupied_ds.slot_id = dr.slot_id
                                      WHERE dr.resource_id = ?
                                        AND LOWER(TRIM(occupied_ds.day)) = LOWER(TRIM(?))
                                  )
                                  AND ds.slot_id NOT IN (
                                      SELECT rb.timeslot_id
                                      FROM "Resource_booking" rb
                                      WHERE rb.resource_id = ?
                                        AND rb.date = ?
                                  )
                                ORDER BY ds.slot_id
                                """;

                return jdbcTemplate.query(
                                sql,
                                (rs, rowNum) -> new AvailableSlotResponse(
                                                rs.getLong("slot_id"),
                                                rs.getLong("slot")),
                                day,
                                resourceId,
                                day,
                                resourceId,
                                date);
        }

        @Transactional(readOnly = true)
        public Boolean checkRequestedSlotsAvailability(Long resourceId, LocalDate date, String day, List<Long> slots) {
                String placeholders = String.join(", ", java.util.Collections.nCopies(slots.size(), "?"));

                List<Object> validSlotParams = new ArrayList<>();
                validSlotParams.add(day);
                validSlotParams.addAll(slots);

                String validSlotsSql = """
                                SELECT COUNT(*)
                                FROM "Ds_slot" ds
                                WHERE LOWER(TRIM(ds.day)) = LOWER(TRIM(?))
                                  AND ds.slot IN (%s)
                                """.formatted(placeholders);

                Integer validSlotsCount = jdbcTemplate.queryForObject(
                                validSlotsSql,
                                Integer.class,
                                validSlotParams.toArray());

                if (validSlotsCount == null || validSlotsCount != slots.size()) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "One or more requested slots do not exist for day '" + day + "'.");
                }

                List<Object> dsResourceParams = new ArrayList<>();
                dsResourceParams.add(resourceId);
                dsResourceParams.add(day);
                dsResourceParams.addAll(slots);

                String dsResourceSql = """
                                SELECT COUNT(*)
                                FROM "Ds_resource" dr
                                INNER JOIN "Ds_slot" ds ON ds.slot_id = dr.slot_id
                                WHERE dr.resource_id = ?
                                  AND LOWER(TRIM(ds.day)) = LOWER(TRIM(?))
                                  AND ds.slot IN (%s)
                                """.formatted(placeholders);

                Integer dsResourceConflictCount = jdbcTemplate.queryForObject(
                                dsResourceSql,
                                Integer.class,
                                dsResourceParams.toArray());

                if (dsResourceConflictCount != null && dsResourceConflictCount > 0) {
                        return Boolean.FALSE;
                }

                List<Object> bookingParams = new ArrayList<>();
                bookingParams.add(resourceId);
                bookingParams.add(date);
                bookingParams.add(day);
                bookingParams.addAll(slots);

                String bookingSql = """
                                SELECT COUNT(*)
                                FROM "Resource_booking" rb
                                INNER JOIN "Ds_slot" ds ON ds.slot_id = rb.timeslot_id
                                WHERE rb.resource_id = ?
                                  AND rb.date = ?
                                  AND LOWER(TRIM(ds.day)) = LOWER(TRIM(?))
                                  AND ds.slot IN (%s)
                                """.formatted(placeholders);

                Integer bookingConflictCount = jdbcTemplate.queryForObject(
                                bookingSql,
                                Integer.class,
                                bookingParams.toArray());

                return bookingConflictCount == null || bookingConflictCount == 0;
        }

        @Transactional(readOnly = true)
        public Object checkAvailabilityByResourceName(String name, LocalDate date, List<Long> slots) {
                Long resourceId = jdbcTemplate.query(
                                """
                                                SELECT r.id
                                                FROM "Resource" r
                                                WHERE LOWER(TRIM(COALESCE(r.name, ''))) = LOWER(TRIM(?))
                                                  AND r.availability = TRUE
                                                LIMIT 1
                                                """,
                                rs -> rs.next() ? rs.getLong("id") : null,
                                name);

                if (resourceId == null) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                                        "No available resource found for name '" + name + "'.");
                }

                String day = date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

                if (slots == null || slots.isEmpty()) {
                        return getAvailableSlotsByResourceDay(resourceId, day, date);
                }

                return checkRequestedSlotsAvailability(resourceId, date, day, slots);
        }

        @Transactional(readOnly = true)
        public List<ResourceAvailabilityResponse> getAvailableResourcesByType(String type, LocalDate date, String day) {
                String resourceSql = """
                                SELECT r.id, r.name
                                FROM "Resource" r
                                WHERE LOWER(TRIM(r.type)) = LOWER(TRIM(?))
                                  AND r.availability = TRUE
                                ORDER BY r.id
                                """;

                List<ResourceAvailabilityResponse> response = new ArrayList<>();

                jdbcTemplate.query(
                                resourceSql,
                                rs -> {
                                        while (rs.next()) {
                                                Long resourceId = rs.getLong("id");
                                                String resourceName = rs.getString("name");

                                                List<AvailableSlotResponse> freeSlots = getAvailableSlotsByResourceDay(
                                                                resourceId,
                                                                day,
                                                                date);

                                                if (!freeSlots.isEmpty()) {
                                                        response.add(new ResourceAvailabilityResponse(
                                                                        resourceId,
                                                                        resourceName,
                                                                        freeSlots));
                                                }
                                        }
                                        return null;
                                },
                                type);

                return response;
        }

        @Transactional(readOnly = true)
        public List<ResourceSlotMatchResponse> getResourcesAvailableForSlotsByType(
                        String type,
                        LocalDate date,
                        String day,
                        List<Long> slots) {
                String resourceSql = """
                                SELECT r.id, r.name
                                FROM "Resource" r
                                WHERE LOWER(TRIM(r.type)) = LOWER(TRIM(?))
                                  AND r.availability = TRUE
                                ORDER BY r.id
                                """;

                List<ResourceSlotMatchResponse> response = new ArrayList<>();

                jdbcTemplate.query(
                                resourceSql,
                                rs -> {
                                        while (rs.next()) {
                                                Long resourceId = rs.getLong("id");
                                                String resourceName = rs.getString("name");

                                                Boolean available = checkRequestedSlotsAvailability(resourceId, date,
                                                                day, slots);
                                                if (Boolean.TRUE.equals(available)) {
                                                        response.add(new ResourceSlotMatchResponse(
                                                                        resourceId,
                                                                        resourceName,
                                                                        List.copyOf(slots)));
                                                }
                                        }
                                        return null;
                                },
                                type);

                return response;
        }

        @Transactional(readOnly = true)
        public Object searchAvailabilityByType(String type, LocalDate date, List<Long> slots) {
                String day = date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

                if (slots == null || slots.isEmpty()) {
                        return getAvailableResourcesByType(type, date, day);
                }

                return getResourcesAvailableForSlotsByType(type, date, day, slots);
        }

        @Transactional
        public RejectBookingResponse rejectBooking(RejectBookingRequest request) {
                String rejectReason = request.rejectReason().trim();

                RejectedBookingRow booking = jdbcTemplate.query(
                                """
                                                SELECT
                                                        rb.booking_id,
                                                        rb.created_at,
                                                        rb.attendees,
                                                        rb.date,
                                                        rb.timeslot_id,
                                                        rb.purpose,
                                                        rb.status,
                                                        rb.resource_id,
                                                        rb.user_id
                                                FROM "Resource_booking" rb
                                                WHERE rb.booking_id = ?
                                                LIMIT 1
                                                """,
                                rs -> rs.next()
                                                ? new RejectedBookingRow(
                                                                rs.getLong("booking_id"),
                                                                rs.getObject("created_at", OffsetDateTime.class),
                                                                (Long) rs.getObject("attendees"),
                                                                rs.getObject("date", LocalDate.class),
                                                                (Long) rs.getObject("timeslot_id"),
                                                                rs.getString("purpose"),
                                                                rs.getString("status"),
                                                                (Long) rs.getObject("resource_id"),
                                                                (Long) rs.getObject("user_id"))
                                                : null,
                                request.bookingId());

                if (booking == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No booking found for booking_id '" + request.bookingId() + "'.");
                }

                jdbcTemplate.update(
                                """
                                                INSERT INTO "Rejected_Resource_booking"
                                                        (created_at, attendees, date, timeslot_id, purpose, status, resource_id, user_id, reject_reason)
                                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                booking.createdAt(),
                                booking.attendees(),
                                booking.date(),
                                booking.timeslotId(),
                                booking.purpose(),
                                "rejected",
                                booking.resourceId(),
                                booking.userId(),
                                rejectReason);

                int deletedRows = jdbcTemplate.update(
                                """
                                                DELETE FROM "Resource_booking"
                                                WHERE booking_id = ?
                                                """,
                                request.bookingId());

                if (deletedRows == 0) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No booking found for booking_id '" + request.bookingId() + "'.");
                }

                jdbcTemplate.update(
                                """
                                                INSERT INTO "Notifications" (notification_type, notification, user_id)
                                                VALUES (?, ?, ?)
                                                """,
                                "Booking",
                                "Your booking request was rejected. Reason: " + rejectReason,
                                booking.userId());

                return new RejectBookingResponse(
                                request.bookingId(),
                                "Booking rejected, archived, and user notified successfully.");
        }

        private record RejectedBookingRow(
                        Long bookingId,
                        OffsetDateTime createdAt,
                        Long attendees,
                        LocalDate date,
                        Long timeslotId,
                        String purpose,
                        String status,
                        Long resourceId,
                        Long userId) {
        }

        @Transactional
        public ApproveBookingResponse approveBooking(ApproveBookingRequest request) {
                BookingApprovalRow booking = jdbcTemplate.query(
                                """
                                                SELECT rb.booking_id, rb.user_id
                                                FROM "Resource_booking" rb
                                                WHERE rb.booking_id = ?
                                                LIMIT 1
                                                """,
                                rs -> rs.next()
                                                ? new BookingApprovalRow(
                                                                rs.getLong("booking_id"),
                                                                (Long) rs.getObject("user_id"))
                                                : null,
                                request.bookingId());

                if (booking == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No booking found for booking_id '" + request.bookingId() + "'.");
                }

                int updatedRows = jdbcTemplate.update(
                                """
                                                UPDATE "Resource_booking"
                                                SET status = ?
                                                WHERE booking_id = ?
                                                """,
                                "approved",
                                request.bookingId());

                if (updatedRows == 0) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No booking found for booking_id '" + request.bookingId() + "'.");
                }

                jdbcTemplate.update(
                                """
                                                INSERT INTO "Notifications" (notification_type, notification, user_id)
                                                VALUES (?, ?, ?)
                                                """,
                                "Booking",
                                "Your booking request was approved.",
                                booking.userId());

                return new ApproveBookingResponse(
                                request.bookingId(),
                                "Booking approved and user notified successfully.");
        }

        private record BookingApprovalRow(
                        Long bookingId,
                        Long userId) {
        }
}
