package com.uninode.smartcampus.modules.users.service;

import java.util.List;

import com.uninode.smartcampus.modules.users.dto.AuthResponse;
import com.uninode.smartcampus.modules.users.dto.LoginRequest;
import com.uninode.smartcampus.modules.users.dto.RegisterRequest;
import com.uninode.smartcampus.modules.users.dto.UpdateUserRequest;
import com.uninode.smartcampus.modules.users.dto.UserResponse;

public interface UserService {

    UserResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse handleOAuthLogin(String email, String name);

    UserResponse getUserById(Long id);

    List<UserResponse> getAllUsers();

    UserResponse updateUser(Long id, UpdateUserRequest request);

    void deleteUser(Long id);
}
