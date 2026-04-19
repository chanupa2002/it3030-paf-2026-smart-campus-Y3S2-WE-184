package com.uninode.smartcampus.modules.tickets.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddResolutionNotesRequest {

    @NotBlank(message = "Resolution notes cannot be empty")
    @Size(min = 3, max = 3000, message = "Resolution notes must be between 3 and 3000 characters")
    private String resolutionNotes;
}
