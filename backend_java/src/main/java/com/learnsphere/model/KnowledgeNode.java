package com.learnsphere.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "knowledgenodes")
public class KnowledgeNode {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Implementation {
        private String language;
        private String code;
        private String explanation = "";
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Prerequisite {
        private String title;
        private String entryId; // ref KnowledgeNode
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LinkedProblem {
        private String problemId; // ref CodingQuestion
        private String title;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KnowledgeResource {
        private String title;
        private String url = "";
        private String type = "article"; // doc, video, article, tutorial
        private String source = "external"; // internal, external
        private String knowledgeRef; // ref KnowledgeNode
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Complexity {
        private String time = "";
        private String space = "";
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KnowledgeStats {
        private Integer views = 0;
        private Integer completions = 0;
        private Double avgReadTime = 0.0;
    }

    @Id
    private String id;
    private String topic;
    private String slug;
    private String category;
    private String topicType = "Concept";
    private String difficulty = "Intermediate";
    private List<String> tags;
    private List<String> keywords;

    private String summary;
    private String intuition = "";
    private String detailedContent;
    private Integer estimatedReadTime = 5;

    private List<String> keyPrinciples;
    private List<String> commonPitfalls;

    private List<Implementation> implementations;
    private List<Implementation> codeSnippets;

    private Complexity complexity = new Complexity();

    private List<Prerequisite> prerequisites;
    private List<String> relatedTopics; // ref KnowledgeNode
    private String nextTopic; // ref KnowledgeNode
    private String previousTopic; // ref KnowledgeNode

    private List<LinkedProblem> linkedProblems;
    private List<String> linkedQuizzes; // ref Quiz

    private Double importanceScore = 5.0;
    private String interviewFrequency = "Medium";
    private Double conceptWeight = 0.5;

    private List<Double> embedding;
    private String searchableText = "";

    private List<KnowledgeResource> verifiedResources;
    private List<KnowledgeResource> furtherReading;

    private KnowledgeStats stats = new KnowledgeStats();

    private String createdBy; // ref User
    private Boolean isPublished = true;

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;
}
