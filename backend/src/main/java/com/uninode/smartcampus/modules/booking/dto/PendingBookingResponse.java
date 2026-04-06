package com.uninode.smartcampus.modules.booking.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PendingBookingResponse(
        @JsonProperty("booking_id")
        Long bookingId,
        @JsonProperty("created_at")
        OffsetDateTime createdAt,
        @JsonProperty("attendees")
        Long attendees,
        @JsonProperty("date")
        LocalDate date,
        @JsonProperty("timeslot_id")
        Long timeslotId,
        @JsonProperty("purpose")
        String purpose,
        @JsonProperty("status")
        String status,
        @JsonProperty("resource_id")
        Long resourceId,
        @JsonProperty("user_id")
        Long userId) {
}
