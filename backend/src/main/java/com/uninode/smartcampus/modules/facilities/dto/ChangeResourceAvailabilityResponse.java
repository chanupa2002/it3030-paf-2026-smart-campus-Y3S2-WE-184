package com.uninode.smartcampus.modules.facilities.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ChangeResourceAvailabilityResponse(
        @JsonProperty("resource_id")
        Long resourceId,

        @JsonProperty("available")
        boolean available,

        @JsonProperty("message")
        String message) {
}
