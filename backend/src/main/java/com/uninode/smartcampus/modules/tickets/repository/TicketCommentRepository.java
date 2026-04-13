package com.uninode.smartcampus.modules.tickets.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.uninode.smartcampus.modules.tickets.entity.TicketComment;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {

       @Query("SELECT tc FROM TicketComment tc WHERE tc.ticket.ticketId = :ticketId AND tc.commentId NOT IN " +
              "(SELECT tc2.previousComment.commentId FROM TicketComment tc2 WHERE tc2.previousComment IS NOT NULL) " +
              "ORDER BY tc.createdAt DESC")
       Page<TicketComment> findByTicketIdOrderByCreatedAtDesc(@Param("ticketId") Long ticketId, Pageable pageable);

       @Query("SELECT tc FROM TicketComment tc WHERE tc.ticket.ticketId = :ticketId AND tc.commentId NOT IN " +
              "(SELECT tc2.previousComment.commentId FROM TicketComment tc2 WHERE tc2.previousComment IS NOT NULL) " +
              "ORDER BY tc.createdAt DESC")
       List<TicketComment> findByTicketIdOrderByCreatedAtDesc(@Param("ticketId") Long ticketId);

       @Query("SELECT COUNT(tc) FROM TicketComment tc WHERE tc.ticket.ticketId = :ticketId")
       Long countCommentsByTicketId(@Param("ticketId") Long ticketId);

       @Query("SELECT tc FROM TicketComment tc WHERE tc.commentId = :commentId AND tc.user.userId = :userId")
       Optional<TicketComment> findByIdAndUserId(@Param("commentId") Long commentId, @Param("userId") Long userId);

       @Query("SELECT tc FROM TicketComment tc WHERE tc.previousComment.commentId = :previousCommentId")
       Optional<TicketComment> findEditHistoryByPreviousCommentId(@Param("previousCommentId") Long previousCommentId);
}
