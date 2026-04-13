package com.uninode.smartcampus.modules.tickets.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.uninode.smartcampus.modules.tickets.entity.Ticket;
import com.uninode.smartcampus.modules.tickets.entity.TicketStatus;
import com.uninode.smartcampus.modules.tickets.entity.Priority;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

        @Query("SELECT t FROM Ticket t WHERE t.raisedUser.userId = :userId")
        Page<Ticket> findByRaisedUserId(@Param("userId") Long userId, Pageable pageable);

        @Query("SELECT t FROM Ticket t WHERE t.assignedUser.userId = :userId")
        Page<Ticket> findByAssignedUserId(@Param("userId") Long userId, Pageable pageable);

        @Query("SELECT t FROM Ticket t WHERE t.assignedUser.userId = :userId AND t.status = :status")
        Page<Ticket> findByAssignedUserIdAndStatus(@Param("userId") Long userId,
                        @Param("status") TicketStatus status, Pageable pageable);

        @Query("SELECT t FROM Ticket t LEFT JOIN t.raisedUser r LEFT JOIN t.assignedUser a WHERE r.userId = :userId OR a.userId = :userId")
        Page<Ticket> findByRaisedUserIdOrAssignedUserId(@Param("userId") Long userId, Pageable pageable);

        @Query("SELECT t FROM Ticket t LEFT JOIN t.raisedUser r LEFT JOIN t.assignedUser a WHERE (r.userId = :userId OR a.userId = :userId) AND t.status = :status")
        Page<Ticket> findByRaisedUserIdOrAssignedUserIdAndStatus(@Param("userId") Long userId,
                        @Param("status") TicketStatus status, Pageable pageable);

        @Query("SELECT t FROM Ticket t WHERE t.status = :status")
        Page<Ticket> findByStatus(@Param("status") TicketStatus status, Pageable pageable);

        @Query("SELECT t FROM Ticket t WHERE t.priority = :priority")
        Page<Ticket> findByPriority(@Param("priority") Priority priority, Pageable pageable);

        @Query("SELECT t FROM Ticket t WHERE t.resource.id = :resourceId")
        Page<Ticket> findByResourceId(@Param("resourceId") Long resourceId, Pageable pageable);

        @Query("SELECT t FROM Ticket t WHERE t.status = :status AND t.priority = :priority")
        Page<Ticket> findByStatusAndPriority(@Param("status") TicketStatus status, @Param("priority") Priority priority,
                        Pageable pageable);

        @Query("SELECT t FROM Ticket t WHERE t.raisedUser.userId = :userId AND t.status = :status")
        Page<Ticket> findByRaisedUserIdAndStatus(@Param("userId") Long userId, @Param("status") TicketStatus status,
                        Pageable pageable);

        @Query("SELECT t FROM Ticket t LEFT JOIN FETCH t.comments WHERE t.ticketId = :ticketId")
        Optional<Ticket> findByIdWithDetailsEager(@Param("ticketId") Long ticketId);

        List<Ticket> findByStatusAndAssignedUserIsNull(TicketStatus status);
}
