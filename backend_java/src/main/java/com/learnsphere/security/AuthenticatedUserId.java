package com.learnsphere.security;

import com.learnsphere.model.User;
import org.springframework.security.core.Authentication;

public final class AuthenticatedUserId {

    private AuthenticatedUserId() {}

    public static String from(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalArgumentException("Authenticated user is required");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user.getId();
        }
        if (principal instanceof String userId) {
            return userId;
        }

        throw new IllegalArgumentException("Unsupported authenticated user principal");
    }
}
