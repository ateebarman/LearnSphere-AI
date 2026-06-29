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
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "codingquestions")
public class CodingQuestion {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FunctionSignature {
        private String methodName;
        private List<Parameter> parameters;
        private String returnType;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Parameter {
            private String name;
            private String type;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Example {
        private String input;
        private String output;
        private String explanation;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodeSnippet {
        private String javascript;
        private String python;
        private String cpp;

        public String get(String language) {
            if (language == null) return null;
            switch (language.toLowerCase()) {
                case "javascript": return javascript;
                case "python": return python;
                case "cpp": return cpp;
                default: return null;
            }
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestCase {
        private String input;
        private String expectedOutput;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmissionStats {
        private Integer totalSubmissions = 0;
        private Integer acceptedSubmissions = 0;
    }

    @Id
    private String id;
    private String topic;
    private String slug;
    private String title;
    private String difficulty; // Easy, Medium, Hard
    private String problemStatement;
    private List<String> constraints;
    
    private Map<String, Object> inputSchema;
    private Map<String, Object> outputSchema;
    private FunctionSignature functionSignature;
    
    private List<Example> examples;
    private CodeSnippet starterCode;
    private CodeSnippet judgeDriver;
    private CodeSnippet judgePreDriver;
    private CodeSnippet referenceSolution;
    
    private List<TestCase> visibleTestCases;
    private List<TestCase> hiddenTestCases;
    
    private Boolean validated = false;
    private Double acceptanceRate = 0.0;
    private SubmissionStats submissionStats = new SubmissionStats();

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;
}
