package com.learnsphere.service;

import com.learnsphere.dto.AuthDto;
import com.learnsphere.model.User;
import com.learnsphere.repository.UserRepository;
import com.learnsphere.repository.RoadmapRepository;
import com.learnsphere.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoadmapRepository roadmapRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            throw new RuntimeException("User already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("user");
        user.setStreak(0);

        user = userRepository.save(user);

        return AuthDto.AuthResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .streak(user.getStreak())
                .role(user.getRole())
                .token(jwtUtil.generateToken(user.getId(), user.getEmail()))
                .build();
    }

    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        return AuthDto.AuthResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .streak(user.getStreak() != null ? user.getStreak() : 0)
                .role(user.getRole())
                .token(jwtUtil.generateToken(user.getId(), user.getEmail()))
                .build();
    }

    public AuthDto.ProfileResponse getProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return AuthDto.ProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .topicsOfInterest(user.getTopicsOfInterest())
                .streak(user.getStreak() != null ? user.getStreak() : 0)
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public AuthDto.ProfileResponse updateProfile(String userId, AuthDto.UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getName() != null) user.setName(request.getName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getTopicsOfInterest() != null) user.setTopicsOfInterest(request.getTopicsOfInterest());

        user = userRepository.save(user);

        AuthDto.ProfileResponse response = AuthDto.ProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .topicsOfInterest(user.getTopicsOfInterest())
                .message("Profile updated successfully")
                .build();
        return response;
    }

    public void changePassword(String userId, AuthDto.ChangePasswordRequest request) {
        if (request.getCurrentPassword() == null || request.getNewPassword() == null) {
            throw new RuntimeException("Current password and new password are required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public void deleteAccount(String userId, AuthDto.DeleteAccountRequest request) {
        if (request.getPassword() == null) {
            throw new RuntimeException("Password is required to delete account");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Password is incorrect");
        }

        // TODO: Delete roadmaps first
        
        userRepository.deleteById(userId);
    }
}
