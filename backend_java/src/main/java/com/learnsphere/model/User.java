package com.learnsphere.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
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
@JsonIgnoreProperties(ignoreUnknown = true)
@Document(collection = "users")
public class User {
    @Id
    private String id;

    @JsonProperty("_id")
    public String getUnderscoreId() {
        return this.id;
    }

    @JsonProperty("_id")
    public void setUnderscoreId(String id) {
        if (this.id == null) {
            this.id = id;
        }
    }

    private String name;
    private String email;
    private String password;
    private String authProvider = "local";
    private String avatarUrl;
    private List<String> topicsOfInterest;
    private List<String> solvedProblems;
    private Integer streak = 0;
    private Date lastSolvedAt;
    private String role = "user";
    private UserStats stats = new UserStats();
    private UserProfile profile = new UserProfile();

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class UserStats {
        private Integer interviewsCount = 0;
        private Double averageScore = 0.0;
        private Integer codingProblemsSolved = 0;
        private Integer roadmapsCreated = 0;
        private Integer quizzesTaken = 0;
        private Double quizAverageScore = 0.0;
        private Integer totalStudyHours = 0;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class UserProfile {
        private String targetRole;
        private String experienceLevel = "Beginner";
        private String bio;
        private List<String> targetCompanies;
        private String resumeText;
        private Object resumeData;
        private List<String> skills;
    }
}
