package com.uninode.smartcampus.modules.tickets.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.uninode.smartcampus.modules.tickets.dto.AttachmentResponse;
import com.uninode.smartcampus.modules.tickets.entity.Ticket;
import com.uninode.smartcampus.modules.tickets.exception.InvalidFileTypeException;
import com.uninode.smartcampus.modules.tickets.exception.MaxAttachmentsExceededException;
import com.uninode.smartcampus.modules.tickets.exception.TicketNotFoundException;
import com.uninode.smartcampus.modules.tickets.exception.TicketUnauthorizedException;
import com.uninode.smartcampus.modules.tickets.repository.TicketRepository;
import com.uninode.smartcampus.modules.users.entity.User;
import com.uninode.smartcampus.modules.users.repository.UserRepository;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class TicketAttachmentService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final SupabaseStorageService supabaseStorageService;

    private static final int MAX_ATTACHMENTS = 3;

    public AttachmentResponse uploadAttachment(Long ticketId, MultipartFile file, Long userId) throws IOException, InvalidFileTypeException {
        List<AttachmentResponse> res = uploadAttachments(ticketId, new MultipartFile[]{file}, userId);
        return res.get(0);
    }

    public List<AttachmentResponse> uploadAttachments(Long ticketId, MultipartFile[] files, Long userId) throws IOException, InvalidFileTypeException {
        if (files == null || files.length == 0) {
            throw new InvalidFileTypeException("No files provided");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        // Only ticket creator can upload
        Long ownerId = ticket.getRaisedUser() != null ? ticket.getRaisedUser().getUserId() : null;
        if (ownerId == null || !ownerId.equals(userId)) {
            throw new TicketUnauthorizedException("Only the ticket creator can upload attachments");
        }

        // Get current images list from JSONB
        List<String> currentImages = getImageList(ticket.getImages());
        if (currentImages.size() + files.length > MAX_ATTACHMENTS) {
            throw new MaxAttachmentsExceededException("Cannot upload more than " + MAX_ATTACHMENTS + " attachments per ticket");
        }

        List<AttachmentResponse> responses = new ArrayList<>();
        List<String> signedUrls = new ArrayList<>(currentImages);
        List<String> uploadedFileNames = new ArrayList<>();

        try {
            for (MultipartFile file : files) {
                // Upload to Supabase and get signed URL
                String signedUrl = supabaseStorageService.uploadFile(file);
                signedUrls.add(signedUrl);
                uploadedFileNames.add(extractFileNameFromUrl(file.getOriginalFilename()));

                AttachmentResponse response = AttachmentResponse.builder()
                        .fileName(file.getOriginalFilename())
                        .filePath(signedUrl)  // Store signed URL instead of local path
                        .fileSize(file.getSize())
                        .fileType(file.getContentType())
                        .build();
                responses.add(response);
            }

            // Update ticket with Supabase signed URLs
            ticket.setImages(objectMapper.writeValueAsString(signedUrls));
            ticketRepository.save(ticket);
            log.info("Ticket {} updated with {} new attachments", ticketId, files.length);

        } catch (IOException e) {
            // Cleanup: Delete uploaded files from Supabase if error occurs
            log.error("Error during attachment upload for ticket {}: {}", ticketId, e.getMessage());
            for (String fileName : uploadedFileNames) {
                try {
                    supabaseStorageService.deleteFile(fileName);
                } catch (Exception ignored) {
                    log.warn("Failed to cleanup file: {}", fileName);
                }
            }
            throw e;
        }

        return responses;
    }

    public List<AttachmentResponse> getAttachmentsByTicket(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        List<String> imagePaths = getImageList(ticket.getImages());
        List<AttachmentResponse> responses = new ArrayList<>();

        for (int i = 0; i < imagePaths.size(); i++) {
            String imagePath = imagePaths.get(i);
            responses.add(AttachmentResponse.builder()
                    .fileName(extractFileNameFromPath(imagePath))
                    .filePath(imagePath)
                    .index(i)
                    .build());
        }

        return responses;
    }

    // deleteAttachment removed: deletion of uploaded files is disabled per configuration.

    /**
     * Helper: Parse JSONB images column to List<String> of signed URLs
     */
    private List<String> getImageList(String imagesJson) {
        if (imagesJson == null || imagesJson.isEmpty() || "null".equals(imagesJson)) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(imagesJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse images JSON: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Extract original filename from upload (removed validation - delegated to SupabaseStorageService)
     */
    private String extractFileNameFromUrl(String originalFileName) {
        if (originalFileName == null || originalFileName.isEmpty()) {
            return "";
        }
        // Return just the filename without path
        return originalFileName.substring(Math.max(0, originalFileName.lastIndexOf("/")));
    }

    /**
     * Extract filename from signed URL (for display purposes)
     */
    private String extractFileNameFromPath(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return "attachment";
        }
        // For signed URLs, just return a generic name or the actual filename if present
        return "attachment";
    }
}
