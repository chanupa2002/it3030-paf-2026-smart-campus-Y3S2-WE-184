package com.uninode.smartcampus.modules.booking.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PendingBookingResponse(
        @JsonProperty("booking_group_id") Long bookingGroupId,
        @JsonProperty("booking_ids") List<Long> bookingIds,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("attendees") Long attendees,
        @JsonProperty("date") LocalDate date,
        @JsonProperty("slots") List<Long> slots,
        @JsonProperty("purpose") String purpose,
        @JsonProperty("status") String status,
        @JsonProperty("resource_id") Long resourceId,
        @JsonProperty("resource_name") String resourceName,
        @JsonProperty("user_id") Long userId) {
}
