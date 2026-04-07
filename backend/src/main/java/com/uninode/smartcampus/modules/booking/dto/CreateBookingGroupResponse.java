package com.uninode.smartcampus.modules.booking.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CreateBookingGroupResponse(
        @JsonProperty("booking_group")
        Long bookingGroup,
        @JsonProperty("booking_ids")
        List<Long> bookingIds,
        @JsonProperty("message")
        String message) {
}
