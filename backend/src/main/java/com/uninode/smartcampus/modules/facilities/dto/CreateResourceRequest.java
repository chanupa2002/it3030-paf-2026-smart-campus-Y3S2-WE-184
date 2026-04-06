package com.uninode.smartcampus.modules.facilities.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateResourceRequest(
                @NotBlank(message = "type is required") @Size(max = 100, message = "type must be at most 100 characters") String type,

                @NotBlank(message = "name is required") @Size(max = 150, message = "name must be at most 150 characters") String name,

                @Min(value = 1, message = "capacity must be at least 1 when provided") Integer capacity,

                @NotBlank(message = "location is required") @Size(max = 200, message = "location must be at most 200 characters") String location) {
}
