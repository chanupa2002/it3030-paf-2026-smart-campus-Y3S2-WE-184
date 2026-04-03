package com.uninode.smartcampus.modules.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record SlotIdResponse(
        @JsonProperty("slot_id")
        Long slotId) {
}
