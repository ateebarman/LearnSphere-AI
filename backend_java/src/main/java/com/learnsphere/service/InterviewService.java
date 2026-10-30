package com.learnsphere.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsphere.model.InterviewSession;
import com.learnsphere.model.User;
import com.learnsphere.repository.InterviewSessionRepository;
import com.learnsphere.repository.UserRepository;
import com.learnsphere.service.ai.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class InterviewService {

    @Autowired
    private InterviewSessionRepository interviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AiService aiService;

    @Value("${JUDGE0_BASE_URL:https://ce.judge0.com}")
    private String judge0BaseUrl;

    @Value("${JUDGE0_API_KEY:}")
    private String judge0ApiKey;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final Map<String, Integer> LANGUAGE_IDS = Map.of(
        "javascript", 63,
        "python", 71,
        "java", 62,
        "cpp", 54,
        "typescript", 74
    );

    public InterviewService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public InterviewSession startInterview(String userId, Map<String, Object> body) {
        String mode = (String) body.getOrDefault("mode", "mock");
        String company = (String) body.getOrDefault("company", "generic");
        String targetRole = (String) body.getOrDefault("targetRole", "Software Engineer");
        String topic = (String) body.get("topic");
        String difficulty = (String) body.getOrDefault("difficulty", "adaptive");
        Boolean voiceMode = (Boolean) body.getOrDefault("voiceMode", true);

        InterviewSession session = new InterviewSession();
        session.setCandidateId(userId);
        session.setMode(mode);
        session.setCompany(company);
        session.setTargetRole(targetRole);
        session.setTopic(topic);
        session.setDifficulty(difficulty);
        session.setStatus("ONGOING");

        InterviewSession.Metadata metadata = new InterviewSession.Metadata();
        metadata.setVoiceMode(voiceMode);
        session.setMetadata(metadata);

        InterviewSession saved = interviewRepository.save(session);

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getStats() == null) {
                user.setStats(new User.UserStats());
            }
            user.getStats().setInterviewsCount((user.getStats().getInterviewsCount() == null ? 0 : user.getStats().getInterviewsCount()) + 1);
            userRepository.save(user);
        }

        return saved;
    }

    public List<InterviewSession> getHistory(String userId) {
        return interviewRepository.findByCandidateIdOrderByCreatedAtDesc(userId);
    }

    public Optional<InterviewSession> getById(String id) {
        return interviewRepository.findById(id);
    }

    public InterviewSession.CodingProblem generateProblem(String id, Map<String, Object> body) {
        String topic = (String) body.getOrDefault("topic", "Arrays");
        String difficulty = (String) body.getOrDefault("difficulty", "medium");
        String company = (String) body.getOrDefault("company", "generic");

        String prompt = String.format(
            "Generate a structured coding problem for interview preparation on topic '%s' with difficulty '%s' for target company '%s'.\n" +
            "Return JSON matching:\n" +
            "{\n" +
            "  \"title\": \"Problem title\",\n" +
            "  \"description\": \"Full description with input/output format and constraints\",\n" +
            "  \"difficulty\": \"%s\",\n" +
            "  \"language\": \"javascript\",\n" +
            "  \"starterCode\": \"function solution() {\\n\\n}\",\n" +
            "  \"solution\": \"complete reference solution\",\n" +
            "  \"testCases\": [{\"input\": \"sample input\", \"output\": \"expected output\"}]\n" +
            "}\n" +
            "Respond ONLY with valid JSON.", topic, difficulty, company, difficulty
        );

        String json = aiService.generateJson(prompt);
        try {
            InterviewSession.CodingProblem problem = objectMapper.readValue(json, InterviewSession.CodingProblem.class);
            Optional<InterviewSession> sessionOpt = interviewRepository.findById(id);
            if (sessionOpt.isPresent()) {
                InterviewSession session = sessionOpt.get();
                session.setCodingProblem(problem);
                interviewRepository.save(session);
            }
            return problem;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate problem: " + e.getMessage(), e);
        }
    }

    public InterviewSession completeInterview(String id, String userId, Map<String, Object> body) {
        Optional<InterviewSession> sessionOpt = interviewRepository.findById(id);
        if (sessionOpt.isEmpty()) {
            throw new RuntimeException("Interview not found");
        }

        InterviewSession session = sessionOpt.get();
        session.setStatus("COMPLETED");
        session.setStage("END");

        if (body.containsKey("evaluation")) {
            try {
                String evalJson = objectMapper.writeValueAsString(body.get("evaluation"));
                InterviewSession.Evaluation evaluation = objectMapper.readValue(evalJson, InterviewSession.Evaluation.class);
                session.setEvaluation(evaluation);

                if (evaluation.getOverallScore() != null) {
                    Optional<User> userOpt = userRepository.findById(userId);
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        if (user.getStats() == null) user.setStats(new User.UserStats());
                        int count = Math.max(user.getStats().getInterviewsCount() == null ? 1 : user.getStats().getInterviewsCount(), 1);
                        double currentAvg = user.getStats().getAverageScore() == null ? 0.0 : user.getStats().getAverageScore();
                        double newAvg = ((currentAvg * (count - 1)) + evaluation.getOverallScore()) / count;
                        user.getStats().setAverageScore(Math.round(newAvg * 10.0) / 10.0);
                        userRepository.save(user);
                    }
                }
            } catch (Exception e) {
                // Ignore parsing errors for custom payload
            }
        }

        return interviewRepository.save(session);
    }

    public Map<String, Object> generateStudyPlan(String id) {
        Optional<InterviewSession> sessionOpt = interviewRepository.findById(id);
        if (sessionOpt.isEmpty()) {
            throw new RuntimeException("Interview not found");
        }

        InterviewSession session = sessionOpt.get();
        if (session.getEvaluation() == null) {
            throw new RuntimeException("Interview not yet evaluated");
        }

        InterviewSession.Evaluation eval = session.getEvaluation();
        String weaknesses = eval.getWeaknesses() != null ? String.join(", ", eval.getWeaknesses()) : "None recorded";
        String suggestions = eval.getImprovementSuggestions() != null ? String.join(", ", eval.getImprovementSuggestions()) : "None";

        String prompt = String.format(
            "A %s candidate just completed a technical interview.\n" +
            "Evaluation:\n" +
            "- Overall Score: %.1f/10\n" +
            "- Technical Score: %.1f/10\n" +
            "- Weaknesses: %s\n" +
            "- Improvements: %s\n\n" +
            "Generate a realistic, actionable 2-week plan. Return ONLY valid JSON:\n" +
            "{\n" +
            "  \"summary\": \"1-2 sentence overview\",\n" +
            "  \"keyFocusAreas\": [\"Area 1\", \"Area 2\"],\n" +
            "  \"weeks\": [\n" +
            "    {\n" +
            "      \"week\": 1,\n" +
            "      \"focus\": \"Core Data Structures\",\n" +
            "      \"days\": [\n" +
            "        {\"day\": \"Monday\", \"topic\": \"Topic name\", \"tasks\": [\"Task 1\"], \"practice\": \"LeetCode problem\"}\n" +
            "      ]\n" +
            "    }\n" +
            "  ],\n" +
            "  \"resources\": [\n" +
            "    {\"title\": \"Resource name\", \"type\": \"Article\", \"why\": \"Reason\"}\n" +
            "  ]\n" +
            "}",
            session.getTargetRole() != null ? session.getTargetRole() : "Software Engineer",
            eval.getOverallScore() != null ? eval.getOverallScore() : 5.0,
            eval.getTechnicalScore() != null ? eval.getTechnicalScore() : 5.0,
            weaknesses,
            suggestions
        );

        String json = aiService.generateJson(prompt);
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse study plan JSON: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> executeCode(Map<String, Object> body) {
        String code = (String) body.get("code");
        String language = (String) body.get("language");
        String stdin = (String) body.getOrDefault("stdin", "");

        if (code == null || language == null) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", "Code and language are required");
            return err;
        }

        Integer languageId = LANGUAGE_IDS.get(language);
        if (languageId == null) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", "Unsupported language: " + language);
            return err;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (judge0ApiKey != null && !judge0ApiKey.isBlank()) {
                headers.set("X-RapidAPI-Host", "judge0-ce.p.rapidapi.com");
                headers.set("X-RapidAPI-Key", judge0ApiKey);
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("language_id", languageId);
            payload.put("source_code", code);
            payload.put("stdin", stdin);
            payload.put("cpu_time_limit", 5);
            payload.put("memory_limit", 256000);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            ResponseEntity<Map> submitRes = restTemplate.postForEntity(
                judge0BaseUrl + "/submissions?base64_encoded=false&wait=false",
                request,
                Map.class
            );

            if (!submitRes.getStatusCode().is2xxSuccessful() || submitRes.getBody() == null) {
                Map<String, Object> err = new HashMap<>();
                err.put("success", false);
                err.put("error", "Judge0 submission failed");
                return err;
            }

            String token = (String) submitRes.getBody().get("token");
            if (token == null) {
                Map<String, Object> err = new HashMap<>();
                err.put("success", false);
                err.put("error", "No token returned from code engine");
                return err;
            }

            Map<String, Object> result = null;
            for (int i = 0; i < 10; i++) {
                Thread.sleep(1000);
                HttpEntity<?> pollReq = new HttpEntity<>(headers);
                ResponseEntity<Map> pollRes = restTemplate.exchange(
                    judge0BaseUrl + "/submissions/" + token + "?base64_encoded=false",
                    HttpMethod.GET,
                    pollReq,
                    Map.class
                );

                if (pollRes.getStatusCode().is2xxSuccessful() && pollRes.getBody() != null) {
                    Map<String, Object> data = pollRes.getBody();
                    Map<String, Object> status = (Map<String, Object>) data.get("status");
                    if (status != null && status.get("id") != null) {
                        int statusId = ((Number) status.get("id")).intValue();
                        if (statusId > 2) {
                            result = data;
                            break;
                        }
                    }
                }
            }

            if (result == null) {
                Map<String, Object> res = new HashMap<>();
                res.put("success", false);
                res.put("error", "Execution timed out");
                res.put("output", "Execution timed out (10s limit exceeded)");
                return res;
            }

            Map<String, Object> status = (Map<String, Object>) result.get("status");
            int statusId = status != null && status.get("id") != null ? ((Number) status.get("id")).intValue() : 0;
            String statusDesc = status != null ? (String) status.get("description") : "Unknown";

            String stdout = (String) result.get("stdout");
            String stderr = (String) result.get("stderr");
            String compileOutput = (String) result.get("compile_output");
            String message = (String) result.get("message");

            String output = "";
            if (stdout != null && !stdout.isBlank()) output = stdout;
            else if (stderr != null && !stderr.isBlank()) output = stderr;
            else if (compileOutput != null && !compileOutput.isBlank()) output = compileOutput;
            else if (message != null && !message.isBlank()) output = message;

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("output", output.trim());
            res.put("statusId", statusId);
            res.put("statusDescription", statusDesc);
            res.put("passed", statusId == 3);
            res.put("time", result.get("time"));
            res.put("memory", result.get("memory"));
            res.put("compileOutput", compileOutput);
            res.put("stderr", stderr);
            return res;

        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", e.getMessage());
            err.put("output", "Error: " + e.getMessage());
            return err;
        }
    }
}
