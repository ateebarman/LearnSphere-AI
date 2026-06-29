package com.learnsphere.repository;

import com.learnsphere.model.UserCodingProgress;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserCodingProgressRepository extends MongoRepository<UserCodingProgress, String> {
    java.util.List<UserCodingProgress> findByUser(String userId);
    Optional<UserCodingProgress> findByUserAndTopic(String userId, String topic);
    Optional<UserCodingProgress> findByUserAndTopicIgnoreCase(String userId, String topic);
}
