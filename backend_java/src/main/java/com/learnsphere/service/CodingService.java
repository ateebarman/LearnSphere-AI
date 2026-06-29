package com.learnsphere.service;

import com.learnsphere.model.CodingQuestion;
import com.learnsphere.model.Submission;
import com.learnsphere.model.User;
import com.learnsphere.model.UserCodingProgress;
import com.learnsphere.repository.CodingQuestionRepository;
import com.learnsphere.repository.SubmissionRepository;
import com.learnsphere.repository.UserCodingProgressRepository;
import com.learnsphere.repository.UserRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class CodingService {

    private final CodingQuestionRepository codingQuestionRepository;
    private final SubmissionRepository submissionRepository;
    private final UserCodingProgressRepository userCodingProgressRepository;
    private final UserRepository userRepository;
    private final CompilerService compilerService;
    private final RedisTemplate<String, Object> redisTemplate;

    public CodingService(CodingQuestionRepository codingQuestionRepository,
                         SubmissionRepository submissionRepository,
                         UserCodingProgressRepository userCodingProgressRepository,
                         UserRepository userRepository,
                         CompilerService compilerService,
                         RedisTemplate<String, Object> redisTemplate) {
        this.codingQuestionRepository = codingQuestionRepository;
        this.submissionRepository = submissionRepository;
        this.userCodingProgressRepository = userCodingProgressRepository;
        this.userRepository = userRepository;
        this.compilerService = compilerService;
        this.redisTemplate = redisTemplate;
    }

    private String wrapUserCode(String code, String language, String driver, String preDriver) {
        if (code == null) return "";

        boolean hasEntryPoint = false;
        switch (language.toLowerCase()) {
            case "cpp":
                hasEntryPoint = code.matches(".*int\\s+main\\s*\\(.*") || code.matches(".*void\\s+main\\s*\\(.*");
                break;
            case "python":
                hasEntryPoint = code.matches(".*if\\s+__name__\\s*==\\s*['\"]__main__['\"].*");
                break;
            case "javascript":
                hasEntryPoint = code.contains("process.stdin") || code.contains("fs.readFileSync(0)");
                break;
        }

        if (hasEntryPoint) return code;

        StringBuilder wrapped = new StringBuilder();

        if ("cpp".equalsIgnoreCase(language)) {
            wrapped.append("#include <bits/stdc++.h>\nusing namespace std;\n\n");
        }

        if (preDriver != null) {
            wrapped.append(preDriver).append("\n\n");
        }

        wrapped.append(code).append("\n\n");

        if (driver != null) {
            wrapped.append(driver);
        }

        return wrapped.toString();
    }

    public Map<String, Object> runCode(String questionId, String code, String language) {
        CodingQuestion question = codingQuestionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        String driver = question.getJudgeDriver() != null ? question.getJudgeDriver().get(language) : null;
        String preDriver = question.getJudgePreDriver() != null ? question.getJudgePreDriver().get(language) : null;
        String finalCode = wrapUserCode(code, language, driver, preDriver);

        List<CodingQuestion.TestCase> visibleCases = question.getVisibleTestCases() != null ? question.getVisibleTestCases() : new ArrayList<>();
        String batchInput = visibleCases.size() + "\n" + visibleCases.stream()
                .map(CodingQuestion.TestCase::getInput)
                .collect(Collectors.joining("\n"));

        String token = compilerService.submitToJudge(finalCode, language, batchInput);

        Map<String, Object> context = new HashMap<>();
        context.put("type", "run");
        context.put("questionId", questionId);
        
        redisTemplate.opsForValue().set("env:execution:" + token, context, 5, TimeUnit.MINUTES);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("status", "Processing");
        response.put("type", "run");
        response.put("questionId", questionId);

        return response;
    }

    public Map<String, Object> submitCode(String questionId, String code, String language, String topic, String userId) {
        CodingQuestion question = codingQuestionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        List<CodingQuestion.TestCase> allCases = new ArrayList<>();
        if (question.getVisibleTestCases() != null) allCases.addAll(question.getVisibleTestCases());
        if (question.getHiddenTestCases() != null) allCases.addAll(question.getHiddenTestCases());

        String driver = question.getJudgeDriver() != null ? question.getJudgeDriver().get(language) : null;
        String preDriver = question.getJudgePreDriver() != null ? question.getJudgePreDriver().get(language) : null;
        String finalCode = wrapUserCode(code, language, driver, preDriver);

        String batchInput = allCases.size() + "\n" + allCases.stream()
                .map(CodingQuestion.TestCase::getInput)
                .collect(Collectors.joining("\n"));

        String token = compilerService.submitToJudge(finalCode, language, batchInput);

        Map<String, Object> context = new HashMap<>();
        context.put("type", "submit");
        context.put("userId", userId);
        context.put("questionId", questionId);
        context.put("code", code);
        context.put("language", language);
        context.put("topic", topic);

        redisTemplate.opsForValue().set("env:execution:" + token, context, 10, TimeUnit.MINUTES);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("status", "Processing");
        response.put("type", "submit");
        response.put("questionId", questionId);
        response.put("topic", topic);

        return response;
    }

    public Object checkResult(String token, String currentUserId) {
        Map<String, Object> context = (Map<String, Object>) redisTemplate.opsForValue().get("env:execution:" + token);
        Map<String, Object> result = compilerService.getJudgeResult(token);

        if (Boolean.TRUE.equals(result.get("isProcessing"))) {
            return result;
        }

        if (context != null) {
            redisTemplate.delete("env:execution:" + token);
        }

        if (context == null) {
            return result; // Fallback if cache expired
        }

        String type = (String) context.get("type");
        String questionId = (String) context.get("questionId");

        CodingQuestion question = codingQuestionRepository.findById(questionId).orElse(null);
        if (question == null) return Map.of("message", "Question not found");

        if ("run".equals(type)) {
            if (!"Accepted".equals(result.get("status"))) {
                Map<String, Object> err = new HashMap<>();
                err.put("status", result.get("status"));
                err.put("compile_output", result.get("compile_output"));
                err.put("stderr", result.get("stderr"));
                err.put("passed", false);
                return Collections.singletonList(err);
            }

            String stdout = (String) result.get("stdout");
            String[] outputs = stdout != null ? stdout.split("CASE_RESULT_DELIMITER") : new String[0];
            outputs = Arrays.stream(outputs).map(String::trim).filter(s -> !s.isEmpty()).toArray(String[]::new);

            List<Map<String, Object>> details = new ArrayList<>();
            List<CodingQuestion.TestCase> visibleCases = question.getVisibleTestCases() != null ? question.getVisibleTestCases() : new ArrayList<>();
            
            for (int i = 0; i < visibleCases.size(); i++) {
                CodingQuestion.TestCase tc = visibleCases.get(i);
                String actual = i < outputs.length ? outputs[i] : "";
                String expected = tc.getExpectedOutput() != null ? tc.getExpectedOutput() : "";
                
                String cleanActual = actual.replaceAll("\\s+", "");
                String cleanExpected = expected.replaceAll("\\s+", "");

                Map<String, Object> detail = new HashMap<>();
                detail.put("input", tc.getInput());
                detail.put("expected", expected);
                detail.put("actual", actual);
                detail.put("status", result.get("status"));
                detail.put("time", result.get("time"));
                detail.put("memory", result.get("memory"));
                detail.put("passed", cleanActual.equals(cleanExpected));
                details.add(detail);
            }
            return details;
        }

        if ("submit".equals(type)) {
            String userId = (String) context.get("userId");
            String code = (String) context.get("code");
            String language = (String) context.get("language");
            String topic = (String) context.get("topic");

            List<CodingQuestion.TestCase> allCases = new ArrayList<>();
            if (question.getVisibleTestCases() != null) allCases.addAll(question.getVisibleTestCases());
            if (question.getHiddenTestCases() != null) allCases.addAll(question.getHiddenTestCases());

            if (!"Accepted".equals(result.get("status"))) {
                Map<String, Object> err = new HashMap<>();
                err.put("success", false);
                err.put("status", result.get("status"));
                err.put("compile_output", result.get("compile_output"));
                err.put("stderr", result.get("stderr"));
                return err;
            }

            String stdout = (String) result.get("stdout");
            String[] outputs = stdout != null ? stdout.split("CASE_RESULT_DELIMITER") : new String[0];
            outputs = Arrays.stream(outputs).map(String::trim).filter(s -> !s.isEmpty()).toArray(String[]::new);

            int passedCount = 0;
            List<Map<String, Object>> testCaseResults = new ArrayList<>();
            
            for (int i = 0; i < allCases.size(); i++) {
                CodingQuestion.TestCase tc = allCases.get(i);
                String actual = i < outputs.length ? outputs[i] : "";
                String expected = tc.getExpectedOutput() != null ? tc.getExpectedOutput() : "";
                
                String cleanActual = actual.replaceAll("\\s+", "");
                String cleanExpected = expected.replaceAll("\\s+", "");
                boolean passed = cleanActual.equals(cleanExpected);
                if (passed) passedCount++;

                Map<String, Object> res = new HashMap<>();
                res.put("passed", passed);
                res.put("input", tc.getInput());
                res.put("expected", expected);
                res.put("actual", actual);
                testCaseResults.add(res);
            }

            boolean isAccepted = (passedCount == allCases.size() && !allCases.isEmpty());

            Submission submission = new Submission();
            submission.setUser(userId);
            submission.setQuestion(questionId);
            submission.setLanguage(language != null ? language : "unknown");
            submission.setCode(code != null ? code : "// Code missing");
            submission.setStatus(isAccepted ? "Accepted" : ("Accepted".equals(result.get("status")) ? "Wrong Answer" : (String) result.get("status")));
            submission.setPassedCount(passedCount);
            submission.setTotalCount(allCases.size());
            
            // Handle parsing time and memory gracefully if they come as String or Double
            Object timeObj = result.get("time");
            if (timeObj instanceof Number) submission.setRuntime(((Number) timeObj).doubleValue());
            else if (timeObj instanceof String) {
                try { submission.setRuntime(Double.parseDouble((String) timeObj)); } catch (Exception ignored) {}
            }
            
            Object memoryObj = result.get("memory");
            if (memoryObj instanceof Number) submission.setMemory(((Number) memoryObj).doubleValue());
            else if (memoryObj instanceof String) {
                try { submission.setMemory(Double.parseDouble((String) memoryObj)); } catch (Exception ignored) {}
            }
            
            submissionRepository.save(submission);

            // Update Stats
            long totalSubmissions = submissionRepository.countByQuestion(questionId);
            long acceptedSubmissions = submissionRepository.countByQuestionAndStatus(questionId, "Accepted");
            double acceptanceRate = totalSubmissions > 0 ? (double) Math.round(((double) acceptedSubmissions / totalSubmissions) * 100) : 0.0;

            question.setAcceptanceRate(acceptanceRate);
            CodingQuestion.SubmissionStats stats = question.getSubmissionStats() != null ? question.getSubmissionStats() : new CodingQuestion.SubmissionStats();
            stats.setTotalSubmissions((int) totalSubmissions);
            stats.setAcceptedSubmissions((int) acceptedSubmissions);
            question.setSubmissionStats(stats);
            codingQuestionRepository.save(question);

            UserCodingProgress progress = userCodingProgressRepository.findByUserAndTopicIgnoreCase(userId, topic)
                    .orElse(new UserCodingProgress());
            if (progress.getUser() == null) {
                progress.setUser(userId);
                progress.setTopic(topic);
            }

            progress.setAttempts(progress.getAttempts() + 1);
            if (isAccepted) {
                progress.setSolvedQuestions(progress.getSolvedQuestions() + 1);
                progress.setLastSolvedAt(new Date());
                progress.setStreak(progress.getStreak() + 1);
                if (progress.getSolvedProblems() == null) progress.setSolvedProblems(new ArrayList<>());
                if (!progress.getSolvedProblems().contains(questionId)) {
                    progress.getSolvedProblems().add(questionId);
                }
            }
            double calculatedAccuracy = progress.getAttempts() > 0 ? ((double) progress.getSolvedQuestions() / progress.getAttempts()) * 100 : 0.0;
            progress.setAccuracy((double) Math.round(calculatedAccuracy));
            userCodingProgressRepository.save(progress);

            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                if (isAccepted) {
                    if (user.getSolvedProblems() == null) user.setSolvedProblems(new ArrayList<>());
                    if (!user.getSolvedProblems().contains(questionId)) {
                        user.getSolvedProblems().add(questionId);
                        user.setStreak(user.getStreak() != null ? user.getStreak() + 1 : 1);
                        user.setLastSolvedAt(new Date());
                        userRepository.save(user);
                    }
                }
            }

            Map<String, Object> finalResponse = new HashMap<>();
            finalResponse.put("status", submission.getStatus());
            finalResponse.put("passed", passedCount);
            finalResponse.put("total", allCases.size());
            finalResponse.put("failedCases", isAccepted ? Collections.emptyList() : testCaseResults.stream().filter(r -> !(Boolean)r.get("passed")).limit(1).collect(Collectors.toList()));
            finalResponse.put("visibleResults", testCaseResults.subList(0, Math.min(testCaseResults.size(), question.getVisibleTestCases() != null ? question.getVisibleTestCases().size() : 0)));
            finalResponse.put("progress", progress);

            return finalResponse;
        }

        return result;
    }
}
