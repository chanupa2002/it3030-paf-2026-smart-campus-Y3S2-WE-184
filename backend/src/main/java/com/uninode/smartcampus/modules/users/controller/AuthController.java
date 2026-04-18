package com.uninode.smartcampus.modules.users.controller;

import com.uninode.smartcampus.modules.users.dto.AuthResponse;
import com.uninode.smartcampus.modules.users.dto.LoginRequest;
import com.uninode.smartcampus.modules.users.dto.MessageResponse;
import com.uninode.smartcampus.modules.users.dto.PasswordResetConfirmRequest;
import com.uninode.smartcampus.modules.users.dto.PasswordResetRequest;
import com.uninode.smartcampus.modules.users.dto.PasswordResetVerifyRequest;
import com.uninode.smartcampus.modules.users.dto.PasswordResetVerifyResponse;
import com.uninode.smartcampus.modules.users.dto.RegisterRequest;
import com.uninode.smartcampus.modules.users.dto.UserResponse;
import com.uninode.smartcampus.modules.users.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<MessageResponse> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        userService.requestPasswordReset(request);
        return ResponseEntity.ok(MessageResponse.builder()
                .message("If the email exists, a reset code has been sent.")
                .build());
    }

    @PostMapping("/password-reset/verify")
    public ResponseEntity<PasswordResetVerifyResponse> verifyPasswordResetCode(
            @Valid @RequestBody PasswordResetVerifyRequest request
    ) {
        return ResponseEntity.ok(userService.verifyPasswordResetCode(request));
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<MessageResponse> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        userService.resetPassword(request);
        return ResponseEntity.ok(MessageResponse.builder()
                .message("Password reset successful.")
                .build());
    }
}
