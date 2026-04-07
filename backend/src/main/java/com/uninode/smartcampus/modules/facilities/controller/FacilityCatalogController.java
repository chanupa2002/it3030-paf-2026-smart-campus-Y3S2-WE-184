package com.uninode.smartcampus.modules.facilities.controller;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.uninode.smartcampus.modules.facilities.dto.CreateResourceRequest;
import com.uninode.smartcampus.modules.facilities.dto.ChangeResourceAvailabilityRequest;
import com.uninode.smartcampus.modules.facilities.dto.ChangeResourceAvailabilityResponse;
import com.uninode.smartcampus.modules.facilities.dto.DeleteResourceFromSlotRequest;
import com.uninode.smartcampus.modules.facilities.dto.DsResourceResponse;
import com.uninode.smartcampus.modules.facilities.dto.FacilityCatalogItemResponse;
import com.uninode.smartcampus.modules.facilities.dto.AddResourceToSlotRequest;
import com.uninode.smartcampus.modules.facilities.dto.UpdateResourceRequest;
import com.uninode.smartcampus.modules.facilities.service.FacilityCatalogService;

@RestController
@RequestMapping("/api/facilities")
public class FacilityCatalogController {

    private final FacilityCatalogService facilityCatalogService;

    public FacilityCatalogController(FacilityCatalogService facilityCatalogService) {
        this.facilityCatalogService = facilityCatalogService;
    }

    @GetMapping
    public ResponseEntity<List<FacilityCatalogItemResponse>> getFacilitiesCatalog() {
        List<FacilityCatalogItemResponse> response = facilityCatalogService.getFacilitiesCatalog();
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/getResourceByType")
    public ResponseEntity<List<FacilityCatalogItemResponse>> getResourceByType(@RequestParam("type") String type) {
        String normalizedType = type == null ? "" : type.trim();
        if (normalizedType.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'type' is required.");
        }

        List<FacilityCatalogItemResponse> response = facilityCatalogService.getResourceByType(normalizedType);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/getResourceByName")
    public ResponseEntity<List<FacilityCatalogItemResponse>> getResourceByName(@RequestParam("name") String name) {
        String normalizedName = name == null ? "" : name.trim();
        if (normalizedName.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'name' is required.");
        }

        List<FacilityCatalogItemResponse> response = facilityCatalogService.getResourceByName(normalizedName);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @PostMapping("/createResource")
    public ResponseEntity<FacilityCatalogItemResponse> createResource(
            @Valid @RequestBody CreateResourceRequest request) {
        FacilityCatalogItemResponse response = facilityCatalogService.createResource(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @PutMapping("/updateResource/{id}")
    public ResponseEntity<FacilityCatalogItemResponse> updateResource(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateResourceRequest request) {
        FacilityCatalogItemResponse response = facilityCatalogService.updateResource(id, request);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @DeleteMapping("/deleteResource/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable("id") Long id) {
        facilityCatalogService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/addresourcetoSlot")
    public ResponseEntity<DsResourceResponse> addresourcetoSlot(
            @Valid @RequestBody AddResourceToSlotRequest request) {
        DsResourceResponse response = facilityCatalogService.addResourceToSlot(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @DeleteMapping("/removeResourceFromSlot")
    public ResponseEntity<Void> deleteResourceFromSlot(
            @Valid @RequestBody DeleteResourceFromSlotRequest request) {
        facilityCatalogService.deleteResourceFromSlot(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/isResourceInSlot")
    public ResponseEntity<Boolean> isResourceInSlot(
            @Valid @RequestBody DeleteResourceFromSlotRequest request) {
        boolean exists = facilityCatalogService.isResourceInSlot(request);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(exists);
    }

    @PostMapping("/changeResourceAvailability")
    public ResponseEntity<ChangeResourceAvailabilityResponse> changeResourceAvailability(
            @Valid @RequestBody ChangeResourceAvailabilityRequest request) {
        ChangeResourceAvailabilityResponse response = facilityCatalogService.changeResourceAvailability(request);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/GetDaybyDate")
    public ResponseEntity<String> getDaybyDate(@RequestParam("date") LocalDate date) {
        if (date == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Query parameter 'date' is required.");
        }

        String response = facilityCatalogService.getDayByDate(date);
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }
}
