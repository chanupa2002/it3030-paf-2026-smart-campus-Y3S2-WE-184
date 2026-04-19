package com.uninode.smartcampus.modules.tickets.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import com.uninode.smartcampus.modules.tickets.dto.AddCommentRequest;
import com.uninode.smartcampus.modules.tickets.dto.CommentResponse;
import com.uninode.smartcampus.modules.tickets.entity.Ticket;
import com.uninode.smartcampus.modules.tickets.entity.TicketComment;
import com.uninode.smartcampus.modules.tickets.exception.CommentNotFoundException;
import com.uninode.smartcampus.modules.tickets.exception.TicketNotFoundException;
import com.uninode.smartcampus.modules.tickets.exception.TicketUnauthorizedException;
import com.uninode.smartcampus.modules.tickets.repository.TicketCommentRepository;
import com.uninode.smartcampus.modules.tickets.repository.TicketRepository;
import com.uninode.smartcampus.modules.notifications.service.TicketCommentNotificationService;
import com.uninode.smartcampus.modules.users.entity.User;
import com.uninode.smartcampus.modules.users.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TicketCommentService {

    private final TicketCommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final TicketCommentNotificationService ticketCommentNotificationService;

    public CommentResponse addComment(Long ticketId, AddCommentRequest request, Long userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .user(user)
                .comment(request.getComment())
                .createdAt(LocalDateTime.now())
                .build();

        TicketComment savedComment = commentRepository.save(comment);
        ticketCommentNotificationService.notifyRecipients(savedComment);
        return mapToResponse(savedComment);
    }

    public Page<CommentResponse> getCommentsByTicket(Long ticketId, int pageNumber, int pageSize) {
        // Verify ticket exists
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<TicketComment> comments = commentRepository.findByTicketIdOrderByCreatedAtDesc(ticketId, pageable);
        return comments.map(this::mapToResponse);
    }

    public CommentResponse editComment(Long commentId, AddCommentRequest request, Long userId) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentNotFoundException(commentId));

        // Verify user owns the comment
        if (!comment.getUser().getUserId().equals(userId)) {
            throw new TicketUnauthorizedException("You can only edit your own comments");
        }

        // Create new comment entry with previous comment reference (for audit trail)
        TicketComment previousComment = comment;
        TicketComment updatedComment = TicketComment.builder()
                .ticket(comment.getTicket())
                .user(comment.getUser())
                .comment(request.getComment())
                .previousComment(previousComment)
                .createdAt(comment.getCreatedAt())
                .build();

        TicketComment saved = commentRepository.save(updatedComment);
        return mapToResponse(saved);
    }

    public void deleteComment(Long commentId, Long userId) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentNotFoundException(commentId));

        // Verify user owns the comment
        if (!comment.getUser().getUserId().equals(userId)) {
            throw new TicketUnauthorizedException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }

    public CommentResponse mapToResponse(TicketComment comment) {
        boolean isEdited = comment.getPreviousComment() != null;

        return CommentResponse.builder()
                .commentId(comment.getCommentId())
                .createdAt(comment.getCreatedAt())
                .ticketId(comment.getTicket().getTicketId())
                .user(CommentResponse.UserInfo.builder()
                        .userId(comment.getUser().getUserId())
                        .name(comment.getUser().getName())
                        .email(comment.getUser().getEmail())
                        .roleName(comment.getUser().getUserType() != null ? comment.getUser().getUserType().getRoleName() : "User")
                        .build())
                .comment(comment.getComment())
                .isEdited(isEdited)
                .build();
    }
}
