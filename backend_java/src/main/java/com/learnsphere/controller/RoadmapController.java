package com.learnsphere.controller;

import com.learnsphere.model.Roadmap;
import com.learnsphere.service.RoadmapService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roadmaps")
public class RoadmapController {

    private final RoadmapService roadmapService;

    public RoadmapController(RoadmapService roadmapService) {
        this.roadmapService = roadmapService;
    }

    @PostMapping("/preview")
    public ResponseEntity<Roadmap> getRoadmapPreview(@RequestBody Map<String, String> request) {
        String topic = request.get("topic");
        String difficulty = request.get("difficulty");
        String targetRole = request.get("targetRole");

        if (topic == null || topic.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Roadmap roadmap = roadmapService.getRoadmapPreview(topic, difficulty, targetRole);
        return ResponseEntity.ok(roadmap);
    }

    @PostMapping
    public ResponseEntity<Roadmap> createRoadmap(@RequestBody Roadmap roadmap, Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        Roadmap created = roadmapService.createRoadmap(roadmap, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/direct")
    public ResponseEntity<Roadmap> generateRoadmap(@RequestBody Map<String, String> request, Authentication authentication) {
        String topic = request.get("topic");
        if (topic == null || topic.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String userId = (String) authentication.getPrincipal();
        Roadmap generated = roadmapService.generateRoadmap(topic, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(generated);
    }

    @PostMapping("/rag")
    public ResponseEntity<Roadmap> generateRAGRoadmap(@RequestBody Map<String, String> request, Authentication authentication) {
        String topic = request.get("topic");
        String materialId = request.get("materialId");

        if (topic == null || materialId == null) {
            return ResponseEntity.badRequest().build();
        }

        String userId = (String) authentication.getPrincipal();
        Roadmap generated = roadmapService.generateRAGRoadmap(topic, materialId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(generated);
    }

    @GetMapping
    public ResponseEntity<List<Roadmap>> getUserRoadmaps(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(roadmapService.getUserRoadmaps(userId));
    }

    @GetMapping("/public/list")
    public ResponseEntity<Map<String, List<Roadmap>>> getPublicRoadmaps() {
        List<Roadmap> roadmaps = roadmapService.getPublicRoadmaps();
        return ResponseEntity.ok(Map.of("roadmaps", roadmaps));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Roadmap> getRoadmapById(@PathVariable String id, Authentication authentication) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;
        return ResponseEntity.ok(roadmapService.getRoadmapById(id, userId));
    }

    @PutMapping("/{id}/visibility")
    public ResponseEntity<Map<String, Boolean>> toggleVisibility(@PathVariable String id, Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        Roadmap roadmap = roadmapService.toggleRoadmapVisibility(id, userId);
        return ResponseEntity.ok(Map.of("isPublic", roadmap.getIsPublic()));
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<Map<String, String>> cloneRoadmap(@PathVariable String id, Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        
        Roadmap source = roadmapService.getRoadmapById(id, userId);
        
        // Manual deep clone logic could be moved to service, for simplicity in controller:
        Roadmap cloned = new Roadmap();
        cloned.setTitle(source.getTitle() + " (Clone)");
        cloned.setTopic(source.getTopic());
        cloned.setDescription(source.getDescription());
        cloned.setDifficulty(source.getDifficulty());
        cloned.setTotalDuration(source.getTotalDuration());
        cloned.setModules(source.getModules());
        cloned.setIsPublic(false);
        cloned.setProgress(0.0);
        
        Roadmap saved = roadmapService.createRoadmap(cloned, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("roadmapId", saved.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Roadmap> updateRoadmap(@PathVariable String id, @RequestBody Roadmap updates, Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        Roadmap existing = roadmapService.getRoadmapById(id, userId);

        if (!existing.getUser().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Just saving it back via a proper service method would be better, but simplified:
        updates.setId(id);
        updates.setUser(userId);
        Roadmap saved = roadmapService.createRoadmap(updates, userId); // createRoadmap can double as update if ID is set
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteRoadmap(@PathVariable String id, Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        roadmapService.deleteRoadmap(id, userId);
        return ResponseEntity.ok(Map.of("message", "Roadmap deleted successfully"));
    }
}
