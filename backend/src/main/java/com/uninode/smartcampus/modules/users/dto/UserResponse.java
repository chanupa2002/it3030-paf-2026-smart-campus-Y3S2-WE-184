package com.uninode.smartcampus.modules.users.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long userId;

    private String name;

    private String username;

    private String email;

    private String phone;

    private String address;

    private String roleName;

    private Boolean active;

    private LocalDateTime createdAt;
}
