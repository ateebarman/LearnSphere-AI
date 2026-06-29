package com.learnsphere.service;

import com.learnsphere.model.CategoryMapping;
import com.learnsphere.model.QuizAttempt;
import com.learnsphere.model.Roadmap;
import com.learnsphere.repository.CategoryMappingRepository;
import com.learnsphere.repository.QuizAttemptRepository;
import com.learnsphere.repository.RoadmapRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final RoadmapRepository roadmapRepository;
    private final CategoryMappingRepository categoryMappingRepository;

    public AnalyticsService(QuizAttemptRepository quizAttemptRepository,
                            RoadmapRepository roadmapRepository,
                            CategoryMappingRepository categoryMappingRepository) {
        this.quizAttemptRepository = quizAttemptRepository;
        this.roadmapRepository = roadmapRepository;
        this.categoryMappingRepository = categoryMappingRepository;
    }

    @Cacheable(value = "analytics", key = "'overview:' + #userId", unless = "#result == null")
    public Map<String, Object> getAnalytics(String userId) {
        List<QuizAttempt> quizAttempts = quizAttemptRepository.findByUser(userId);
        List<Roadmap> roadmaps = roadmapRepository.findByUserOrderByCreatedAtDesc(userId);
        long totalRoadmapsCount = roadmapRepository.count();

        Map<String, TopicScore> topicScores = new HashMap<>();
        for (QuizAttempt attempt : quizAttempts) {
            String title = attempt.getModuleTitle();
            if (title != null) {
                topicScores.putIfAbsent(title, new TopicScore());
                TopicScore ts = topicScores.get(title);
                ts.totalScore += attempt.getScore();
                ts.count++;
            }
        }

        List<Map<String, Object>> areas = new ArrayList<>();
        for (Map.Entry<String, TopicScore> entry : topicScores.entrySet()) {
            Map<String, Object> area = new HashMap<>();
            area.put("topic", entry.getKey());
            area.put("averageScore", Math.round((entry.getValue().totalScore / entry.getValue().count) * 100.0) / 100.0);
            areas.add(area);
        }

        List<Map<String, Object>> strongAreas = areas.stream()
                .filter(a -> (double) a.get("averageScore") >= 80)
                .sorted((a, b) -> Double.compare((double) b.get("averageScore"), (double) a.get("averageScore")))
                .collect(Collectors.toList());

        List<Map<String, Object>> weakAreas = areas.stream()
                .filter(a -> (double) a.get("averageScore") < 80)
                .sorted(Comparator.comparingDouble(a -> (double) a.get("averageScore")))
                .collect(Collectors.toList());

        double totalProgress = roadmaps.isEmpty() ? 0 : roadmaps.stream().mapToDouble(r -> r.getProgress() != null ? r.getProgress() : 0.0).sum() / (double) roadmaps.size();

        int totalRoadmapsCreated = roadmaps.size();
        int totalQuizzesTaken = quizAttempts.size();

        double averageQuizScore = 0;
        if (totalQuizzesTaken > 0) {
            double totalScore = quizAttempts.stream().mapToDouble(QuizAttempt::getScore).sum();
            averageQuizScore = Math.round((totalScore / totalQuizzesTaken) * 100.0) / 100.0;
        }

        int totalModules = 0;
        int completedModules = 0;
        int estimatedLearningTime = 0;

        for (Roadmap roadmap : roadmaps) {
            if (roadmap.getModules() != null) {
                for (Roadmap.RoadmapModule module : roadmap.getModules()) {
                    totalModules++;
                    if (module.getIsCompleted() != null && module.getIsCompleted()) {
                        completedModules++;
                    }
                    if (module.getEstimatedTime() != null) {
                        String timeStr = module.getEstimatedTime();
                        try {
                            int num = Integer.parseInt(timeStr.replaceAll("[^0-9]", ""));
                            if (timeStr.contains("hour")) {
                                estimatedLearningTime += num;
                            } else if (timeStr.contains("week")) {
                                estimatedLearningTime += num * 40;
                            } else if (timeStr.contains("day")) {
                                estimatedLearningTime += num * 8;
                            }
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }
        }

        int moduleCompletionRate = totalModules > 0 ? (int) Math.round(((double) completedModules / totalModules) * 100) : 0;

        Map<String, CategoryStat> categoryStats = new HashMap<>();
        categoryStats.put("DSA", new CategoryStat());
        categoryStats.put("System Design", new CategoryStat());
        categoryStats.put("OS", new CategoryStat());
        categoryStats.put("Database", new CategoryStat());

        List<CategoryMapping> dynamicMappings = categoryMappingRepository.findAll();

        for (Roadmap roadmap : roadmaps) {
            String topic = roadmap.getTopic() != null ? roadmap.getTopic() : roadmap.getTitle();
            List<String> attributedCats = getAttributedCategories(topic, dynamicMappings);

            for (String cat : attributedCats) {
                categoryStats.putIfAbsent(cat, new CategoryStat());
                CategoryStat stat = categoryStats.get(cat);
                if (roadmap.getModules() != null) {
                    for (Roadmap.RoadmapModule m : roadmap.getModules()) {
                        if (m.getIsCompleted() != null && m.getIsCompleted()) {
                            stat.completedModules++;
                        }
                    }
                }
            }
        }

        for (QuizAttempt attempt : quizAttempts) {
            List<String> attributedCats = getAttributedCategories(attempt.getModuleTitle(), dynamicMappings);
            for (String cat : attributedCats) {
                categoryStats.putIfAbsent(cat, new CategoryStat());
                CategoryStat stat = categoryStats.get(cat);
                stat.totalScore += attempt.getScore();
                stat.count++;
            }
        }

        List<Map<String, Object>> categoryMastery = new ArrayList<>();
        List<String> defaultCats = Arrays.asList("DSA", "System Design", "OS", "Database");

        for (Map.Entry<String, CategoryStat> entry : categoryStats.entrySet()) {
            String name = entry.getKey();
            CategoryStat stat = entry.getValue();

            if (stat.completedModules > 0 || defaultCats.contains(name)) {
                Map<String, Object> cm = new HashMap<>();
                cm.put("category", name);
                cm.put("averageScore", stat.count > 0 ? Math.round(stat.totalScore / stat.count) : 0);
                cm.put("completionCount", stat.completedModules);
                cm.put("modulesToNextLevel", 3 - (stat.completedModules % 3));
                cm.put("level", (stat.completedModules / 3) + 1);
                cm.put("progress", Math.min(100, Math.round(((double) (stat.completedModules % 3) / 3) * 100)));
                categoryMastery.add(cm);
            }
        }

        Map<String, Integer> topicBreakdown = new HashMap<>();
        for (Map.Entry<String, TopicScore> entry : topicScores.entrySet()) {
            topicBreakdown.put(entry.getKey(), entry.getValue().count);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalCompletedRoadmaps", roadmaps.stream().filter(r -> r.getProgress() != null && r.getProgress() == 100).count());
        result.put("totalInProgressRoadmaps", roadmaps.stream().filter(r -> r.getProgress() != null && r.getProgress() > 0 && r.getProgress() < 100).count());
        result.put("overallProgress", totalProgress);
        result.put("strongAreas", strongAreas);
        result.put("weakAreas", weakAreas);
        result.put("totalRoadmaps", totalRoadmapsCreated);
        result.put("totalQuizzes", totalQuizzesTaken);
        result.put("averageScore", averageQuizScore);
        result.put("moduleCompletionRate", moduleCompletionRate);
        result.put("completedModules", completedModules);
        result.put("totalModules", totalModules);
        result.put("estimatedLearningTime", estimatedLearningTime);
        result.put("categoryMastery", categoryMastery);
        result.put("topicBreakdown", topicBreakdown);

        return result;
    }

    public List<Map<String, Object>> getRoadmapStats(String userId) {
        List<Roadmap> roadmaps = roadmapRepository.findByUserOrderByCreatedAtDesc(userId);
        return roadmaps.stream().map(roadmap -> {
            int totalModules = roadmap.getModules() != null ? roadmap.getModules().size() : 0;
            long completedModules = roadmap.getModules() != null ? roadmap.getModules().stream().filter(m -> m.getIsCompleted() != null && m.getIsCompleted()).count() : 0;
            int progress = totalModules > 0 ? (int) Math.round(((double) completedModules / totalModules) * 100) : 0;

            Map<String, Object> stat = new HashMap<>();
            stat.put("_id", roadmap.getId());
            stat.put("title", roadmap.getTitle());
            stat.put("topic", roadmap.getTopic() != null ? roadmap.getTopic() : "General");
            stat.put("progress", progress);
            stat.put("completedModules", completedModules);
            stat.put("totalModules", totalModules);
            stat.put("createdAt", roadmap.getCreatedAt());
            stat.put("modules", roadmap.getModules());
            return stat;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getQuizStats(String userId) {
        List<QuizAttempt> attempts = quizAttemptRepository.findByUserOrderByCreatedAtDesc(userId);
        return attempts.stream().map(attempt -> {
            Map<String, Object> stat = new HashMap<>();
            stat.put("_id", attempt.getId());
            stat.put("moduleTitle", attempt.getModuleTitle());
            
            Roadmap r = null;
            if (attempt.getRoadmap() != null) {
                r = roadmapRepository.findById(attempt.getRoadmap()).orElse(null);
            }
            stat.put("roadmapTitle", r != null ? r.getTitle() : "External Source");
            stat.put("roadmapId", attempt.getRoadmap());
            stat.put("score", attempt.getScore());
            stat.put("answers", attempt.getAnswers() != null ? attempt.getAnswers() : new ArrayList<>());
            stat.put("createdAt", attempt.getCreatedAt());
            stat.put("attemptedAt", attempt.getCreatedAt());
            return stat;
        }).collect(Collectors.toList());
    }

    private List<String> getAttributedCategories(String str, List<CategoryMapping> mappings) {
        if (str == null || str.isEmpty()) return Collections.singletonList("General");
        String lowerStr = str.toLowerCase();
        Set<String> categories = new HashSet<>();

        for (CategoryMapping mapping : mappings) {
            if (lowerStr.contains(mapping.getTag().toLowerCase())) {
                categories.addAll(mapping.getCategories());
            }
        }

        return categories.isEmpty() ? Collections.singletonList("General") : new ArrayList<>(categories);
    }

    private static class TopicScore {
        double totalScore = 0;
        int count = 0;
    }

    private static class CategoryStat {
        double totalScore = 0;
        int count = 0;
        int completedModules = 0;
    }
}
