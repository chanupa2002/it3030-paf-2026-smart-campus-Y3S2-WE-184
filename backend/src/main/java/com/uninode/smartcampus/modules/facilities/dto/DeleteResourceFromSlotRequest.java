package com.uninode.smartcampus.modules.facilities.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record DeleteResourceFromSlotRequest(
        @JsonProperty("slot_id")
        @NotNull(message = "slot_id is required")
        @Positive(message = "slot_id must be greater than 0")
        Long slotId,

        @JsonProperty("resource_id")
        @NotNull(message = "resource_id is required")
        @Positive(message = "resource_id must be greater than 0")
        Long resourceId) {
}
