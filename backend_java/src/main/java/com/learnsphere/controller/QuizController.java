package com.learnsphere.controller;

import com.learnsphere.service.QuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateQuiz(@RequestBody Map<String, String> request) {
        String moduleTitle = request.get("moduleTitle");
        String topic = request.get("topic");

        if (moduleTitle == null || topic == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Module title and topic are required"));
        }

        try {
            Map<String, Object> quizData = quizService.generateQuiz(moduleTitle, topic);
            return ResponseEntity.ok(quizData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitQuiz(@RequestBody Map<String, Object> request, Authentication authentication) {
        String roadmapId = (String) request.get("roadmapId");
        String moduleTitle = (String) request.get("moduleTitle");
        List<String> answers = (List<String>) request.get("answers");
        List<Map<String, String>> questions = (List<Map<String, String>>) request.get("questions");
        String userId = (String) authentication.getPrincipal();

        try {
            Map<String, Object> response = quizService.submitQuiz(roadmapId, moduleTitle, answers, questions, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }
}
