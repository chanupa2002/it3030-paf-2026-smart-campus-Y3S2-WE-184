package com.uninode.smartcampus.modules.notifications.repository;

import java.util.List;

import com.uninode.smartcampus.modules.notifications.entity.Notification;
import com.uninode.smartcampus.modules.notifications.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserUserIdOrderByCreatedAtDescNotificationIdDesc(Long userId);

    boolean existsByUserUserIdAndNotificationTypeAndMessage(
            Long userUserId,
            NotificationType notificationType,
            String message
    );

    List<Notification> findByUserUserIdAndNotificationTypeOrderByCreatedAtDescNotificationIdDesc(
            Long userId,
            NotificationType notificationType
    );
}
