package com.learnsphere.controller;

import com.learnsphere.model.KnowledgeNode;
import com.learnsphere.service.KnowledgeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    public KnowledgeController(KnowledgeService knowledgeService) {
        this.knowledgeService = knowledgeService;
    }

    @GetMapping
    public ResponseEntity<List<KnowledgeNode>> getKnowledgeNodes(@RequestParam(required = false) String category) {
        return ResponseEntity.ok(knowledgeService.getKnowledgeNodes(category));
    }

    @GetMapping("/{topic}")
    public ResponseEntity<KnowledgeNode> getKnowledgeDetails(@PathVariable String topic) {
        return ResponseEntity.ok(knowledgeService.getKnowledgeDetails(topic));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(knowledgeService.getCategories());
    }
}
