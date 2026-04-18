package com.uninode.smartcampus.modules.booking.controller;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
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
import com.uninode.smartcampus.modules.booking.service.BookingSlotService;

@RestController
@RequestMapping("/api/bookings")
public class BookingSlotController {

    private final BookingSlotService bookingSlotService;

    public BookingSlotController(BookingSlotService bookingSlotService) {
        this.bookingSlotService = bookingSlotService;
    }

    @GetMapping("/getSlot_idByTimeDay")
    public ResponseEntity<SlotIdResponse> getSlotIdByTimeDay(
            @RequestParam("day") String day,
            @RequestParam("slot") Long slot) {
        String normalizedDay = day == null ? "" : day.trim();
        if (normalizedDay.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'day' is required.");
        }
        if (slot == null || slot <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'slot' must be greater than 0.");
        }

        SlotIdResponse response = bookingSlotService.getSlotIdByTimeDay(normalizedDay, slot);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/checkDynamicBooking")
    public ResponseEntity<Boolean> checkDynamicBooking(
            @RequestParam("resource_id") Long resourceId,
            @RequestParam("timeslot_id") Long timeslotId,
            @RequestParam("date") LocalDate date) {
        if (resourceId == null || resourceId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Query parameter 'resource_id' must be greater than 0.");
        }
        if (timeslotId == null || timeslotId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Query parameter 'timeslot_id' must be greater than 0.");
        }
        if (date == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'date' is required.");
        }

        Boolean response = bookingSlotService.checkDynamicBooking(resourceId, timeslotId, date);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/ViewPendingBookings")
    public ResponseEntity<List<PendingBookingResponse>> viewPendingBookings() {
        List<PendingBookingResponse> response = bookingSlotService.viewPendingBookings();
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/ViewApprovedBookings")
    public ResponseEntity<List<PendingBookingResponse>> viewApprovedBookings() {
        List<PendingBookingResponse> response = bookingSlotService.viewApprovedBookings();
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/ViewRejectedBookings")
    public ResponseEntity<List<PendingBookingResponse>> viewRejectedBookings() {
        List<PendingBookingResponse> response = bookingSlotService.viewRejectedBookings();
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/ViewCancelledBookings")
    public ResponseEntity<List<PendingBookingResponse>> viewCancelledBookings() {
        List<PendingBookingResponse> response = bookingSlotService.viewCancelledBookings();
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/getOccupiedSlotIdsByResourceDay")
    public ResponseEntity<List<Long>> getOccupiedSlotIdsByResourceDay(
            @RequestParam("resource_id") Long resourceId,
            @RequestParam("day") String day) {
        String normalizedDay = day == null ? "" : day.trim();
        if (resourceId == null || resourceId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Query parameter 'resource_id' must be greater than 0.");
        }
        if (normalizedDay.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'day' is required.");
        }

        List<Long> response = bookingSlotService.getOccupiedSlotIdsByResourceDay(resourceId, normalizedDay);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/getOccupiedTimeslotIdsByResourceDate")
    public ResponseEntity<List<Long>> getOccupiedTimeslotIdsByResourceDate(
            @RequestParam("resource_id") Long resourceId,
            @RequestParam("date") String dateString) {

        if (resourceId == null || resourceId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Query parameter 'resource_id' must be greater than 0.");
        }

        if (dateString == null || dateString.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'date' is required.");
        }

        LocalDate date;
        try {
            // .trim() completely destroys the <EOL> character before parsing
            date = LocalDate.parse(dateString.trim());
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid date format. Please use YYYY-MM-DD.");
        }

        List<Long> response = bookingSlotService.getOccupiedTimeslotIdsByResourceDate(resourceId, date);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/getAvailableSlotsByResourceDay")
    public ResponseEntity<List<AvailableSlotResponse>> getAvailableSlotsByResourceDay(
            @RequestParam("resource_id") Long resourceId,
            @RequestParam("day") String day,
            @RequestParam("date") String dateString) {
        String normalizedDay = day == null ? "" : day.trim();
        if (resourceId == null || resourceId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Query parameter 'resource_id' must be greater than 0.");
        }
        if (normalizedDay.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'day' is required.");
        }
        if (dateString == null || dateString.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'date' is required.");
        }

        LocalDate date;
        try {
            date = LocalDate.parse(dateString.trim());
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid date format. Please use YYYY-MM-DD.");
        }

        List<AvailableSlotResponse> response = bookingSlotService
                .getAvailableSlotsByResourceDay(resourceId, normalizedDay, date);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/checkRequestedSlotsAvailability")
    public ResponseEntity<Boolean> checkRequestedSlotsAvailability(
            @RequestParam("resource_id") Long resourceId,
            @RequestParam("date") String dateString,
            @RequestParam("day") String day,
            @RequestParam("slots") List<Long> slots) {
        String normalizedDay = day == null ? "" : day.trim();
        if (resourceId == null || resourceId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Query parameter 'resource_id' must be greater than 0.");
        }
        if (dateString == null || dateString.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'date' is required.");
        }
        if (normalizedDay.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'day' is required.");
        }
        if (slots == null || slots.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'slots' is required.");
        }
        if (slots.stream().anyMatch(slot -> slot == null || slot <= 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "All values in query parameter 'slots' must be greater than 0.");
        }

        LocalDate date;
        try {
            date = LocalDate.parse(dateString.trim());
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid date format. Please use YYYY-MM-DD.");
        }

        Boolean response = bookingSlotService
                .checkRequestedSlotsAvailability(resourceId, date, normalizedDay, slots);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/checkAvailabilityByResourceName")
    public ResponseEntity<Object> checkAvailabilityByResourceName(
            @RequestParam("name") String name,
            @RequestParam("roleName") String roleName,
            @RequestParam(value = "date", required = false) String dateString,
            @RequestParam(value = "slots", required = false) List<Long> slots) {
        String normalizedName = name == null ? "" : name.trim();
        String normalizedRoleName = roleName == null ? "" : roleName.trim();
        if (normalizedName.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'name' is required.");
        }
        if (normalizedRoleName.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'roleName' is required.");
        }
        if (dateString == null || dateString.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'date' is mandatory.");
        }

        LocalDate date;
        try {
            date = LocalDate.parse(dateString.trim());
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid date format. Please use YYYY-MM-DD.");
        }

        if (slots != null && slots.stream().anyMatch(slot -> slot == null || slot <= 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "All values in query parameter 'slots' must be greater than 0.");
        }

        Object response = bookingSlotService.checkAvailabilityByResourceName(normalizedName, date, slots, normalizedRoleName);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/getAvailableResourcesByType")
    public ResponseEntity<List<ResourceAvailabilityResponse>> getAvailableResourcesByType(
            @RequestParam("type") String type,
            @RequestParam("date") String dateString,
            @RequestParam("day") String day) {
        String normalizedType = type == null ? "" : type.trim();
        String normalizedDay = day == null ? "" : day.trim();
        if (normalizedType.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'type' is required.");
        }
        if (dateString == null || dateString.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'date' is required.");
        }
        if (normalizedDay.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'day' is required.");
        }

        LocalDate date;
        try {
            date = LocalDate.parse(dateString.trim());
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid date format. Please use YYYY-MM-DD.");
        }

        List<ResourceAvailabilityResponse> response = bookingSlotService
                .getAvailableResourcesByType(normalizedType, date, normalizedDay);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/getResourcesAvailableForSlotsByType")
    public ResponseEntity<List<ResourceSlotMatchResponse>> getResourcesAvailableForSlotsByType(
            @RequestParam("type") String type,
            @RequestParam("date") String dateString,
            @RequestParam("day") String day,
            @RequestParam("slots") List<Long> slots) {
        String normalizedType = type == null ? "" : type.trim();
        String normalizedDay = day == null ? "" : day.trim();
        if (normalizedType.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'type' is required.");
        }
        if (dateString == null || dateString.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'date' is required.");
        }
        if (normalizedDay.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'day' is required.");
        }
        if (slots == null || slots.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'slots' is required.");
        }
        if (slots.stream().anyMatch(slot -> slot == null || slot <= 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "All values in query parameter 'slots' must be greater than 0.");
        }

        LocalDate date;
        try {
            date = LocalDate.parse(dateString.trim());
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid date format. Please use YYYY-MM-DD.");
        }

        List<ResourceSlotMatchResponse> response = bookingSlotService
                .getResourcesAvailableForSlotsByType(normalizedType, date, normalizedDay, slots);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/searchAvailabilityByType")
    public ResponseEntity<Object> searchAvailabilityByType(
            @RequestParam("type") String type,
            @RequestParam(value = "date", required = false) String dateString,
            @RequestParam(value = "slots", required = false) List<Long> slots) {
        String normalizedType = type == null ? "" : type.trim();
        if (normalizedType.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'type' is required.");
        }
        if (dateString == null || dateString.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'date' should be selected.");
        }
        if (slots != null && slots.stream().anyMatch(slot -> slot == null || slot <= 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "All values in query parameter 'slots' must be greater than 0.");
        }

        LocalDate date;
        try {
            date = LocalDate.parse(dateString.trim());
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid date format. Please use YYYY-MM-DD.");
        }

        Object response = bookingSlotService.searchAvailabilityByType(normalizedType, date, slots);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @PostMapping("/rejectBooking")
    public ResponseEntity<RejectBookingResponse> rejectBooking(
            @Valid @RequestBody RejectBookingRequest request) {
        RejectBookingResponse response = bookingSlotService.rejectBooking(request);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @PostMapping("/approveBooking")
    public ResponseEntity<ApproveBookingResponse> approveBooking(
            @Valid @RequestBody ApproveBookingRequest request) {
        ApproveBookingResponse response = bookingSlotService.approveBooking(request);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @PostMapping("/cancelBooking")
    public ResponseEntity<CancelBookingResponse> cancelBooking(
            @Valid @RequestBody CancelBookingRequest request) {
        CancelBookingResponse response = bookingSlotService.cancelBooking(request);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @PostMapping("/createBookingGroup")
    public ResponseEntity<CreateBookingGroupResponse> createBookingGroup(
            @Valid @RequestBody CreateBookingGroupRequest request) {
        CreateBookingGroupResponse response = bookingSlotService.createBookingGroup(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/getAllowedResourceTypesByRole")
    public ResponseEntity<List<String>> getAllowedResourceTypesByRole(
            @RequestParam("roleName") String roleName) {
        String normalizedRoleName = roleName == null ? "" : roleName.trim();
        if (normalizedRoleName.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'roleName' is required.");
        }

        List<String> response = bookingSlotService.getAllowedResourceTypesByRole(normalizedRoleName);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }
}
