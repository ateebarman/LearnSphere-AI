package com.learnsphere.controller;

import com.learnsphere.model.CodingQuestion;
import com.learnsphere.model.Submission;
import com.learnsphere.model.User;
import com.learnsphere.model.UserCodingProgress;
import com.learnsphere.repository.CodingQuestionRepository;
import com.learnsphere.repository.SubmissionRepository;
import com.learnsphere.repository.UserCodingProgressRepository;
import com.learnsphere.repository.UserRepository;
import com.learnsphere.service.CodingService;
import com.learnsphere.service.ai.CodingGeneratorService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/coding")
public class CodingController {

    private final CodingService codingService;
    private final CodingGeneratorService codingGeneratorService;
    private final CodingQuestionRepository codingQuestionRepository;
    private final UserCodingProgressRepository userCodingProgressRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    public CodingController(CodingService codingService,
                            CodingGeneratorService codingGeneratorService,
                            CodingQuestionRepository codingQuestionRepository,
                            UserCodingProgressRepository userCodingProgressRepository,
                            SubmissionRepository submissionRepository,
                            UserRepository userRepository,
                            MongoTemplate mongoTemplate) {
        this.codingService = codingService;
        this.codingGeneratorService = codingGeneratorService;
        this.codingQuestionRepository = codingQuestionRepository;
        this.userCodingProgressRepository = userCodingProgressRepository;
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
        this.mongoTemplate = mongoTemplate;
    }

    @PostMapping("/generate")
    public ResponseEntity<List<CodingQuestion>> generateQuestions(@RequestBody Map<String, String> request) {
        String topic = request.get("topic");
        if (topic == null || topic.isEmpty()) return ResponseEntity.badRequest().build();

        Query query = new Query();
        query.addCriteria(Criteria.where("topic").regex("^" + Pattern.quote(topic) + "$", "i"));
        query.limit(50);
        List<CodingQuestion> questions = mongoTemplate.find(query, CodingQuestion.class);
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/generate-ai")
    public ResponseEntity<List<CodingQuestion>> triggerAiGeneration(@RequestBody Map<String, Object> request) {
        String topic = (String) request.get("topic");
        String description = (String) request.getOrDefault("description", "");
        int count = request.containsKey("count") ? (Integer) request.get("count") : 1;

        List<CodingQuestion> results = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            try {
                CodingQuestion question = codingGeneratorService.generateCodingQuestionFromAI(topic, description);
                question.setTopic(topic.toLowerCase());
                results.add(codingQuestionRepository.save(question));
            } catch (Exception e) {
                System.err.println("Failed to generate question: " + e.getMessage());
            }
        }
        return ResponseEntity.ok(results);
    }

    @PostMapping("/run")
    public ResponseEntity<Map<String, Object>> runCode(@RequestBody Map<String, String> request) {
        String questionId = request.get("questionId");
        String code = request.get("code");
        String language = request.get("language");
        
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(codingService.runCode(questionId, code, language));
    }

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitCode(@RequestBody Map<String, String> request, Authentication authentication) {
        String questionId = request.get("questionId");
        String code = request.get("code");
        String language = request.get("language");
        String topic = request.get("topic");
        String userId = (String) authentication.getPrincipal();

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(codingService.submitCode(questionId, code, language, topic, userId));
    }

    @GetMapping("/status/{token}")
    public ResponseEntity<?> checkResult(@PathVariable String token, Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(codingService.checkResult(token, userId));
    }

