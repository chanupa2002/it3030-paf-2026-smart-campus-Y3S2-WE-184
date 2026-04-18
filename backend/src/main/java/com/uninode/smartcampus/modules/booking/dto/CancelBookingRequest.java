package com.uninode.smartcampus.modules.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CancelBookingRequest(
        @JsonProperty("booking_group_id")
        @NotNull(message = "booking_group_id is required.")
        @Positive(message = "booking_group_id must be greater than 0.")
        Long bookingGroupId,
        @JsonProperty("user_id")
        @NotNull(message = "user_id is required.")
        @Positive(message = "user_id must be greater than 0.")
        Long userId) {
}
