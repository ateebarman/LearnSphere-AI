package com.learnsphere.controller;

import com.learnsphere.model.InterviewSession;
import com.learnsphere.service.InterviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/interview")
public class InterviewController {

    @Autowired
    private InterviewService interviewService;

    @PostMapping("/start")
    public ResponseEntity<?> startInterview(Authentication authentication, @RequestBody Map<String, Object> body) {
        try {
            String userId = authentication.getName();
            InterviewSession session = interviewService.startInterview(userId, body);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("interviewId", session.getId());
            response.put("interview", session);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Authentication authentication) {
        try {
            String userId = authentication.getName();
            List<InterviewSession> interviews = interviewService.getHistory(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("interviews", interviews);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        try {
            Optional<InterviewSession> session = interviewService.getById(id);
            if (session.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("message", "Interview not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("interview", session.get());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/{id}/generate-problem")
    public ResponseEntity<?> generateProblem(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            InterviewSession.CodingProblem problem = interviewService.generateProblem(id, body);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("problem", problem);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeInterview(Authentication authentication, @PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            String userId = authentication.getName();
            InterviewSession session = interviewService.completeInterview(id, userId, body);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("interview", session);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
