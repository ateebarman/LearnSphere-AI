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
@Document(collection = "users")
public class User {
    @Id
    private String id;
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
    public static class UserStats {
        private Integer interviewsCount = 0;
        private Double averageScore = 0.0;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserProfile {
        private String resumeText;
        private Object resumeData;
        private List<String> skills;
    }
}
