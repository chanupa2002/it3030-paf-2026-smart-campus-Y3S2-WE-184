package com.uninode.smartcampus.modules.notifications.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketCommentNotificationSyncService {

    private final TicketCommentNotificationService ticketCommentNotificationService;

    @Scheduled(fixedDelayString = "${app.notifications.ticket-comment-sync-delay-ms:2000}")
    public void syncTicketCommentNotifications() {
        try {
            ticketCommentNotificationService.syncCommentNotifications();
        } catch (RuntimeException exception) {
            log.error("Ticket comment notification sync failed", exception);
        }
    }
}
