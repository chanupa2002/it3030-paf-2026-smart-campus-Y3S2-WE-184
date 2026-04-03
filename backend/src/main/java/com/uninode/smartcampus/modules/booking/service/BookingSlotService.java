package com.uninode.smartcampus.modules.booking.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.uninode.smartcampus.modules.booking.dto.SlotIdResponse;

import org.springframework.http.HttpStatus;

@Service
public class BookingSlotService {

    private final JdbcTemplate jdbcTemplate;

    public BookingSlotService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public SlotIdResponse getSlotIdByTimeDay(String day, Long slot) {
        String sql = """
                SELECT s.slot_id
                FROM "Ds_slot" s
                WHERE LOWER(TRIM(s.day)) = LOWER(TRIM(?))
                  AND s.slot = ?
                LIMIT 1
                """;

        Long slotId = jdbcTemplate.query(
                sql,
                rs -> rs.next() ? rs.getLong("slot_id") : null,
                day,
                slot);

        if (slotId == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "No slot found for day '" + day + "' and slot '" + slot + "'.");
        }
        return new SlotIdResponse(slotId);
    }
}
