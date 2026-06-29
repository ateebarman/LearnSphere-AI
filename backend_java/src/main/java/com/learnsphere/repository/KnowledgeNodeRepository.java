package com.learnsphere.repository;

import com.learnsphere.model.KnowledgeNode;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KnowledgeNodeRepository extends MongoRepository<KnowledgeNode, String> {
    Optional<KnowledgeNode> findBySlug(String slug);
    Optional<KnowledgeNode> findByTopic(String topic);
    
    @org.springframework.data.mongodb.repository.Query("{ '$or': [ { 'topic': { $regex: ?0, $options: 'i' } }, { 'keywords': { $in: ?1 } } ] }")
    java.util.List<KnowledgeNode> findRelevantNodes(String regex, java.util.List<String> keywords);
}
