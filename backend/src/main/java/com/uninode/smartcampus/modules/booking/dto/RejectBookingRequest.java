package com.uninode.smartcampus.modules.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RejectBookingRequest(
                @JsonProperty("booking_group_id") @NotNull(message = "booking_group_id is required.") @Positive(message = "booking_group_id must be greater than 0.") Long bookingGroupId,
                @JsonProperty("reject_reason") @NotBlank(message = "reject_reason is required.") String rejectReason) {
}
