package com.uninode.smartcampus.modules.users.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.UUID;

import com.uninode.smartcampus.common.security.JwtUtils;
import com.uninode.smartcampus.modules.users.dto.AuthResponse;
import com.uninode.smartcampus.modules.users.dto.LoginRequest;
import com.uninode.smartcampus.modules.users.dto.OAuthUpdateRequest;
import com.uninode.smartcampus.modules.users.dto.PasswordResetConfirmRequest;
import com.uninode.smartcampus.modules.users.dto.PasswordResetRequest;
import com.uninode.smartcampus.modules.users.dto.PasswordResetVerifyRequest;
import com.uninode.smartcampus.modules.users.dto.PasswordResetVerifyResponse;
import com.uninode.smartcampus.modules.users.dto.RegisterRequest;
import com.uninode.smartcampus.modules.users.dto.UpdateUserRequest;
import com.uninode.smartcampus.modules.users.dto.UserResponse;
import com.uninode.smartcampus.modules.users.dto.UserTypeResponse;
import com.uninode.smartcampus.modules.users.entity.PasswordReset;
import com.uninode.smartcampus.modules.users.entity.User;
import com.uninode.smartcampus.modules.users.entity.UserType;
import com.uninode.smartcampus.modules.users.exception.DuplicateUserException;
import com.uninode.smartcampus.modules.users.exception.UserNotFoundException;
import com.uninode.smartcampus.modules.users.repository.PasswordResetRepository;
import com.uninode.smartcampus.modules.users.repository.UserRepository;
import com.uninode.smartcampus.modules.users.repository.UserTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private static final int RESET_CODE_LENGTH = 6;
    private static final long RESET_EXPIRY_MINUTES = 10;
    private static final long MAX_RESET_ATTEMPTS = 3;

    private final UserRepository userRepository;
    private final UserTypeRepository userTypeRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final JavaMailSender javaMailSender;

    @Value("${app.mail.from:${spring.mail.username:no-reply@smartcampus.local}}")
    private String mailFrom;

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateUserException("Email is already in use");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateUserException("Username is already in use");
        }

        UserType userType = userTypeRepository.findByRoleNameIgnoreCase(request.getRoleName().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid role name: " + request.getRoleName()));

        User user = User.builder()
                .name(request.getName())
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .createdAt(LocalDateTime.now())
                .active(Boolean.TRUE)
                .userType(userType)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Registered new user with id={} and email={}", savedUser.getUserId(), savedUser.getEmail());
        return toUserResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new DisabledException("User account is inactive");
        }

        String token = jwtUtils.generateToken(user);
        log.info("User logged in successfully with id={} and email={}", user.getUserId(), user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .user(toUserResponse(user))
                .build();
    }

    @Override
    @Transactional
    public void requestPasswordReset(PasswordResetRequest request) {
        String email = normalizeEmail(request.getEmail());
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            log.info("Password reset requested for non-existing email={}", email);
            return;
        }

        User user = userOptional.get();

        List<PasswordReset> activeResets = passwordResetRepository.findByUserUserIdAndStatusTrue(user.getUserId());
        if (!activeResets.isEmpty()) {
            activeResets.forEach(reset -> reset.setStatus(Boolean.FALSE));
            passwordResetRepository.saveAll(activeResets);
        }

        LocalDateTime now = LocalDateTime.now();
        String code = generateResetCode();

        PasswordReset passwordReset = PasswordReset.builder()
                .user(user)
                .createdAt(now)
                .code(code)
                .attempts(0L)
                .status(Boolean.TRUE)
                .expiresAt(now.plusMinutes(RESET_EXPIRY_MINUTES))
                .build();

        passwordResetRepository.save(passwordReset);
        sendResetCodeEmail(user.getEmail(), code);

        log.info("Password reset code generated for user id={} email={}", user.getUserId(), user.getEmail());
    }

    @Override
    @Transactional
    public PasswordResetVerifyResponse verifyPasswordResetCode(PasswordResetVerifyRequest request) {
        String email = normalizeEmail(request.getEmail());
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            return PasswordResetVerifyResponse.builder()
                    .valid(false)
                    .message("Invalid or expired reset code")
                    .build();
        }

        return validateResetCode(userOptional.get(), request.getCode(), false);
    }

    @Override
    @Transactional
    public void resetPassword(PasswordResetConfirmRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired reset code"));

        PasswordResetVerifyResponse verification = validateResetCode(user, request.getCode(), true);
        if (!verification.isValid()) {
            throw new BadCredentialsException("Invalid or expired reset code");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password reset completed for user id={} email={}", user.getUserId(), user.getEmail());
    }

    @Override
    @Transactional
    public AuthResponse handleOAuthLogin(String email, String name) {
        User user = userRepository.findByEmail(email)
                .map(existingUser -> {
                    if (!Boolean.TRUE.equals(existingUser.getActive())) {
                        throw new DisabledException("User account is inactive");
                    }
                    return existingUser;
                })
                .orElseGet(() -> createOAuthUser(email, name));

        String token = jwtUtils.generateToken(user);
        log.info("OAuth login succeeded for user id={} and email={}", user.getUserId(), user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .user(toUserResponse(user))
                .build();
    }

    @Override
    @Transactional
    public AuthResponse oAuthUpdate(Long id, OAuthUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

        if (request.getName() != null) {
            user.setName(request.getName());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }

        if (request.getUsername() != null) {
            boolean usernameTaken = userRepository.findByUsername(request.getUsername())
                    .filter(existingUser -> !existingUser.getUserId().equals(id))
                    .isPresent();
            if (usernameTaken) {
                throw new DuplicateUserException("Username is already in use");
            }
            user.setUsername(request.getUsername());
        }

        UserType userType = userTypeRepository.findByRoleNameIgnoreCase(request.getRoleName().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid role name: " + request.getRoleName()));
        user.setUserType(userType);

        User updatedUser = userRepository.save(user);
        String token = jwtUtils.generateToken(updatedUser);
        log.info("Completed OAuth profile update for user id={}", updatedUser.getUserId());

        return AuthResponse.builder()
                .token(token)
                .user(toUserResponse(updatedUser))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
        return toUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserTypeResponse getUserTypeByUserId(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

        return UserTypeResponse.builder()
                .userId(user.getUserId())
                .userTypeId(user.getUserType() != null ? user.getUserType().getUsertypeId() : null)
                .roleName(user.getUserType() != null ? user.getUserType().getRoleName() : null)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toUserResponse)
                .toList();
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

        if (request.getName() != null) {
            user.setName(request.getName());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }

        if (request.getUsername() != null) {
            boolean usernameTaken = userRepository.findByUsername(request.getUsername())
                    .filter(existingUser -> !existingUser.getUserId().equals(id))
                    .isPresent();
            if (usernameTaken) {
                throw new DuplicateUserException("Username is already in use");
            }
            user.setUsername(request.getUsername());
        }

        if (request.getRoleName() != null) {
            UserType userType = userTypeRepository.findByRoleNameIgnoreCase(request.getRoleName().trim())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid role name: " + request.getRoleName()));
            user.setUserType(userType);
        }

        User updatedUser = userRepository.save(user);
        log.info("Updated user with id={}", updatedUser.getUserId());
        return toUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

        user.setActive(Boolean.FALSE);
        userRepository.save(user);
        log.info("Soft deleted user with id={}", id);
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .roleName(user.getUserType() != null ? user.getUserType().getRoleName() : null)
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private User createOAuthUser(String email, String name) {
        UserType defaultUserType = userTypeRepository.findByRoleNameIgnoreCase("Student")
                .orElseThrow(() -> new IllegalArgumentException("Default OAuth role not found: Student"));

        User user = User.builder()
                .name(name != null && !name.isBlank() ? name.trim() : deriveNameFromEmail(email))
                .username(generateUniqueUsername(email))
                .email(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .createdAt(LocalDateTime.now())
                .active(Boolean.TRUE)
                .userType(defaultUserType)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Created new OAuth user with id={} and email={}", savedUser.getUserId(), savedUser.getEmail());
        return savedUser;
    }

    private String generateUniqueUsername(String email) {
        String localPart = email != null && email.contains("@") ? email.substring(0, email.indexOf('@')) : "oauthuser";
        String sanitizedBase = localPart.replaceAll("[^A-Za-z0-9_]", "_");
        if (sanitizedBase.length() < 4) {
            sanitizedBase = (sanitizedBase + "user").substring(0, 4);
        }
        if (sanitizedBase.length() > 50) {
            sanitizedBase = sanitizedBase.substring(0, 50);
        }

        String candidate = sanitizedBase;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            String suffixValue = "_" + suffix++;
            int maxBaseLength = 50 - suffixValue.length();
            String trimmedBase = sanitizedBase.length() > maxBaseLength
                    ? sanitizedBase.substring(0, maxBaseLength)
                    : sanitizedBase;
            candidate = trimmedBase + suffixValue;
        }
        return candidate;
    }

    private String deriveNameFromEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "OAuth User";
        }
        return email.substring(0, email.indexOf('@'));
    }

    private PasswordResetVerifyResponse validateResetCode(User user, String code, boolean consumeOnSuccess) {
        Optional<PasswordReset> latestResetOptional = passwordResetRepository
                .findTopByUserUserIdAndStatusTrueOrderByCreatedAtDesc(user.getUserId());

        if (latestResetOptional.isEmpty()) {
            return PasswordResetVerifyResponse.builder()
                    .valid(false)
                    .message("Invalid or expired reset code")
                    .build();
        }

        PasswordReset latestReset = latestResetOptional.get();
        LocalDateTime now = LocalDateTime.now();

        if (latestReset.getExpiresAt() == null || latestReset.getExpiresAt().isBefore(now)) {
            latestReset.setStatus(Boolean.FALSE);
            passwordResetRepository.save(latestReset);
            return PasswordResetVerifyResponse.builder()
                    .valid(false)
                    .message("Invalid or expired reset code")
                    .build();
        }

        long attempts = latestReset.getAttempts() == null ? 0L : latestReset.getAttempts();
        if (attempts >= MAX_RESET_ATTEMPTS) {
            latestReset.setStatus(Boolean.FALSE);
            passwordResetRepository.save(latestReset);
            return PasswordResetVerifyResponse.builder()
                    .valid(false)
                    .message("Invalid or expired reset code")
                    .build();
        }

        if (!latestReset.getCode().equals(code)) {
            latestReset.setAttempts(attempts + 1);
            if (latestReset.getAttempts() >= MAX_RESET_ATTEMPTS) {
                latestReset.setStatus(Boolean.FALSE);
            }
            passwordResetRepository.save(latestReset);
            return PasswordResetVerifyResponse.builder()
                    .valid(false)
                    .message("Invalid or expired reset code")
                    .build();
        }

        if (consumeOnSuccess) {
            latestReset.setStatus(Boolean.FALSE);
            passwordResetRepository.save(latestReset);
        }

        return PasswordResetVerifyResponse.builder()
                .valid(true)
                .message("Reset code is valid")
                .build();
    }

    private String generateResetCode() {
        int upperBound = (int) Math.pow(10, RESET_CODE_LENGTH);
        int value = ThreadLocalRandom.current().nextInt(upperBound);
        return String.format("%0" + RESET_CODE_LENGTH + "d", value);
    }

    private void sendResetCodeEmail(String recipientEmail, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(recipientEmail);
            if (mailFrom != null && !mailFrom.isBlank()) {
                message.setFrom(mailFrom.trim());
            }
            message.setSubject("Smart Campus Password Reset Code");
            message.setText(
                    "Your Smart Campus password reset code is: " + code + "\n\n"
                            + "This code expires in " + RESET_EXPIRY_MINUTES + " minutes.\n"
                            + "If you did not request this, you can safely ignore this email."
            );
            javaMailSender.send(message);
        } catch (Exception ex) {
            log.error("Failed to send password reset email to {}", recipientEmail, ex);
            throw new IllegalStateException("Unable to send password reset code email. Please try again.");
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim();
    }
}
