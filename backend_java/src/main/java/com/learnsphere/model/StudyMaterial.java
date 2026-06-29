package com.learnsphere.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "studymaterials")
public class StudyMaterial {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudyMaterialMetadata {
        private String title;
        private Integer pageCount;
        private Long fileSize;
        private String errorMessage;
    }

    @Id
    private String id;
    private String user; // ref User
    private String fileName;
    private String fileType = "pdf";
    private String fileUrl;
    private String status = "uploading";
    private String vectorStatus = "pending";
    private StudyMaterialMetadata metadata;

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;
}
