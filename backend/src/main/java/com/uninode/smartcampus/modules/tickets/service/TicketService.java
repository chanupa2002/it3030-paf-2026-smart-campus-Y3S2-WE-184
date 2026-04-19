package com.uninode.smartcampus.modules.tickets.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import com.uninode.smartcampus.modules.tickets.dto.AssignTechnicianRequest;
import com.uninode.smartcampus.modules.tickets.dto.AddResolutionNotesRequest;
import com.uninode.smartcampus.modules.tickets.dto.AttachmentResponse;
import com.uninode.smartcampus.modules.tickets.dto.CreateTicketRequest;
import com.uninode.smartcampus.modules.tickets.dto.TicketFilterRequest;
import com.uninode.smartcampus.modules.tickets.dto.TicketResponse;
import com.uninode.smartcampus.modules.tickets.dto.UpdateTicketStatusRequest;
import com.uninode.smartcampus.modules.tickets.entity.Priority;
import com.uninode.smartcampus.modules.tickets.entity.Ticket;
import com.uninode.smartcampus.modules.tickets.entity.TicketStatus;
import com.uninode.smartcampus.modules.tickets.exception.InvalidStatusTransitionException;
import com.uninode.smartcampus.modules.tickets.exception.TicketNotFoundException;
import com.uninode.smartcampus.modules.tickets.exception.TicketUnauthorizedException;
import com.uninode.smartcampus.modules.tickets.repository.TicketRepository;
import com.uninode.smartcampus.modules.users.entity.User;
import com.uninode.smartcampus.modules.users.repository.UserRepository;
import com.uninode.smartcampus.modules.facilities.entity.ResourceEntity;
import com.uninode.smartcampus.modules.facilities.repository.ResourceRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
@lombok.extern.slf4j.Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final ObjectMapper objectMapper;
    private final SupabaseStorageService supabaseStorageService;

    private static final Map<TicketStatus, Set<TicketStatus>> VALID_TRANSITIONS = new HashMap<>();

    static {
        // Define valid status transitions
        VALID_TRANSITIONS.put(TicketStatus.OPEN, EnumSet.of(
                TicketStatus.IN_PROGRESS, TicketStatus.REJECTED));
        VALID_TRANSITIONS.put(TicketStatus.IN_PROGRESS, EnumSet.of(
                TicketStatus.RESOLVED, TicketStatus.REJECTED));
        VALID_TRANSITIONS.put(TicketStatus.RESOLVED, EnumSet.of(
                TicketStatus.CLOSED));
        VALID_TRANSITIONS.put(TicketStatus.CLOSED, EnumSet.noneOf(TicketStatus.class));
        VALID_TRANSITIONS.put(TicketStatus.REJECTED, EnumSet.of(
                TicketStatus.OPEN));
    }

    public TicketResponse createTicket(CreateTicketRequest request, Long userId) {
        User raisedUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        ResourceEntity resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));

        Ticket ticket = Ticket.builder()
                .raisedUser(raisedUser)
                .resource(resource)
                .description(request.getDescription())
                .priority(request.getPriority())
                .contactNumber(request.getContactNumber())
                .category(request.getCategory())
                .status(TicketStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);
        return mapToResponse(savedTicket);
    }

    public TicketResponse getTicket(Long ticketId, Long userId, boolean isAdmin) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        // Check authorization
        if (!isAdmin && !ticket.getRaisedUser().getUserId().equals(userId) &&
                (ticket.getAssignedUser() == null || !ticket.getAssignedUser().getUserId().equals(userId))) {
            throw new TicketUnauthorizedException("You are not authorized to view this ticket");
        }

        return mapToResponse(ticket);
    }

    public Page<TicketResponse> getAllTickets(TicketFilterRequest filter, Long userId, boolean isAdmin, boolean isTechnician) {
        int pageNumber = filter.getPageNumber() != null ? filter.getPageNumber() : 0;
        int pageSize = filter.getPageSize() != null ? filter.getPageSize() : 10;
        String sortBy = filter.getSortBy() != null ? filter.getSortBy() : "createdAt";
        String sortOrder = filter.getSortOrder() != null ? filter.getSortOrder() : "DESC";

        Sort.Direction direction = Sort.Direction.fromString(sortOrder);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(direction, sortBy));

        Page<Ticket> tickets;

        if (isAdmin) {
            // Admin users can see all tickets with filters
            if (filter.getStatus() != null && filter.getPriority() != null) {
                tickets = ticketRepository.findByStatusAndPriority(filter.getStatus(), filter.getPriority(), pageable);
            } else if (filter.getStatus() != null) {
                tickets = ticketRepository.findByStatus(filter.getStatus(), pageable);
            } else if (filter.getPriority() != null) {
                tickets = ticketRepository.findByPriority(filter.getPriority(), pageable);
            } else if (filter.getResourceId() != null) {
                tickets = ticketRepository.findByResourceId(filter.getResourceId(), pageable);
            } else {
                tickets = ticketRepository.findAll(pageable);
            }
        } else if (isTechnician) {
            // Technicians see ONLY tickets assigned to them
            if (filter.getStatus() != null) {
                tickets = ticketRepository.findByAssignedUserIdAndStatus(userId, filter.getStatus(), pageable);
            } else {
                tickets = ticketRepository.findByAssignedUserId(userId, pageable);
            }
        } else {
            // Other users (Students) see ONLY tickets they raised
            if (filter.getStatus() != null) {
                tickets = ticketRepository.findByRaisedUserIdAndStatus(userId, filter.getStatus(), pageable);
            } else {
                tickets = ticketRepository.findByRaisedUserId(userId, pageable);
            }
        }

        return tickets.map(this::mapToResponse);
    }

    public TicketResponse updateTicketStatus(Long ticketId, UpdateTicketStatusRequest request, Long userId, boolean isAdmin) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        // Validate authorization - only admin or assigned technician
        if (!isAdmin && (ticket.getAssignedUser() == null || !ticket.getAssignedUser().getUserId().equals(userId))) {
            throw new TicketUnauthorizedException("Only assigned technician or admin can update ticket status");
        }

        // Validate status transition
        Set<TicketStatus> validNextStatuses = VALID_TRANSITIONS.get(ticket.getStatus());
        if (validNextStatuses == null || !validNextStatuses.contains(request.getStatus())) {
            throw new InvalidStatusTransitionException(ticket.getStatus(), request.getStatus());
        }

        // If rejecting, store rejection reason in resolution notes
        if (request.getStatus() == TicketStatus.REJECTED) {
            ticket.setResolutionNotes(request.getRejectionReason());
        }

        ticket.setStatus(request.getStatus());
        Ticket updatedTicket = ticketRepository.save(ticket);
        return mapToResponse(updatedTicket);
    }

    public TicketResponse assignTechnician(Long ticketId, AssignTechnicianRequest request, Long userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        User technician = userRepository.findById(request.getAssignedUserId())
            .orElseThrow(() -> new IllegalArgumentException("Technician user not found"));

        ticket.setAssignedUser(technician);
        Ticket updatedTicket = ticketRepository.save(ticket);
        return mapToResponse(updatedTicket);
    }

    public TicketResponse addResolutionNotes(Long ticketId, AddResolutionNotesRequest request, Long userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        // Only assigned technician can add resolution notes
        if (ticket.getAssignedUser() == null || !ticket.getAssignedUser().getUserId().equals(userId)) {
            throw new TicketUnauthorizedException("Only assigned technician or staff member can add resolution notes");
        }

        ticket.setResolutionNotes(request.getResolutionNotes());
        ticket.setStatus(TicketStatus.RESOLVED);
        Ticket updatedTicket = ticketRepository.save(ticket);
        return mapToResponse(updatedTicket);
    }

    public void deleteTicket(Long ticketId, Long userId, boolean isAdmin) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        // Only admin can delete tickets
        if (!isAdmin) {
            throw new TicketUnauthorizedException("Only admin can delete tickets");
        }

        ticketRepository.delete(ticket);
    }

    public TicketResponse mapToResponse(Ticket ticket) {
        long commentCount = ticket.getComments() != null ? ticket.getComments().size() : 0;
        
        // Parse JSONB images to List<AttachmentResponse>
        List<AttachmentResponse> attachments = parseImagesToAttachments(ticket.getImages());
        
        log.info("Ticket {} mapped with {} attachments", ticket.getTicketId(), attachments.size());
        if (!attachments.isEmpty()) {
            attachments.forEach(att -> log.info("  Attachment: {} -> {}", att.getFileName(), att.getFilePath()));
        }

        return TicketResponse.builder()
                .ticketId(ticket.getTicketId())
                .createdAt(ticket.getCreatedAt())
                .raisedUser(TicketResponse.UserSummary.builder()
                        .userId(ticket.getRaisedUser().getUserId())
                        .name(ticket.getRaisedUser().getName())
                        .email(ticket.getRaisedUser().getEmail())
                        .build())
                .assignedUser(ticket.getAssignedUser() != null ? TicketResponse.UserSummary.builder()
                        .userId(ticket.getAssignedUser().getUserId())
                        .name(ticket.getAssignedUser().getName())
                        .email(ticket.getAssignedUser().getEmail())
                        .build() : null)
                .priority(ticket.getPriority())
                .resource(TicketResponse.ResourceSummary.builder()
                        .resourceId(ticket.getResource().getId())
                        .name(ticket.getResource().getName())
                        .type(ticket.getResource().getType())
                        .location(ticket.getResource().getLocation())
                        .build())
                .description(ticket.getDescription())
                .contactNumber(ticket.getContactNumber())
                .status(ticket.getStatus())
                .resolutionNotes(ticket.getResolutionNotes())
                .category(ticket.getCategory())
                .attachments(attachments)
                .commentCount((int) commentCount)
                .build();
    }
    
    private List<AttachmentResponse> parseImagesToAttachments(String imagesJson) {
        if (imagesJson == null || imagesJson.isEmpty() || "null".equals(imagesJson)) {
            log.debug("No images found in ticket");
            return new ArrayList<>();
        }
        try {
            java.util.List<String> imagePaths = objectMapper.readValue(imagesJson, new TypeReference<java.util.List<String>>() {});
            log.info("Found {} image signed URLs in database", imagePaths.size());
            java.util.List<AttachmentResponse> attachments = new ArrayList<>();
            for (int i = 0; i < imagePaths.size(); i++) {
                String signedUrl = imagePaths.get(i);
                if (signedUrl != null && !signedUrl.isEmpty()) {
                    // Extract filename from signed URL for display
                    String fileName = "attachment";
                    try {
                        int lastSlash = signedUrl.lastIndexOf("/");
                        int queryPos = signedUrl.indexOf("?", lastSlash);
                        if (queryPos > lastSlash) {
                            fileName = signedUrl.substring(lastSlash + 1, queryPos);
                        } else if (lastSlash >= 0) {
                            fileName = signedUrl.substring(lastSlash + 1);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to extract filename from URL");
                    }
                    
                    attachments.add(AttachmentResponse.builder()
                            .filePath(signedUrl)  // Use signed URL directly
                            .fileName(fileName)
                            .index(i)
                            .build());
                    log.debug("Added attachment {}: {}", i, fileName);
                }
            }
            log.info("Successfully parsed {} attachments from database", attachments.size());
            return attachments;
        } catch (Exception e) {
            log.error("Error parsing images JSON: {} - {}", imagesJson, e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    private String extractFilePathFromSignedUrl(String signedUrl) {
        if (signedUrl == null || signedUrl.isEmpty()) {
            return null;
        }
        // Extract file path from signed URL
        // Formats:
        // 1. Relative: /object/sign/bucket-name/tickets/uuid.ext?token=...
        // 2. Absolute: https://...supabase.co/storage/v1/object/sign/bucket-name/tickets/uuid.ext?token=...
        try {
            // Find "tickets/" in the URL
            int ticketsIndex = signedUrl.indexOf("tickets/");
            if (ticketsIndex != -1) {
                // Extract from "tickets/" to the query string or end
                int queryIndex = signedUrl.indexOf("?", ticketsIndex);
                String extracted;
                if (queryIndex != -1) {
                    extracted = signedUrl.substring(ticketsIndex, queryIndex);
                } else {
                    extracted = signedUrl.substring(ticketsIndex);
                }
                log.info("Extracted file path '{}' from URL: {}", extracted, signedUrl.substring(0, Math.min(100, signedUrl.length())));
                return extracted;
            }
            log.warn("Could not find 'tickets/' in URL: {}", signedUrl.substring(0, Math.min(100, signedUrl.length())));
        } catch (Exception e) {
            log.error("Failed to extract file path from URL: {}", signedUrl, e);
        }
        return null;
    }
}
