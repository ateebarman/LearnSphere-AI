package com.learnsphere.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswer {
    private String question;
    private String selectedAnswer;
    private String correctAnswer;
    private Boolean isCorrect;
}
