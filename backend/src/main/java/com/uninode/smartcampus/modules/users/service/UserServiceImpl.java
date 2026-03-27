package com.uninode.smartcampus.modules.users.service;

import java.time.LocalDateTime;
import java.util.List;

import com.uninode.smartcampus.common.security.JwtUtils;
import com.uninode.smartcampus.modules.users.dto.AuthResponse;
import com.uninode.smartcampus.modules.users.dto.LoginRequest;
import com.uninode.smartcampus.modules.users.dto.RegisterRequest;
import com.uninode.smartcampus.modules.users.dto.UpdateUserRequest;
import com.uninode.smartcampus.modules.users.dto.UserResponse;
import com.uninode.smartcampus.modules.users.entity.User;
import com.uninode.smartcampus.modules.users.entity.UserType;
import com.uninode.smartcampus.modules.users.exception.DuplicateUserException;
import com.uninode.smartcampus.modules.users.exception.UserNotFoundException;
import com.uninode.smartcampus.modules.users.repository.UserRepository;
import com.uninode.smartcampus.modules.users.repository.UserTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserTypeRepository userTypeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

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
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
        return toUserResponse(user);
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
}
