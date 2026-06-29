package com.learnsphere.service;

import com.learnsphere.dto.AuthDto;
import com.learnsphere.model.User;
import com.learnsphere.repository.UserRepository;
import com.learnsphere.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId("123");
        mockUser.setName("Test User");
        mockUser.setEmail("test@test.com");
        mockUser.setPassword("encodedPassword");
        mockUser.setRole("user");
        mockUser.setStreak(0);
    }

    @Test
    void register_Success() {
        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest("Test User", "test@test.com", "password123");
        
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        when(jwtUtil.generateToken(mockUser.getId(), mockUser.getEmail())).thenReturn("mockToken");

        AuthDto.AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("123", response.getId());
        assertEquals("test@test.com", response.getEmail());
        assertEquals("mockToken", response.getToken());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void register_UserAlreadyExists() {
        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest("Test User", "test@test.com", "password123");
        
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(mockUser));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.register(request);
        });

        assertEquals("User already exists", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_Success() {
        AuthDto.LoginRequest request = new AuthDto.LoginRequest("test@test.com", "password123");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches(request.getPassword(), mockUser.getPassword())).thenReturn(true);
        when(jwtUtil.generateToken(mockUser.getId(), mockUser.getEmail())).thenReturn("mockToken");

        AuthDto.AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("test@test.com", response.getEmail());
        assertEquals("mockToken", response.getToken());
    }

    @Test
    void login_InvalidPassword() {
        AuthDto.LoginRequest request = new AuthDto.LoginRequest("test@test.com", "wrongPassword");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches(request.getPassword(), mockUser.getPassword())).thenReturn(false);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.login(request);
        });

        assertEquals("Invalid email or password", exception.getMessage());
    }

    @Test
    void getProfile_Success() {
        when(userRepository.findById("123")).thenReturn(Optional.of(mockUser));

        AuthDto.ProfileResponse response = authService.getProfile("123");

        assertNotNull(response);
        assertEquals("Test User", response.getName());
        assertEquals("test@test.com", response.getEmail());
    }
}
