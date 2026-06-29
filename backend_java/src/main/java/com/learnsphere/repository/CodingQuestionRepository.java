package com.learnsphere.repository;

import com.learnsphere.model.CodingQuestion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CodingQuestionRepository extends MongoRepository<CodingQuestion, String> {
    Optional<CodingQuestion> findBySlug(String slug);
    
    @org.springframework.data.mongodb.repository.Query("{ '$or': [ { 'title': { $regex: ?0, $options: 'i' } }, { 'topic': { $in: ?1 } } ] }")
    java.util.List<CodingQuestion> findRelevantProblems(String regex, java.util.List<String> topics);
}
