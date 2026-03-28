package com.uninode.smartcampus.modules.facilities.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DsResourceResponse(
        @JsonProperty("slot_id")
        Long slotId,

        @JsonProperty("resource_id")
        Long resourceId) {
}
