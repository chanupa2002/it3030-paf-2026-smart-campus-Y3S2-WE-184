package com.uninode.smartcampus.modules.booking.dto;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateBookingGroupRequest(
        @JsonProperty("user_id")
        @NotNull(message = "user_id is required.")
        @Positive(message = "user_id must be greater than 0.")
        Long userId,
        @JsonProperty("resource_name")
        @NotBlank(message = "resource_name is required.")
        String resourceName,
        @JsonProperty("date")
        @NotNull(message = "date is required.")
        LocalDate date,
        @JsonProperty("attendees")
        @NotNull(message = "attendees is required.")
        @Positive(message = "attendees must be greater than 0.")
        Long attendees,
        @JsonProperty("purpose")
        @NotBlank(message = "purpose is required.")
        String purpose,
        @JsonProperty("slots")
        @NotEmpty(message = "slots is required.")
        List<@NotNull(message = "slots cannot contain null values.") @Positive(message = "slots must be greater than 0.") Long> slots) {
}
