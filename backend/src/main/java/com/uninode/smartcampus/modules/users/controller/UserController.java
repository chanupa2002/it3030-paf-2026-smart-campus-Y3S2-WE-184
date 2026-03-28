package com.uninode.smartcampus.modules.users.controller;

import java.util.List;

import com.uninode.smartcampus.modules.users.dto.AuthResponse;
import com.uninode.smartcampus.modules.users.dto.OAuthUpdateRequest;
import com.uninode.smartcampus.modules.users.dto.UpdateUserRequest;
import com.uninode.smartcampus.modules.users.dto.UserResponse;
import com.uninode.smartcampus.modules.users.entity.User;
import com.uninode.smartcampus.modules.users.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/oAuthUpdate/{id}")
    public ResponseEntity<AuthResponse> oAuthUpdate(
            @PathVariable Long id,
            @Valid @RequestBody OAuthUpdateRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        if (currentUser == null || (!currentUser.getUserId().equals(id) && currentUser.getAuthorities().stream()
                .noneMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority())))) {
            throw new AccessDeniedException("You are not allowed to update this OAuth user");
        }

        return ResponseEntity.ok(userService.oAuthUpdate(id, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
