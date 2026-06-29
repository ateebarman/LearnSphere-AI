package com.learnsphere.repository;

import com.learnsphere.model.InterviewSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewSessionRepository extends MongoRepository<InterviewSession, String> {
    List<InterviewSession> findByCandidateIdOrderByCreatedAtDesc(String candidateId);
}
