package com.learnsphere.repository;

import com.learnsphere.model.QuizAttempt;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptRepository extends MongoRepository<QuizAttempt, String> {
    List<QuizAttempt> findByUserAndRoadmap(String userId, String roadmapId);
    List<QuizAttempt> findByUser(String userId);
    List<QuizAttempt> findByUserOrderByCreatedAtDesc(String userId);
}
