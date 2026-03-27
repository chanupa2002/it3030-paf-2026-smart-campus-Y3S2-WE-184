package com.uninode.smartcampus.modules.facilities.service;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.uninode.smartcampus.modules.facilities.dto.CreateResourceRequest;
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
