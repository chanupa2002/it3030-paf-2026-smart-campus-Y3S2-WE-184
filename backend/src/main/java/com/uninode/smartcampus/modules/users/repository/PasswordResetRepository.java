package com.uninode.smartcampus.modules.users.repository;

import java.util.List;
import java.util.Optional;

import com.uninode.smartcampus.modules.users.entity.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, Long> {

    Optional<PasswordReset> findTopByUserUserIdAndStatusTrueOrderByCreatedAtDesc(Long userId);

    List<PasswordReset> findByUserUserIdAndStatusTrue(Long userId);
}
