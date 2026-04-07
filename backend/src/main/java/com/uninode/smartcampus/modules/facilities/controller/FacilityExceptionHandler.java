package com.uninode.smartcampus.modules.facilities.controller;

import java.time.OffsetDateTime;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import com.uninode.smartcampus.modules.facilities.dto.ApiErrorResponse;
import com.uninode.smartcampus.modules.facilities.exception.ResourceAlreadyExistsException;
import com.uninode.smartcampus.modules.facilities.exception.ResourceNotFoundException;

@RestControllerAdvice(basePackages = "com.uninode.smartcampus.modules.facilities")
public class FacilityExceptionHandler {

        @ExceptionHandler(ResourceAlreadyExistsException.class)
        public ResponseEntity<ApiErrorResponse> handleResourceAlreadyExists(
                        ResourceAlreadyExistsException ex,
                        HttpServletRequest request) {
                ApiErrorResponse response = new ApiErrorResponse(
                                OffsetDateTime.now(),
                                HttpStatus.CONFLICT.value(),
                                HttpStatus.CONFLICT.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ApiErrorResponse> handleResourceNotFound(
                        ResourceNotFoundException ex,
                        HttpServletRequest request) {
                ApiErrorResponse response = new ApiErrorResponse(
                                OffsetDateTime.now(),
                                HttpStatus.NOT_FOUND.value(),
                                HttpStatus.NOT_FOUND.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiErrorResponse> handleValidation(
                        MethodArgumentNotValidException ex,
                        HttpServletRequest request) {
                String message = ex.getBindingResult().getFieldErrors().stream()
                                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                                .collect(Collectors.joining("; "));

                ApiErrorResponse response = new ApiErrorResponse(
                                OffsetDateTime.now(),
                                HttpStatus.BAD_REQUEST.value(),
                                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                                message,
                                request.getRequestURI());
                return ResponseEntity.badRequest().body(response);
        }

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ApiErrorResponse> handleDataIntegrity(
                        DataIntegrityViolationException ex,
                        HttpServletRequest request) {
                String requestPath = request.getRequestURI();
                String message = "Resource violates a database constraint (possibly duplicate name).";

                if (requestPath != null && requestPath.contains("/deleteResource/")) {
                        message = "This resource having current booking, so cancel them first and try to delete the resource.";
                }

                ApiErrorResponse response = new ApiErrorResponse(
                                OffsetDateTime.now(),
                                HttpStatus.CONFLICT.value(),
                                HttpStatus.CONFLICT.getReasonPhrase(),
                                message,
                                requestPath);
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
                        IllegalArgumentException ex,
                        HttpServletRequest request) {
                ApiErrorResponse response = new ApiErrorResponse(
                                OffsetDateTime.now(),
                                HttpStatus.BAD_REQUEST.value(),
                                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        @ExceptionHandler(ResponseStatusException.class)
        public ResponseEntity<ApiErrorResponse> handleResponseStatus(
                        ResponseStatusException ex,
                        HttpServletRequest request) {
                ApiErrorResponse response = new ApiErrorResponse(
                                OffsetDateTime.now(),
                                ex.getStatusCode().value(),
                                ex.getStatusCode().toString(),
                                ex.getReason(),
                                request.getRequestURI());
                return ResponseEntity.status(ex.getStatusCode()).body(response);
        }
}
