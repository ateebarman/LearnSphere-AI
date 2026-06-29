package com.learnsphere.controller;

import com.learnsphere.model.User;
import com.learnsphere.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAnalytics(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(analyticsService.getAnalytics(user.getId()));
    }

    @GetMapping("/roadmaps")
    public ResponseEntity<List<Map<String, Object>>> getRoadmapStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(analyticsService.getRoadmapStats(user.getId()));
    }

    @GetMapping("/quizzes")
    public ResponseEntity<List<Map<String, Object>>> getQuizStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(analyticsService.getQuizStats(user.getId()));
    }
}
