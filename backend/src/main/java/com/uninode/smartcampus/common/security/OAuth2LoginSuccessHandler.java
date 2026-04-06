package com.uninode.smartcampus.common.security;

import java.io.IOException;

import com.uninode.smartcampus.modules.users.dto.AuthResponse;
import com.uninode.smartcampus.modules.users.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserService userService;

    @Value("${app.oauth2.redirect-uri}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();

        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");

        if (email == null || email.isBlank()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "OAuth provider did not return an email address");
            return;
        }

        AuthResponse authResponse = userService.handleOAuthLogin(email, name);

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", authResponse.getToken())
                .queryParam("userId", authResponse.getUser().getUserId())
                .queryParam("email", authResponse.getUser().getEmail())
                .queryParam("role", authResponse.getUser().getRoleName())
                .build()
                .toUriString();

        response.sendRedirect(targetUrl);
    }
}
