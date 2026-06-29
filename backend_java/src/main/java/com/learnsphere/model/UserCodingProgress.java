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
@Document(collection = "usercodingprogresses")
public class UserCodingProgress {
    @Id
    private String id;
    private String user; // ref User
    private String topic;
    private Integer solvedQuestions = 0;
    private Integer attempts = 0;
    private Double accuracy = 0.0;
    private Integer streak = 0;
    private Date lastSolvedAt;
    private List<String> solvedProblems; // ref CodingQuestion

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;
}
