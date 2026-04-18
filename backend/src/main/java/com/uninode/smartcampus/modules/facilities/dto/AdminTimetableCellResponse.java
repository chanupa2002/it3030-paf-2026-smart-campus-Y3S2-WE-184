package com.uninode.smartcampus.modules.facilities.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AdminTimetableCellResponse(
        @JsonProperty("day") String day,
        @JsonProperty("slot") Long slot,
        @JsonProperty("slot_id") Long slotId,
        @JsonProperty("resource_ids") List<Long> resourceIds,
        @JsonProperty("resource_names") List<String> resourceNames) {
}
