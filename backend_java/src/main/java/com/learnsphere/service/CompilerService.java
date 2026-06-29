package com.learnsphere.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class CompilerService {

    @Value("${JUDGE0_BASE_URL:https://ce.judge0.com}")
    private String judge0BaseUrl;

    @Value("${JUDGE0_API_KEY:}")
    private String judge0ApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final Map<String, Integer> LANGUAGE_MAP = new HashMap<>();
    static {
        LANGUAGE_MAP.put("javascript", 63);
        LANGUAGE_MAP.put("python", 71);
        LANGUAGE_MAP.put("cpp", 54);
    }

    private HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");

        if (judge0ApiKey != null && !judge0ApiKey.trim().isEmpty()) {
            if (judge0BaseUrl.contains("rapidapi.com")) {
                headers.set("X-RapidAPI-Key", judge0ApiKey);
                try {
                    String host = new java.net.URL(judge0BaseUrl).getHost();
                    headers.set("X-RapidAPI-Host", host);
                } catch (Exception ignored) {}
            } else {
                headers.set("X-Auth-Token", judge0ApiKey);
            }
        }
        return headers;
    }

    private String encode(String text) {
        if (text == null) return null;
        return Base64.getEncoder().encodeToString(text.getBytes());
    }

    private String decode(String base64) {
        if (base64 == null || base64.isEmpty()) return "";
        try {
            return new String(Base64.getDecoder().decode(base64));
        } catch (Exception e) {
            return base64; // Return as-is if decoding fails
        }
    }

    public String submitToJudge(String code, String language, String input) {
        return submitToJudge(code, language, input, null);
    }

    public String submitToJudge(String code, String language, String input, String expectedOutput) {
        Integer languageId = LANGUAGE_MAP.get(language.toLowerCase());
        if (languageId == null) throw new RuntimeException("Unsupported language: " + language);

        Map<String, Object> body = new HashMap<>();
        body.put("source_code", encode(code));
        body.put("language_id", languageId);
        body.put("stdin", encode(input));
        if (expectedOutput != null) {
            body.put("expected_output", encode(expectedOutput));
        }
        body.put("cpu_time_limit", 2.0);
        body.put("memory_limit", 128000);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, getHeaders());

        try {
            String url = judge0BaseUrl + "/submissions?base64_encoded=true&wait=false";
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            return (String) response.getBody().get("token");
        } catch (Exception e) {
            System.err.println("Judge0 submission error: " + e.getMessage());
            throw new RuntimeException("Code execution service unavailable.");
        }
    }

    public Map<String, Object> getJudgeResult(String token) {
        try {
            String url = judge0BaseUrl + "/submissions/" + token + "?base64_encoded=true";
            HttpEntity<String> entity = new HttpEntity<>(getHeaders());
            
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> data = response.getBody();

            Map<String, Object> statusObj = (Map<String, Object>) data.get("status");
            int statusId = (Integer) statusObj.get("id");
            String description = (String) statusObj.get("description");

            Map<String, Object> result = new HashMap<>();

            // Status codes: 1=Queue, 2=Processing
            if (statusId <= 2) {
                result.put("isProcessing", true);
                result.put("status", description);
                result.put("token", token);
                return result;
            }

            result.put("isProcessing", false);
            result.put("status", description);
            result.put("statusId", statusId);
            result.put("stdout", decode((String) data.get("stdout")));
            result.put("stderr", decode((String) data.get("stderr")));
            result.put("compile_output", decode((String) data.get("compile_output")));
            result.put("time", data.get("time"));
            result.put("memory", data.get("memory"));

            return result;
        } catch (Exception e) {
            System.err.println("Judge0 retrieval error: " + e.getMessage());
            throw new RuntimeException("Failed to retrieve execution results.");
        }
    }
}
