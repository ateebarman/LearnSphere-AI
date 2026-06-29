package com.learnsphere.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "interviews")
public class InterviewSession {

    @Id
    private String id;
    private String candidateId;
    private String mode = "mock";
    private String company = "generic";
    private String targetRole = "Software Engineer";
    private String topic;
    private String stage = "INTRO";
    private String status = "PLANNED";
    private String difficulty = "adaptive";
    private List<Message> transcript;
    private CodingProblem codingProblem;
    private Evaluation evaluation;
    private Metadata metadata;

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Message {
        private String role;
        private String content;
        private Date timestamp = new Date();
        private String stage;
        private Boolean isFollowUp;
        private String audioUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodingProblem {
        private String title;
        private String description;
        private String difficulty;
        private String language = "javascript";
        private String starterCode;
        private String solution;
        private List<TestCase> testCases;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestCase {
        private String input;
        private String output;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Evaluation {
        private Double overallScore;
        private Double technicalScore;
        private Double communicationScore;
        private Double problemSolvingScore;
        private Double confidenceScore;
        private String hiringRecommendation;
        private List<String> strengths;
        private List<String> weaknesses;
        private List<String> improvementSuggestions;
        private String summary;
        private Map<String, Double> topicScores;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Metadata {
        private Boolean resumeUsed = false;
        private Boolean voiceMode = false;
        private Integer durationSeconds = 0;
        private Integer questionsAsked = 0;
        private Integer followUpsAsked = 0;
        private Integer hintsUsed = 0;
    }
}
