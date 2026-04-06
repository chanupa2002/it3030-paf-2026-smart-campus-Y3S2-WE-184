package com.uninode.smartcampus.modules.facilities.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ChangeResourceAvailabilityRequest(
        @JsonProperty("resource_id")
        @NotNull(message = "resource_id is required")
        @Positive(message = "resource_id must be greater than 0")
        Long resourceId,

        @JsonProperty("available")
        @NotNull(message = "available is required")
        JsonNode available) {
}
