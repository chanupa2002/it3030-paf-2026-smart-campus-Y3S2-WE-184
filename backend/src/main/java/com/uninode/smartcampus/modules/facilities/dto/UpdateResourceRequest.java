package com.uninode.smartcampus.modules.facilities.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateResourceRequest(
        @Min(value = 1, message = "capacity must be at least 1 when provided")
        Integer capacity,

        @Size(max = 200, message = "location must be at most 200 characters")
        String location) {
}
