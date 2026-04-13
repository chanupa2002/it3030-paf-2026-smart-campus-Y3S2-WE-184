package com.uninode.smartcampus.modules.tickets.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/api/tickets/images")
@RequiredArgsConstructor
public class ImageProxyController {

    private final OkHttpClient httpClient = new OkHttpClient();

    @GetMapping("/proxy")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> proxyImage(@RequestParam String url) {
        try {
            log.info("Proxying image from URL: {}", url);
            
            // Validate URL
            if (url == null || url.isEmpty()) {
                log.error("Empty URL provided");
                return ResponseEntity.badRequest().build();
            }
            
            Request request = new Request.Builder()
                    .url(url)
                    .get()
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                log.info("Supabase response code: {}", response.code());
                
                if (!response.isSuccessful()) {
                    String errorBody = response.body() != null ? response.body().string() : "No error body";
                    log.error("Failed to fetch image: {} - {}", response.code(), errorBody);
                    return ResponseEntity.status(response.code()).build();
                }

                byte[] imageBytes = response.body().bytes();
                String contentType = response.header("Content-Type", "image/png");
                
                log.info("Successfully fetched image: {} bytes, type: {}", imageBytes.length, contentType);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.parseMediaType(contentType));
                headers.setContentLength(imageBytes.length);
                headers.set("Content-Disposition", "attachment");

                return ResponseEntity.ok()
                        .headers(headers)
                        .body(imageBytes);
            }
        } catch (Exception e) {
            log.error("Error proxying image: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
