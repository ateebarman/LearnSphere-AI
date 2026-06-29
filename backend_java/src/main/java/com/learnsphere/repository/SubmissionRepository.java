package com.learnsphere.repository;

import com.learnsphere.model.Submission;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends MongoRepository<Submission, String> {
    List<Submission> findByUserOrderByCreatedAtDesc(String userId);
    List<Submission> findByUserAndQuestionOrderByCreatedAtDesc(String userId, String questionId);
    List<Submission> findByUserAndCreatedAtAfter(String userId, java.util.Date date);
    long countByQuestion(String questionId);
    long countByQuestionAndStatus(String questionId, String status);
}
