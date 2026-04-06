package com.uninode.smartcampus.modules.facilities.dto;

public record FacilityCatalogItemResponse(
                Long id,
                String type,
                String name,
                Integer capacity,
                String location) {
}
