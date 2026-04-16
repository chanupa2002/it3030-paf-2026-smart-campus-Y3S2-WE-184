package com.uninode.smartcampus.modules.users.service;

import java.util.List;

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

public interface UserService {

    UserResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    void requestPasswordReset(PasswordResetRequest request);

    PasswordResetVerifyResponse verifyPasswordResetCode(PasswordResetVerifyRequest request);

    void resetPassword(PasswordResetConfirmRequest request);

    AuthResponse handleOAuthLogin(String email, String name);

    AuthResponse oAuthUpdate(Long id, OAuthUpdateRequest request);

    UserResponse getUserById(Long id);

    UserTypeResponse getUserTypeByUserId(Long id);

    List<UserResponse> getAllUsers();

    UserResponse updateUser(Long id, UpdateUserRequest request);

    void deleteUser(Long id);
}
