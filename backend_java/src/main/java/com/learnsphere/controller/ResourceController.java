package com.learnsphere.controller;

import com.learnsphere.model.Roadmap;
import com.learnsphere.service.YouTubeService;
import com.learnsphere.service.ai.AiQuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final YouTubeService youTubeService;
    private final AiQuizService aiQuizService;

    public ResourceController(YouTubeService youTubeService, AiQuizService aiQuizService) {
        this.youTubeService = youTubeService;
        this.aiQuizService = aiQuizService;
    }

    @GetMapping("/{topic}")
    public ResponseEntity<List<Map<String, Object>>> getResources(@PathVariable String topic) {
        CompletableFuture<List<Roadmap.RoadmapResource>> videosFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return youTubeService.searchYouTubeVideos(topic, 5);
            } catch (Exception e) {
                return new ArrayList<>();
            }
        });

        CompletableFuture<List<Map<String, Object>>> articlesFuture = CompletableFuture.supplyAsync(() -> {
            try {
                Map<String, Object> aiResponse = aiQuizService.getArticlesFromAI(topic);
                return (List<Map<String, Object>>) aiResponse.get("resources");
            } catch (Exception e) {
                return new ArrayList<>();
            }
        });

        List<Map<String, Object>> allResources = new ArrayList<>();
        try {
            List<Map<String, Object>> mappedVideos = videosFuture.get().stream().map(v -> {
                Map<String, Object> m = new HashMap<>();
                m.put("title", v.getTitle());
                m.put("url", v.getUrl());
                m.put("description", v.getDescription());
                m.put("type", v.getType());
                m.put("thumbnail", v.getThumbnail());
                m.put("source", v.getSource());
                return m;
            }).collect(Collectors.toList());

            allResources.addAll(mappedVideos);
            List<Map<String, Object>> articles = articlesFuture.get();
            if (articles != null) {
                allResources.addAll(articles);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok(allResources);
    }
}
