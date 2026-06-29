package com.learnsphere.service;

import com.learnsphere.model.QuizAttempt;
import com.learnsphere.model.Roadmap;
import com.learnsphere.repository.QuizAttemptRepository;
import com.learnsphere.repository.RoadmapRepository;
import com.learnsphere.service.ai.AiQuizService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class QuizService {

    private final AiQuizService aiQuizService;
    private final QuizAttemptRepository quizAttemptRepository;
    private final RoadmapRepository roadmapRepository;

    public QuizService(AiQuizService aiQuizService, QuizAttemptRepository quizAttemptRepository, RoadmapRepository roadmapRepository) {
        this.aiQuizService = aiQuizService;
        this.quizAttemptRepository = quizAttemptRepository;
        this.roadmapRepository = roadmapRepository;
    }

    public Map<String, Object> generateQuiz(String moduleTitle, String topic) {
        return aiQuizService.generateQuizFromAI(moduleTitle, topic, "");
    }

    @CacheEvict(value = "analytics", key = "'overview:' + #userId")
    public Map<String, Object> submitQuiz(String roadmapId, String moduleTitle, List<String> answers, List<Map<String, String>> questions, String userId) {
        int score = 0;
        List<com.learnsphere.model.QuizAnswer> detailedAnswers = new ArrayList<>();
        List<String> incorrectTopics = new ArrayList<>();

        for (int i = 0; i < questions.size(); i++) {
            Map<String, String> q = questions.get(i);
            String userAnswer = i < answers.size() ? answers.get(i) : "";
            String correctAnswer = q.get("correctAnswer");
            String questionText = q.get("question");

            boolean isCorrect = userAnswer.equals(correctAnswer);
            if (isCorrect) {
                score++;
            } else {
                incorrectTopics.add(questionText);
            }

            com.learnsphere.model.QuizAnswer detail = new com.learnsphere.model.QuizAnswer();
            detail.setQuestion(questionText);
            detail.setSelectedAnswer(userAnswer);
            detail.setCorrectAnswer(correctAnswer);
            detail.setIsCorrect(isCorrect);
            detailedAnswers.add(detail);
        }

        double percentageScore = ((double) score / questions.size()) * 100.0;

        Map<String, Object> aiRecs = aiQuizService.getRecommendationsFromAI(moduleTitle, percentageScore, incorrectTopics);
        String feedback = (String) aiRecs.get("feedback");

        QuizAttempt attempt = new QuizAttempt();
        attempt.setUser(userId);
        attempt.setModuleTitle(moduleTitle);
        attempt.setScore(percentageScore);
        attempt.setAnswers(detailedAnswers);
        attempt.setRecommendations(feedback);

        if (roadmapId != null && !roadmapId.equals("knowledge") && roadmapId.matches("^[0-9a-fA-F]{24}$")) {
            attempt.setRoadmap(roadmapId);
        }

        quizAttemptRepository.save(attempt);

        if (percentageScore >= 70 && attempt.getRoadmap() != null) {
            roadmapRepository.findById(attempt.getRoadmap()).ifPresent(roadmap -> {
                if (roadmap.getModules() != null) {
                    boolean updated = false;
                    for (Roadmap.RoadmapModule m : roadmap.getModules()) {
                        if (moduleTitle.equals(m.getTitle())) {
                            m.setIsCompleted(true);
                            updated = true;
                            break;
                        }
                    }

                    if (updated) {
                        long completedModules = roadmap.getModules().stream().filter(m -> m.getIsCompleted() != null && m.getIsCompleted()).count();
                        roadmap.setProgress((double) Math.round(((double) completedModules / roadmap.getModules().size()) * 100));
                        roadmapRepository.save(roadmap);
                    }
                }
            });
        }

        Map<String, Object> result = new HashMap<>();
        result.put("score", percentageScore);
        result.put("feedback", feedback);
        result.put("detailedAnswers", detailedAnswers);

        return result;
    }
}
