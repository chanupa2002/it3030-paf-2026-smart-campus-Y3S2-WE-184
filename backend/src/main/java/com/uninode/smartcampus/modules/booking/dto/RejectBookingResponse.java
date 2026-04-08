package com.uninode.smartcampus.modules.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RejectBookingResponse(
                @JsonProperty("booking_group_id") Long bookingGroupId,
                @JsonProperty("message") String message) {
}
