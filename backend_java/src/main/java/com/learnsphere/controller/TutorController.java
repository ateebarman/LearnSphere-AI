package com.learnsphere.controller;

import com.learnsphere.model.KnowledgeNode;
import com.learnsphere.service.ai.AiTutorService;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tutor")
public class TutorController {

    private final AiTutorService aiTutorService;
    private final MongoTemplate mongoTemplate;

    public TutorController(AiTutorService aiTutorService, MongoTemplate mongoTemplate) {
        this.aiTutorService = aiTutorService;
        this.mongoTemplate = mongoTemplate;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> handleTutorChat(@RequestBody Map<String, Object> request) {
        String message = (String) request.get("message");
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message is required"));
        }

        List<Map<String, String>> history = (List<Map<String, String>>) request.get("history");
        Map<String, String> context = (Map<String, String>) request.get("context");

        String knowledgeContext = "";

        if (context == null && message.length() > 15) {
            List<String> stopwords = Arrays.asList("building", "project", "coding", "hello", "please", "help");
            List<String> keywords = Arrays.stream(message.split("\\s+"))
                    .filter(word -> word.length() > 3 && !stopwords.contains(word.toLowerCase()))
                    .limit(5)
                    .collect(Collectors.toList());

            if (!keywords.isEmpty()) {
                String regex = String.join("|", keywords);
                Query query = new Query();
                query.addCriteria(new Criteria().orOperator(
                        Criteria.where("topic").regex(regex, "i"),
                        Criteria.where("category").regex(regex, "i")
                ));
                query.fields().include("topic").include("summary").include("detailedContent");
                query.limit(2);

                List<KnowledgeNode> relevantDocs = mongoTemplate.find(query, KnowledgeNode.class);

                knowledgeContext = relevantDocs.stream()
                        .map(doc -> "INTERNAL DOCUMENTATION [" + doc.getTopic() + "]:\n" + doc.getSummary() + "\n" + doc.getDetailedContent())
                        .collect(Collectors.joining("\n\n"));
            }
        }

        try {
            String reply = aiTutorService.chatWithTutor(message, history, knowledgeContext, context);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("reply", reply);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }
}
