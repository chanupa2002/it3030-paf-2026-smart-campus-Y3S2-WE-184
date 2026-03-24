package com.uninode.smartcampus.modules.facilities.service;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.uninode.smartcampus.modules.facilities.dto.CreateResourceRequest;
import com.uninode.smartcampus.modules.facilities.dto.FacilityCatalogItemResponse;
import com.uninode.smartcampus.modules.facilities.entity.ResourceEntity;
import com.uninode.smartcampus.modules.facilities.exception.ResourceAlreadyExistsException;
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
