package com.learnsphere.controller;

import com.learnsphere.security.AuthenticatedUserId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/transcribe")
public class TranscriptionController {

    @Value("${GROQ_API_KEY1:${GROQ_API_KEY:}}")
    private String groqApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("available", groqApiKey != null && !groqApiKey.isBlank());
        response.put("model", "whisper-large-v3-turbo");
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> transcribeAudio(Authentication authentication, @RequestParam("audio") MultipartFile audioFile) {
        if (audioFile == null || audioFile.isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", "No audio file provided");
            return ResponseEntity.badRequest().body(err);
        }

        if (groqApiKey == null || groqApiKey.isBlank()) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", "Transcription service not configured");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(err);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBearerAuth(groqApiKey);

            ByteArrayResource fileResource = new ByteArrayResource(audioFile.getBytes()) {
                @Override
                public String getFilename() {
                    return audioFile.getOriginalFilename() != null ? audioFile.getOriginalFilename() : "audio.webm";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);
            body.add("model", "whisper-large-v3-turbo");
            body.add("response_format", "json");
            body.add("language", "en");
            body.add("temperature", "0");

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                requestEntity,
                Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String transcript = (String) response.getBody().get("text");
                Map<String, Object> res = new HashMap<>();
                res.put("success", true);
                res.put("transcript", transcript != null ? transcript.trim() : "");
                return ResponseEntity.ok(res);
            } else {
                Map<String, Object> err = new HashMap<>();
                err.put("success", false);
                err.put("error", "Transcription failed from Groq");
                return ResponseEntity.status(response.getStatusCode()).body(err);
            }
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }
}
