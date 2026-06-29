package com.learnsphere.controller;

import com.learnsphere.model.CodingQuestion;
import com.learnsphere.model.KnowledgeNode;
import com.learnsphere.model.Roadmap;
import com.learnsphere.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<?> getAdminStats() {
        return ResponseEntity.ok(adminService.getAdminStats());
    }

    @GetMapping("/problems")
    public ResponseEntity<?> getAdminProblems(@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "15") int limit) {
        return ResponseEntity.ok(adminService.getAdminProblems(page, limit));
    }

    @PostMapping("/problems")
    public ResponseEntity<?> createProblem(@RequestBody CodingQuestion problem) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createProblem(problem));
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @DeleteMapping("/problems/{id}")
    public ResponseEntity<?> deleteProblem(@PathVariable String id) {
        adminService.deleteProblem(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Problem deleted");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/knowledge")
    public ResponseEntity<?> getAdminKnowledge(@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "15") int limit) {
        return ResponseEntity.ok(adminService.getAdminKnowledge(page, limit));
    }

    @PostMapping("/knowledge")
    public ResponseEntity<?> createKnowledge(@RequestBody KnowledgeNode node) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createKnowledge(node));
    }

    @DeleteMapping("/knowledge/{id}")
    public ResponseEntity<?> deleteKnowledge(@PathVariable String id) {
        adminService.deleteKnowledge(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Knowledge entry deleted");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/roadmaps")
    public ResponseEntity<?> getAdminRoadmaps(@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "15") int limit) {
        return ResponseEntity.ok(adminService.getAdminRoadmaps(page, limit));
    }

    @PostMapping("/roadmaps")
    public ResponseEntity<?> createRoadmap(Authentication authentication, @RequestBody Roadmap roadmap) {
        String userId = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createRoadmap(userId, roadmap));
    }

    @PutMapping("/roadmaps/{id}")
    public ResponseEntity<?> updateRoadmap(@PathVariable String id, @RequestBody Roadmap roadmap) {
        return ResponseEntity.ok(adminService.updateRoadmap(id, roadmap));
    }

    @DeleteMapping("/roadmaps/{id}")
    public ResponseEntity<?> deleteRoadmap(@PathVariable String id) {
        adminService.deleteRoadmap(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Roadmap deleted");
        return ResponseEntity.ok(response);
    }
}
