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
@Document(collection = "roadmaps")
public class Roadmap {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoadmapResource {
        private String title;
        private String type; // video, article, doc, challenge, course
        private String url;
        private String description;
        private String thumbnail;
        private String source = "external";
        private String knowledgeRef; // ref KnowledgeNode
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PracticeProblem {
        private String title;
        private String url;
        private String difficulty; // Easy, Medium, Hard
        private String source = "external";
        private String problemRef; // ref CodingQuestion
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizConfig {
        private Boolean autoGenerate = true;
        private String topic;
        private Integer questionCount = 5;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EffortEstimate {
        private Integer readingMinutes = 30;
        private Integer practiceMinutes = 45;
        private Integer assessmentMinutes = 15;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnlockCriteria {
        private Double masteryThreshold = 0.0;
        private Double quizScore = 0.0;
        private Integer problemsSolved = 0;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoadmapModule {
        private String title;
        private String description;
        private String estimatedTime;
        private Integer order = 0;
        private String difficulty = "Intermediate";
        
        private List<String> objectives;
        private List<String> keyConcepts;
        
        private List<String> knowledgeRefs; // ref KnowledgeNode
        
        private List<PracticeProblem> practiceProblems;
        private List<RoadmapResource> resources;
        private List<RoadmapResource> learningResources;
        
        private QuizConfig quizConfig = new QuizConfig();
        private EffortEstimate effortEstimate = new EffortEstimate();
        
        private String interviewImportance = "Medium";
        private Integer conceptWeight = 5;
        
        private UnlockCriteria unlockCriteria = new UnlockCriteria();
        
        private Boolean isCompleted = false;
    }

    @Id
    private String id;
    private String user; // ref User
    private String title;
    private String topic = "General";
    private String description;
    private String difficulty;
    private String totalDuration;

    private List<String> learningGoals;
    private List<String> targetRoles;
    private List<String> expectedOutcomes;
    private List<String> skillsCovered;
    private List<String> tags;
    private List<String> prerequisites;

    private List<RoadmapModule> modules;
    private Double progress = 0.0;
    private Boolean isPublic = false;
    private String sourceMaterial; // ref StudyMaterial

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;
}
