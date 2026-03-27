package com.uninode.smartcampus.modules.facilities.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record FacilityCatalogResponse(
        Integer count,
        OffsetDateTime generatedAt,
        List<FacilityCatalogItemResponse> items) {
}
