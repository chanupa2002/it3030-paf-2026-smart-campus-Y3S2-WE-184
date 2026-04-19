package com.uninode.smartcampus.modules.tickets.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class TicketStatusConverter implements AttributeConverter<TicketStatus, String> {

    @Override
    public String convertToDatabaseColumn(TicketStatus attribute) {
        return attribute != null ? attribute.name() : null;
    }

    @Override
    public TicketStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }

        String normalized = dbData.trim();
        if (normalized.isEmpty()) {
            return null;
        }

        if ("solved".equalsIgnoreCase(normalized)) {
            return TicketStatus.RESOLVED;
        }

        if ("pending".equalsIgnoreCase(normalized)) {
            return TicketStatus.OPEN;
        }

        return TicketStatus.valueOf(normalized.toUpperCase());
    }
}
