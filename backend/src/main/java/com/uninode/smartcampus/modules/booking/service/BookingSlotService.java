package com.uninode.smartcampus.modules.booking.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.uninode.smartcampus.modules.booking.dto.ApproveBookingRequest;
import com.uninode.smartcampus.modules.booking.dto.ApproveBookingResponse;
import com.uninode.smartcampus.modules.booking.dto.AvailableSlotResponse;
import com.uninode.smartcampus.modules.booking.dto.CancelBookingRequest;
import com.uninode.smartcampus.modules.booking.dto.CancelBookingResponse;
import com.uninode.smartcampus.modules.booking.dto.CreateBookingGroupRequest;
import com.uninode.smartcampus.modules.booking.dto.CreateBookingGroupResponse;
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
        public List<PendingBookingResponse> viewPendingBookings() {
                return viewBookingsByStatus("pending");
        }

        @Transactional(readOnly = true)
        public List<PendingBookingResponse> viewApprovedBookings() {
                return viewBookingsByStatus("approved");
        }

        @Transactional(readOnly = true)
        public List<PendingBookingResponse> viewRejectedBookings() {
                String sql = """
                                SELECT
                                    COALESCE(rb.booking_group_id, rb.booking_id) AS booking_group_id,
                                    rb.booking_id,
                                    rb.created_at,
                                    rb.attendees,
                                    rb.date,
                                    rb.timeslot_id,
                                    ds.slot,
                                    rb.purpose,
                                    'rejected' AS status,
                                    rb.resource_id,
                                    r.name AS resource_name,
                                    rb.reject_reason AS reason,
                                    rb.user_id
                                FROM "Rejected_Resource_booking" rb
                                INNER JOIN "Ds_slot" ds ON ds.slot_id = rb.timeslot_id
                                LEFT JOIN "Resource" r ON r.id = rb.resource_id
                                ORDER BY COALESCE(rb.booking_group_id, rb.booking_id) DESC, rb.booking_id ASC
                                """;

                return viewArchivedBookings(sql);
        }

        @Transactional(readOnly = true)
        public List<PendingBookingResponse> viewCancelledBookings() {
                String sql = """
                                SELECT
                                    COALESCE(cb.booking_group_id, cb.booking_id) AS booking_group_id,
                                    cb.booking_id,
                                    cb.created_at,
                                    cb.attendees,
                                    cb.date,
                                    cb.timeslot_id,
                                    ds.slot,
                                    cb.purpose,
                                    'cancelled' AS status,
                                    cb.resource_id,
                                    r.name AS resource_name,
                                    NULL::text AS reason,
                                    cb.user_id
                                FROM "Cancelled_Resource_booking" cb
                                INNER JOIN "Ds_slot" ds ON ds.slot_id = cb.timeslot_id
                                LEFT JOIN "Resource" r ON r.id = cb.resource_id
                                ORDER BY COALESCE(cb.booking_group_id, cb.booking_id) DESC, cb.booking_id ASC
                                """;

                return viewArchivedBookings(sql);
        }

        @Transactional
        public CancelBookingResponse cancelBooking(CancelBookingRequest request) {
                List<CancellableBookingRow> bookings = jdbcTemplate.query(
                                """
                                                SELECT
                                                        COALESCE(rb.booking_group_id, rb.booking_id) AS booking_group_id,
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
                                                WHERE COALESCE(rb.booking_group_id, rb.booking_id) = ?
                                                  AND rb.user_id = ?
                                                  AND LOWER(TRIM(COALESCE(rb.status, ''))) = 'pending'
                                                ORDER BY rb.booking_id ASC
                                                """,
                                (rs, rowNum) -> new CancellableBookingRow(
                                                rs.getLong("booking_group_id"),
                                                rs.getLong("booking_id"),
                                                rs.getObject("created_at", OffsetDateTime.class),
                                                (Long) rs.getObject("attendees"),
                                                rs.getObject("date", LocalDate.class),
                                                (Long) rs.getObject("timeslot_id"),
                                                rs.getString("purpose"),
                                                rs.getString("status"),
                                                (Long) rs.getObject("resource_id"),
                                                (Long) rs.getObject("user_id")),
                                request.bookingGroupId(),
                                request.userId());

                if (bookings.isEmpty()) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No booking group found for booking_group_id '" + request.bookingGroupId()
                                                        + "' and user_id '" + request.userId() + "'.");
                }

                LocalDate bookingDate = bookings.get(0).date();
                LocalDateTime cancellationDeadline = bookingDate.atStartOfDay().minusHours(48);
                if (!LocalDateTime.now().isBefore(cancellationDeadline)) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Cancellation is only allowed more than 48 hours before the booking date.");
                }

                List<Long> bookingIds = new ArrayList<>();
                for (CancellableBookingRow booking : bookings) {
                        bookingIds.add(booking.bookingId());
                        jdbcTemplate.update(
                                        """
                                                        INSERT INTO "Cancelled_Resource_booking"
                                                                (booking_id, booking_group_id, created_at, attendees, date, timeslot_id, purpose, status, resource_id, user_id)
                                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                        """,
                                        booking.bookingId(),
                                        request.bookingGroupId(),
                                        booking.createdAt(),
                                        booking.attendees(),
                                        booking.date(),
                                        booking.timeslotId(),
                                        booking.purpose(),
                                        "cancelled",
                                        booking.resourceId(),
                                        booking.userId());
                }

                int deletedRows = jdbcTemplate.update(
                                """
                                                DELETE FROM "Resource_booking"
                                                WHERE COALESCE(booking_group_id, booking_id) = ?
                                                  AND user_id = ?
                                                  AND LOWER(TRIM(COALESCE(status, ''))) = 'pending'
                                                """,
                                request.bookingGroupId(),
                                request.userId());

                if (deletedRows != bookings.size()) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No booking group found for booking_group_id '" + request.bookingGroupId()
                                                        + "' and user_id '" + request.userId() + "'.");
                }

                String bookingIdsText = bookingIds.stream()
                                .map(String::valueOf)
                                .collect(java.util.stream.Collectors.joining(", "));

                jdbcTemplate.update(
                                """
                                                INSERT INTO "Notifications" (notification_type, notification, user_id)
                                                VALUES (?, ?, ?)
                                                """,
                                "Booking",
                                "Your booking group " + request.bookingGroupId()
                                                + " was cancelled by you. Cancelled booking IDs: " + bookingIdsText,
                                request.userId());

                return new CancelBookingResponse(
                                request.bookingGroupId(),
                                List.copyOf(bookingIds),
                                "Booking group cancelled successfully.");
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
        public Object checkAvailabilityByResourceName(String name, LocalDate date, List<Long> slots, String roleName) {
                ResourceLookupRow resource = jdbcTemplate.query(
                                """
                                                SELECT r.id, r.name, r.type, r.availability
                                                FROM "Resource" r
                                                WHERE LOWER(TRIM(COALESCE(r.name, ''))) = LOWER(TRIM(?))
                                                LIMIT 1
                                                """,
                                rs -> rs.next()
                                                ? new ResourceLookupRow(
                                                                rs.getLong("id"),
                                                                rs.getString("name"),
                                                                rs.getString("type"),
                                                                (Boolean) rs.getObject("availability"))
                                                : null,
                                name);

                if (resource == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No resource was found with the name '" + name + "'.");
                }

                if (!Boolean.TRUE.equals(resource.available())) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Resource '" + resource.name() + "' is currently unavailable.");
                }

                if ("student".equalsIgnoreCase(roleName)) {
                        String normalizedType = resource.type() == null ? "" : resource.type().trim().toLowerCase(Locale.ROOT);
                        if (normalizedType.equals("lab")
                                        || normalizedType.equals("lechall")
                                        || normalizedType.equals("lecturehall")
                                        || normalizedType.equals("lecturehalls")) {
                                throw new ResponseStatusException(
                                                HttpStatus.FORBIDDEN,
                                                "Students are not allowed to book lecture halls or labs by resource name.");
                        }
                }

                String day = date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

                if (slots == null || slots.isEmpty()) {
                        return getAvailableSlotsByResourceDay(resource.id(), day, date);
                }

                return checkRequestedSlotsAvailability(resource.id(), date, day, slots);
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

                List<RejectedBookingRow> bookings = jdbcTemplate.query(
                                """
                                                SELECT
                                                        rb.booking_group_id,
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
                                                WHERE rb.booking_group_id = ?
                                                ORDER BY rb.booking_id ASC
                                                """,
                                (rs, rowNum) -> new RejectedBookingRow(
                                                                rs.getLong("booking_group_id"),
                                                                rs.getLong("booking_id"),
                                                                rs.getObject("created_at", OffsetDateTime.class),
                                                                (Long) rs.getObject("attendees"),
                                                                rs.getObject("date", LocalDate.class),
                                                                (Long) rs.getObject("timeslot_id"),
                                                                rs.getString("purpose"),
                                                                rs.getString("status"),
                                                                (Long) rs.getObject("resource_id"),
                                                                (Long) rs.getObject("user_id")),
                                request.bookingGroupId());

                if (bookings.isEmpty()) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No booking group found for booking_group_id '" + request.bookingGroupId() + "'.");
                }

                OffsetDateTime createdAt = bookings.get(0).createdAt();
                if (createdAt != null && OffsetDateTime.now().isAfter(createdAt.plusHours(72))) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "This booking group can no longer be approved or rejected because 72 hours have passed since it was created.");
                }

                for (RejectedBookingRow booking : bookings) {
                        jdbcTemplate.update(
                                        """
                                                        INSERT INTO "Rejected_Resource_booking"
                                                                (booking_id, booking_group_id, created_at, attendees, date, timeslot_id, purpose, status, resource_id, user_id, reject_reason)
                                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                        """,
                                        booking.bookingId(),
                                        booking.bookingGroupId(),
                                        booking.createdAt(),
                                        booking.attendees(),
                                        booking.date(),
                                        booking.timeslotId(),
                                        booking.purpose(),
                                        "rejected",
                                        booking.resourceId(),
                                        booking.userId(),
                                        rejectReason);
                }

                int deletedRows = jdbcTemplate.update(
                                """
                                                DELETE FROM "Resource_booking"
                                                WHERE booking_group_id = ?
                                                """,
                                request.bookingGroupId());

                if (deletedRows != bookings.size()) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No booking group found for booking_group_id '" + request.bookingGroupId() + "'.");
                }

                Long userId = bookings.get(0).userId();
                jdbcTemplate.update(
                                """
                                                INSERT INTO "Notifications" (notification_type, notification, user_id)
                                                VALUES (?, ?, ?)
                                                """,
                                "Booking",
                                "Your booking group " + request.bookingGroupId() + " was rejected. Reason: " + rejectReason,
                                userId);

                return new RejectBookingResponse(
                                request.bookingGroupId(),
                                "Booking group rejected, archived, and user notified successfully.");
        }

        private record RejectedBookingRow(
                        Long bookingGroupId,
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
                                                SELECT rb.booking_group_id, rb.created_at
                                                FROM "Resource_booking" rb
                                                WHERE rb.booking_group_id = ?
                                                  AND rb.user_id = ?
                                                LIMIT 1
                                                """,
                                rs -> rs.next()
                                                ? new BookingApprovalRow(
                                                                rs.getLong("booking_group_id"),
                                                                rs.getObject("created_at", OffsetDateTime.class))
                                                : null,
                                request.bookingGroupId(),
                                request.userId());

                if (booking == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No booking group found for booking_group_id '" + request.bookingGroupId()
                                                        + "' and user_id '" + request.userId() + "'.");
                }

                if (booking.createdAt() != null && OffsetDateTime.now().isAfter(booking.createdAt().plusHours(72))) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "This booking group can no longer be approved or rejected because 72 hours have passed since it was created.");
                }

                int updatedRows = jdbcTemplate.update(
                                """
                                                UPDATE "Resource_booking"
                                                SET status = ?
                                                WHERE booking_group_id = ?
                                                  AND user_id = ?
                                                """,
                                "approved",
                                request.bookingGroupId(),
                                request.userId());

                if (updatedRows == 0) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No booking group found for booking_group_id '" + request.bookingGroupId()
                                                        + "' and user_id '" + request.userId() + "'.");
                }

                jdbcTemplate.update(
                                """
                                                INSERT INTO "Notifications" (notification_type, notification, user_id)
                                                VALUES (?, ?, ?)
                                                """,
                                "Booking",
                                "Your booking request was approved.",
                                request.userId());

                return new ApproveBookingResponse(
                                request.bookingGroupId(),
                                "Booking group approved and user notified successfully.");
        }

        private record BookingApprovalRow(
                        Long bookingGroupId,
                        OffsetDateTime createdAt) {
        }

        private record CancellableBookingRow(
                        Long bookingGroupId,
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
        public CreateBookingGroupResponse createBookingGroup(CreateBookingGroupRequest request) {
                String resourceName = request.resourceName().trim();
                Long resourceId = jdbcTemplate.query(
                                """
                                                SELECT r.id
                                                FROM "Resource" r
                                                WHERE LOWER(TRIM(COALESCE(r.name, ''))) = LOWER(TRIM(?))
                                                  AND r.availability = TRUE
                                                LIMIT 1
                                                """,
                                rs -> rs.next() ? rs.getLong("id") : null,
                                resourceName);

                if (resourceId == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No available resource found for name '" + resourceName + "'.");
                }

                String day = request.date().getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
                List<Long> slots = request.slots();

                Boolean available = checkRequestedSlotsAvailability(resourceId, request.date(), day, slots);
                if (!Boolean.TRUE.equals(available)) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Requested slots are not available for the selected resource and date.");
                }

                List<Long> slotIds = new ArrayList<>();
                for (Long slot : slots) {
                        Long slotId = jdbcTemplate.query(
                                        """
                                                        SELECT ds.slot_id
                                                        FROM "Ds_slot" ds
                                                        WHERE LOWER(TRIM(ds.day)) = LOWER(TRIM(?))
                                                          AND ds.slot = ?
                                                        LIMIT 1
                                                        """,
                                        rs -> rs.next() ? rs.getLong("slot_id") : null,
                                        day,
                                        slot);

                        if (slotId == null) {
                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "No slot_id found for day '" + day + "' and slot '" + slot + "'.");
                        }
                        slotIds.add(slotId);
                }

                Long firstBookingId = jdbcTemplate.queryForObject(
                                """
                                                INSERT INTO "Resource_booking" (attendees, date, timeslot_id, purpose, status, resource_id, user_id)
                                                VALUES (?, ?, ?, ?, ?, ?, ?)
                                                RETURNING booking_id
                                                """,
                                Long.class,
                                request.attendees(),
                                request.date(),
                                slotIds.get(0),
                                request.purpose().trim(),
                                "pending",
                                resourceId,
                                request.userId());

                if (firstBookingId == null) {
                        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                                        "Failed to create the initial booking row.");
                }

                jdbcTemplate.update(
                                """
                                                UPDATE "Resource_booking"
                                                SET booking_group_id = ?
                                                WHERE booking_id = ?
                                                """,
                                firstBookingId,
                                firstBookingId);

                List<Long> bookingIds = new ArrayList<>();
                bookingIds.add(firstBookingId);

                for (int i = 1; i < slotIds.size(); i++) {
                        Long bookingId = jdbcTemplate.queryForObject(
                                        """
                                                        INSERT INTO "Resource_booking" (attendees, date, timeslot_id, purpose, status, resource_id, user_id, booking_group_id)
                                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                                        RETURNING booking_id
                                                        """,
                                        Long.class,
                                        request.attendees(),
                                        request.date(),
                                        slotIds.get(i),
                                        request.purpose().trim(),
                                        "pending",
                                        resourceId,
                                        request.userId(),
                                        firstBookingId);

                        if (bookingId == null) {
                                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                                                "Failed to create one of the grouped booking rows.");
                        }
                        bookingIds.add(bookingId);
                }

                return new CreateBookingGroupResponse(
                                firstBookingId,
                                bookingIds,
                                "Booking group created successfully.");
        }

        @Transactional(readOnly = true)
        public List<String> getAllowedResourceTypesByRole(String roleName) {
                if ("student".equalsIgnoreCase(roleName)) {
                        return jdbcTemplate.query(
                                        """
                                                        SELECT DISTINCT r.type
                                                        FROM "Resource" r
                                                        WHERE LOWER(TRIM(COALESCE(r.type, ''))) NOT IN ('lab', 'lechall', 'lecturehall', 'lecturehalls')
                                                        ORDER BY r.type
                                                        """,
                                        (rs, rowNum) -> rs.getString("type"));
                }

                return jdbcTemplate.query(
                                """
                                                SELECT DISTINCT r.type
                                                FROM "Resource" r
                                                WHERE TRIM(COALESCE(r.type, '')) <> ''
                                                ORDER BY r.type
                                                """,
                                (rs, rowNum) -> rs.getString("type"));
        }

        private record PendingBookingRow(
                        Long bookingGroupId,
                        Long bookingId,
                        OffsetDateTime createdAt,
                        Long attendees,
                        LocalDate date,
                        Long slot,
                        String purpose,
                        String status,
                        Long resourceId,
                        String resourceName,
                        String reason,
                        Long userId) {
        }

        private record ResourceLookupRow(
                        Long id,
                        String name,
                        String type,
                        Boolean available) {
        }

        private static final class PendingBookingAccumulator {
                private final Long bookingGroupId;
                private final OffsetDateTime createdAt;
                private final Long attendees;
                private final LocalDate date;
                private final String purpose;
                private final String status;
                private final Long resourceId;
                private final String resourceName;
                private final String reason;
                private final Long userId;
                private final List<Long> bookingIds = new ArrayList<>();
                private final List<Long> slots = new ArrayList<>();

                private PendingBookingAccumulator(
                                Long bookingGroupId,
                                OffsetDateTime createdAt,
                                Long attendees,
                                LocalDate date,
                                String purpose,
                                String status,
                                Long resourceId,
                                String resourceName,
                                String reason,
                                Long userId) {
                        this.bookingGroupId = bookingGroupId;
                        this.createdAt = createdAt;
                        this.attendees = attendees;
                        this.date = date;
                        this.purpose = purpose;
                        this.status = status;
                        this.resourceId = resourceId;
                        this.resourceName = resourceName;
                        this.reason = reason;
                        this.userId = userId;
                }

                private PendingBookingAccumulator add(Long bookingId, Long slot) {
                        this.bookingIds.add(bookingId);
                        this.slots.add(slot);
                        return this;
                }

                private PendingBookingResponse toResponse() {
                        return new PendingBookingResponse(
                                        bookingGroupId,
                                        List.copyOf(bookingIds),
                                        createdAt,
                                        attendees,
                                        date,
                                        List.copyOf(slots),
                                        purpose,
                                        status,
                                        resourceId,
                                        resourceName,
                                        reason,
                                        userId);
                }
        }

        private List<PendingBookingResponse> viewBookingsByStatus(String status) {
                String sql = """
                                SELECT
                                    COALESCE(rb.booking_group_id, rb.booking_id) AS booking_group_id,
                                    rb.booking_id,
                                    rb.created_at,
                                    rb.attendees,
                                    rb.date,
                                    rb.timeslot_id,
                                    ds.slot,
                                    rb.purpose,
                                    rb.status,
                                    rb.resource_id,
                                    r.name AS resource_name,
                                    rb.user_id
                                FROM "Resource_booking" rb
                                INNER JOIN "Ds_slot" ds ON ds.slot_id = rb.timeslot_id
                                LEFT JOIN "Resource" r ON r.id = rb.resource_id
                                WHERE LOWER(TRIM(COALESCE(rb.status, ''))) = LOWER(TRIM(?))
                                ORDER BY COALESCE(rb.booking_group_id, rb.booking_id) DESC, rb.booking_id ASC
                                """;

                List<PendingBookingRow> rows = jdbcTemplate.query(
                                sql,
                                (rs, rowNum) -> new PendingBookingRow(
                                                rs.getLong("booking_group_id"),
                                                rs.getLong("booking_id"),
                                                rs.getObject("created_at", OffsetDateTime.class),
                                                (Long) rs.getObject("attendees"),
                                                rs.getObject("date", LocalDate.class),
                                                rs.getLong("slot"),
                                                rs.getString("purpose"),
                                                rs.getString("status"),
                                                (Long) rs.getObject("resource_id"),
                                                rs.getString("resource_name"),
                                                null,
                                                (Long) rs.getObject("user_id")),
                                status);

                Map<Long, PendingBookingAccumulator> grouped = new LinkedHashMap<>();
                for (PendingBookingRow row : rows) {
                        grouped.computeIfAbsent(
                                        row.bookingGroupId(),
                                        ignored -> new PendingBookingAccumulator(
                                                        row.bookingGroupId(),
                                                        row.createdAt(),
                                                        row.attendees(),
                                                        row.date(),
                                                        row.purpose(),
                                                        row.status(),
                                                        row.resourceId(),
                                                        row.resourceName(),
                                                        row.reason(),
                                                        row.userId()))
                                        .add(row.bookingId(), row.slot());
                }

                return grouped.values().stream()
                                .map(PendingBookingAccumulator::toResponse)
                                .toList();
        }

        private List<PendingBookingResponse> viewArchivedBookings(String sql) {
                List<PendingBookingRow> rows = jdbcTemplate.query(
                                sql,
                                (rs, rowNum) -> new PendingBookingRow(
                                                rs.getLong("booking_group_id"),
                                                rs.getLong("booking_id"),
                                                rs.getObject("created_at", OffsetDateTime.class),
                                                (Long) rs.getObject("attendees"),
                                                rs.getObject("date", LocalDate.class),
                                                rs.getLong("slot"),
                                                rs.getString("purpose"),
                                                rs.getString("status"),
                                                (Long) rs.getObject("resource_id"),
                                                rs.getString("resource_name"),
                                                rs.getString("reason"),
                                                (Long) rs.getObject("user_id")));

                Map<Long, PendingBookingAccumulator> grouped = new LinkedHashMap<>();
                for (PendingBookingRow row : rows) {
                        grouped.computeIfAbsent(
                                        row.bookingGroupId(),
                                        ignored -> new PendingBookingAccumulator(
                                                        row.bookingGroupId(),
                                                        row.createdAt(),
                                                        row.attendees(),
                                                        row.date(),
                                                        row.purpose(),
                                                        row.status(),
                                                        row.resourceId(),
                                                        row.resourceName(),
                                                        row.reason(),
                                                        row.userId()))
                                        .add(row.bookingId(), row.slot());
                }

                return grouped.values().stream()
                                .map(PendingBookingAccumulator::toResponse)
                                .toList();
        }
}
