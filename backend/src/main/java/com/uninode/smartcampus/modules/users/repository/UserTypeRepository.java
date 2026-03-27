package com.uninode.smartcampus.modules.users.repository;

import java.util.Optional;

import com.uninode.smartcampus.modules.users.entity.UserType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserTypeRepository extends JpaRepository<UserType, Long> {

    Optional<UserType> findByRoleName(String roleName);

    Optional<UserType> findByRoleNameIgnoreCase(String roleName);
}
