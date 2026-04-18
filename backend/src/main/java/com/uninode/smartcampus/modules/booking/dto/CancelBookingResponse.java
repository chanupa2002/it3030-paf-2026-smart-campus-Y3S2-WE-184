package com.uninode.smartcampus.modules.booking.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CancelBookingResponse(
        @JsonProperty("booking_group_id")
        Long bookingGroupId,
        @JsonProperty("booking_ids")
        List<Long> bookingIds,
        @JsonProperty("message")
        String message) {
}
