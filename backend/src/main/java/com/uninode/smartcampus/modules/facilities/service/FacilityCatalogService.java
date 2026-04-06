package com.uninode.smartcampus.modules.facilities.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.uninode.smartcampus.modules.facilities.dto.AddResourceToSlotRequest;
import com.uninode.smartcampus.modules.facilities.dto.ChangeResourceAvailabilityRequest;
import com.uninode.smartcampus.modules.facilities.dto.ChangeResourceAvailabilityResponse;
import com.uninode.smartcampus.modules.facilities.dto.CreateResourceRequest;
import com.uninode.smartcampus.modules.facilities.dto.DeleteResourceFromSlotRequest;
import com.uninode.smartcampus.modules.facilities.dto.DsResourceResponse;
import com.uninode.smartcampus.modules.facilities.dto.FacilityCatalogItemResponse;
import com.uninode.smartcampus.modules.facilities.dto.UpdateResourceRequest;
import com.uninode.smartcampus.modules.facilities.entity.ResourceEntity;
import com.uninode.smartcampus.modules.facilities.exception.ResourceAlreadyExistsException;
import com.uninode.smartcampus.modules.facilities.exception.ResourceNotFoundException;
import com.uninode.smartcampus.modules.facilities.repository.ResourceRepository;

@Service
public class FacilityCatalogService {

    private final ResourceRepository resourceRepository;
    private final JdbcTemplate jdbcTemplate;

    public FacilityCatalogService(ResourceRepository resourceRepository, JdbcTemplate jdbcTemplate) {
        this.resourceRepository = resourceRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<FacilityCatalogItemResponse> getFacilitiesCatalog() {
        return toResponse(resourceRepository.findAllResources());
    }

    @Transactional(readOnly = true)
    public List<FacilityCatalogItemResponse> getResourceByType(String type) {
        return toResponse(resourceRepository.findResourcesByType(type));
    }

    @Transactional(readOnly = true)
    public List<FacilityCatalogItemResponse> getResourceByName(String name) {
        return toResponse(resourceRepository.findResourcesByName(name));
    }

    @Transactional
    public FacilityCatalogItemResponse createResource(CreateResourceRequest request) {
        String normalizedName = request.name().trim();
        if (resourceRepository.existsResourceByName(normalizedName)) {
            throw new ResourceAlreadyExistsException("Resource already exists with name: " + normalizedName);
        }

        String sql = """
                INSERT INTO "Resource" (type, name, capacity, location)
                VALUES (?, ?, ?, ?)
                RETURNING id, type, name, capacity, location
                """;

        return jdbcTemplate.queryForObject(
                sql,
                (rs, rowNum) -> new FacilityCatalogItemResponse(
                        rs.getLong("id"),
                        rs.getString("type"),
                        rs.getString("name"),
                        (Integer) rs.getObject("capacity"),
                        rs.getString("location")),
                request.type().trim(),
                normalizedName,
                request.capacity(),
                request.location().trim());
    }

    @Transactional
    public FacilityCatalogItemResponse updateResource(Long id, UpdateResourceRequest request) {
        ResourceEntity existing = resourceRepository.findResourceById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found for id: " + id));

        Integer updatedCapacity = request.capacity() != null ? request.capacity() : existing.getCapacity();
        String updatedLocation = request.location() != null ? request.location().trim() : existing.getLocation();

        if (request.capacity() == null && request.location() == null) {
            throw new IllegalArgumentException("At least one field must be provided: capacity or location.");
        }
        if (request.location() != null && updatedLocation.isEmpty()) {
            throw new IllegalArgumentException("location cannot be blank when provided.");
        }

        String sql = """
                UPDATE "Resource"
                SET capacity = ?, location = ?
                WHERE id = ?
                RETURNING id, type, name, capacity, location
                """;

        return jdbcTemplate.queryForObject(
                sql,
                (rs, rowNum) -> new FacilityCatalogItemResponse(
                        rs.getLong("id"),
                        rs.getString("type"),
                        rs.getString("name"),
                        (Integer) rs.getObject("capacity"),
                        rs.getString("location")),
                updatedCapacity,
                updatedLocation,
                id);
    }

    @Transactional
    public void deleteResource(Long id) {
        if (!resourceRepository.existsResourceById(id)) {
            throw new ResourceNotFoundException("Resource not found for id: " + id);
        }

        String sql = """
                DELETE FROM "Resource"
                WHERE id = ?
                """;
        int affectedRows = jdbcTemplate.update(sql, id);
        if (affectedRows == 0) {
            throw new ResourceNotFoundException("Resource not found for id: " + id);
        }
    }

    @Transactional
    public DsResourceResponse addResourceToSlot(AddResourceToSlotRequest request) {
        Long slotId = request.slotId();
        Long resourceId = request.resourceId();

        Boolean slotExists = jdbcTemplate.query(
                """
                        SELECT EXISTS(
                            SELECT 1 FROM "Ds_slot" s WHERE s.slot_id = ?
                        )
                        """,
                rs -> rs.next() ? rs.getBoolean(1) : Boolean.FALSE,
                slotId);
        if (!Boolean.TRUE.equals(slotExists)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "slot_id not found: " + slotId);
        }

        String resourceType = jdbcTemplate.query(
                """
                        SELECT r.type
                        FROM "Resource" r
                        WHERE r.id = ?
                        LIMIT 1
                        """,
                rs -> rs.next() ? rs.getString("type") : null,
                resourceId);
        if (resourceType == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "resource_id not found: " + resourceId);
        }

        String normalizedType = resourceType.trim().toLowerCase(Locale.ROOT);
        if (!normalizedType.equals("lab") && !normalizedType.equals("lechall")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only resources with type 'Lab' or 'LecHall' can be added to Ds_resource.");
        }

        Boolean alreadyExists = jdbcTemplate.query(
                """
                        SELECT EXISTS(
                            SELECT 1
                            FROM "Ds_resource" dr
                            WHERE dr.slot_id = ? AND dr.resource_id = ?
                        )
                        """,
                rs -> rs.next() ? rs.getBoolean(1) : Boolean.FALSE,
                slotId,
                resourceId);
        if (Boolean.TRUE.equals(alreadyExists)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This resource is already assigned to the given slot.");
        }

        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO "Ds_resource" (slot_id, resource_id)
                        VALUES (?, ?)
                        RETURNING slot_id, resource_id
                        """,
                (rs, rowNum) -> new DsResourceResponse(
                        rs.getLong("slot_id"),
                        rs.getLong("resource_id")),
                slotId,
                resourceId);
    }

    @Transactional
    public void deleteResourceFromSlot(DeleteResourceFromSlotRequest request) {
        int affectedRows = jdbcTemplate.update(
                """
                        DELETE FROM "Ds_resource"
                        WHERE slot_id = ? AND resource_id = ?
                        """,
                request.slotId(),
                request.resourceId());

        if (affectedRows == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "No Ds_resource mapping found for slot_id '" + request.slotId()
                            + "' and resource_id '" + request.resourceId() + "'.");
        }
    }

    @Transactional(readOnly = true)
    public String getDayByDate(LocalDate date) {
        return date.getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, Locale.ENGLISH);
    }

    private List<FacilityCatalogItemResponse> toResponse(List<ResourceEntity> rows) {
        return rows.stream().map(this::toItem).toList();
    }

    private FacilityCatalogItemResponse toItem(ResourceEntity row) {
        return new FacilityCatalogItemResponse(
                row.getId(),
                row.getType(),
                row.getName(),
                row.getCapacity(),
                row.getLocation());
    }
}
