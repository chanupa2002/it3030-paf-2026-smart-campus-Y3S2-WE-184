package com.uninode.smartcampus.modules.facilities.controller;

import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.uninode.smartcampus.modules.facilities.dto.AdminTimetableCellResponse;
import com.uninode.smartcampus.modules.facilities.service.AdminTimetableService;

@RestController
@RequestMapping("/api/admin-timetable")
public class AdminTimetableController {

    private final AdminTimetableService adminTimetableService;

    public AdminTimetableController(AdminTimetableService adminTimetableService) {
        this.adminTimetableService = adminTimetableService;
    }

    @GetMapping("/static-grid")
    public ResponseEntity<List<AdminTimetableCellResponse>> getStaticTimetable() {
        List<AdminTimetableCellResponse> response = adminTimetableService.getStaticTimetable();
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }
}
