package com.uninode.smartcampus.modules.booking.controller;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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
}
