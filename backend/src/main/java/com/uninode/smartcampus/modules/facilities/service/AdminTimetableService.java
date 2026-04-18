package com.uninode.smartcampus.modules.facilities.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.uninode.smartcampus.modules.facilities.dto.AdminTimetableCellResponse;

@Service
public class AdminTimetableService {

    private final JdbcTemplate jdbcTemplate;

    public AdminTimetableService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<AdminTimetableCellResponse> getStaticTimetable() {
        String sql = """
                SELECT
                    ds.slot_id,
                    ds.day,
                    ds.slot,
                    dr.resource_id,
                    r.name AS resource_name
                FROM "Ds_slot" ds
                LEFT JOIN "Ds_resource" dr ON dr.slot_id = ds.slot_id
                LEFT JOIN "Resource" r ON r.id = dr.resource_id
                ORDER BY
                    CASE LOWER(TRIM(ds.day))
                        WHEN 'monday' THEN 1
                        WHEN 'tuesday' THEN 2
                        WHEN 'wednesday' THEN 3
                        WHEN 'thursday' THEN 4
                        WHEN 'friday' THEN 5
                        WHEN 'saturday' THEN 6
                        WHEN 'sunday' THEN 7
                        ELSE 8
                    END,
                    ds.slot,
                    r.name
                """;

        List<AdminTimetableRow> rows = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new AdminTimetableRow(
                        rs.getLong("slot_id"),
                        rs.getString("day"),
                        rs.getLong("slot"),
                        (Long) rs.getObject("resource_id"),
                        rs.getString("resource_name")));

        Map<String, AdminTimetableAccumulator> grouped = new LinkedHashMap<>();
        for (AdminTimetableRow row : rows) {
            String normalizedDay = row.day() == null ? "" : row.day().trim().toLowerCase(Locale.ROOT);
            String key = normalizedDay + ":" + row.slotId();
            grouped.computeIfAbsent(
                    key,
                    ignored -> new AdminTimetableAccumulator(
                            row.day(),
                            row.slot(),
                            row.slotId()))
                    .addResourceId(row.resourceId())
                    .addResourceName(row.resourceName());
        }

        return grouped.values().stream()
                .map(AdminTimetableAccumulator::toResponse)
                .toList();
    }

    private record AdminTimetableRow(
            Long slotId,
            String day,
            Long slot,
            Long resourceId,
            String resourceName) {
    }

    private static final class AdminTimetableAccumulator {
        private final String day;
        private final Long slot;
        private final Long slotId;
        private final List<Long> resourceIds = new ArrayList<>();
        private final List<String> resourceNames = new ArrayList<>();

        private AdminTimetableAccumulator(String day, Long slot, Long slotId) {
            this.day = day;
            this.slot = slot;
            this.slotId = slotId;
        }

        private AdminTimetableAccumulator addResourceId(Long resourceId) {
            if (resourceId != null) {
                resourceIds.add(resourceId);
            }
            return this;
        }

        private AdminTimetableAccumulator addResourceName(String resourceName) {
            if (resourceName != null && !resourceName.isBlank()) {
                resourceNames.add(resourceName);
            }
            return this;
        }

        private AdminTimetableCellResponse toResponse() {
            return new AdminTimetableCellResponse(
                    day,
                    slot,
                    slotId,
                    List.copyOf(resourceIds),
                    List.copyOf(resourceNames));
        }
    }
}