    @GetMapping("/problems")
    public ResponseEntity<Map<String, Object>> getProblems(
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            Authentication authentication) {

        String userId = (String) authentication.getPrincipal();
        Query query = new Query();

        if (topic != null && !topic.isEmpty()) {
            query.addCriteria(Criteria.where("topic").regex("^" + Pattern.quote(topic) + "$", "i"));
        }
        if (difficulty != null && !difficulty.isEmpty()) {
            query.addCriteria(Criteria.where("difficulty").is(difficulty));
        }
        if (search != null && !search.isEmpty()) {
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("title").regex(search, "i"),
                    Criteria.where("topic").regex(search, "i")
            ));
        }

        List<UserCodingProgress> progresses = userCodingProgressRepository.findByUser(userId);
        Set<String> solvedIds = progresses.stream()
                .flatMap(p -> p.getSolvedProblems() != null ? p.getSolvedProblems().stream() : java.util.stream.Stream.empty())
                .collect(Collectors.toSet());

        if ("solved".equalsIgnoreCase(status)) {
            query.addCriteria(Criteria.where("_id").in(solvedIds));
        } else if ("unsolved".equalsIgnoreCase(status)) {
            query.addCriteria(Criteria.where("_id").nin(solvedIds));
        }

        long total = mongoTemplate.count(query, CodingQuestion.class);
        query.with(PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.ASC, "createdAt")));
        
        // We only want a few fields, but for simplicity we fetch the whole object and map
        List<CodingQuestion> questions = mongoTemplate.find(query, CodingQuestion.class);

        List<Map<String, Object>> problems = new ArrayList<>();
        for (CodingQuestion q : questions) {
            Map<String, Object> p = new HashMap<>();
            p.put("_id", q.getId());
            p.put("title", q.getTitle());
            p.put("difficulty", q.getDifficulty());
            p.put("topic", q.getTopic());
            p.put("slug", q.getSlug());
            p.put("isSolved", solvedIds.contains(q.getId()));
            problems.add(p);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("problems", problems);
        result.put("page", page);
        result.put("pages", (int) Math.ceil((double) total / limit));
        result.put("total", total);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/problems/{slug}")
    public ResponseEntity<CodingQuestion> getProblemBySlug(@PathVariable String slug) {
        return codingQuestionRepository.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/progress")
    public ResponseEntity<List<UserCodingProgress>> getProgress(@RequestParam(required = false) String topic, Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        
        if (topic != null && !topic.isEmpty()) {
            return userCodingProgressRepository.findByUserAndTopicIgnoreCase(userId, topic)
                    .map(p -> ResponseEntity.ok(Collections.singletonList(p)))
                    .orElse(ResponseEntity.ok(Collections.emptyList()));
        }

        return ResponseEntity.ok(userCodingProgressRepository.findByUser(userId));
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();

        User user = userRepository.findById(userId).orElse(new User());
        List<UserCodingProgress> progresses = userCodingProgressRepository.findByUser(userId);
        List<Submission> recentSubmissions = submissionRepository.findByUserOrderByCreatedAtDesc(userId);
        if (recentSubmissions.size() > 10) {
            recentSubmissions = recentSubmissions.subList(0, 10);
        }

        Map<String, Integer> difficultyBreakdown = new HashMap<>();
        difficultyBreakdown.put("Easy", 0);
        difficultyBreakdown.put("Medium", 0);
        difficultyBreakdown.put("Hard", 0);

        List<String> solvedIds = user.getSolvedProblems() != null ? user.getSolvedProblems() : new ArrayList<>();
        if (!solvedIds.isEmpty()) {
            Query q = new Query(Criteria.where("_id").in(solvedIds));
            q.fields().include("difficulty");
            List<CodingQuestion> solvedQuestions = mongoTemplate.find(q, CodingQuestion.class);
            for (CodingQuestion qObj : solvedQuestions) {
                String diff = qObj.getDifficulty();
                if (diff != null && difficultyBreakdown.containsKey(diff)) {
                    difficultyBreakdown.put(diff, difficultyBreakdown.get(diff) + 1);
                }
            }
        }

        Date sevenDaysAgo = Date.from(LocalDate.now().minusDays(6).atStartOfDay(ZoneId.systemDefault()).toInstant());
        List<Submission> last7DaysSubs = submissionRepository.findByUserAndCreatedAtAfter(userId, sevenDaysAgo);

        List<Map<String, Object>> activity = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            long count = last7DaysSubs.stream()
                    .filter(s -> s.getCreatedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDate().equals(date))
                    .count();
            Map<String, Object> day = new HashMap<>();
            day.put("date", date.toString());
            day.put("count", count);
            activity.add(day);
        }

        int totalAccuracy = 0;
        if (!progresses.isEmpty()) {
            totalAccuracy = (int) Math.round(progresses.stream().mapToDouble(UserCodingProgress::getAccuracy).average().orElse(0.0));
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSolved", solvedIds.size());
        stats.put("streak", user.getStreak() != null ? user.getStreak() : 0);
        stats.put("accuracy", totalAccuracy);

        Map<String, Object> response = new HashMap<>();
        response.put("stats", stats);
        response.put("difficultyBreakdown", difficultyBreakdown);
        response.put("recentSubmissions", recentSubmissions);
        response.put("activity", activity);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/submissions/{questionId}")
    public ResponseEntity<List<Submission>> getSubmissions(@PathVariable String questionId, Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(submissionRepository.findByUserAndQuestionOrderByCreatedAtDesc(userId, questionId));
    }
}
