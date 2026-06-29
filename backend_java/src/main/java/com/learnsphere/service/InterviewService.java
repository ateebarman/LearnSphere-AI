package com.learnsphere.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsphere.model.InterviewSession;
import com.learnsphere.model.User;
import com.learnsphere.repository.InterviewSessionRepository;
import com.learnsphere.repository.UserRepository;
import com.learnsphere.service.ai.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class InterviewService {

    @Autowired
    private InterviewSessionRepository interviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AiService aiService;

    private final ObjectMapper objectMapper;

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
}
