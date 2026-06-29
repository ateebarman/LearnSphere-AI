package com.learnsphere.service;

import com.learnsphere.model.KnowledgeNode;
import com.learnsphere.repository.KnowledgeNodeRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class KnowledgeService {

    private final KnowledgeNodeRepository knowledgeNodeRepository;
    private final MongoTemplate mongoTemplate;

    public KnowledgeService(KnowledgeNodeRepository knowledgeNodeRepository, MongoTemplate mongoTemplate) {
        this.knowledgeNodeRepository = knowledgeNodeRepository;
        this.mongoTemplate = mongoTemplate;
    }

    @Cacheable(value = "knowledge:all", condition = "#category == null || #category.equals('All')")
    public List<KnowledgeNode> getKnowledgeNodes(String category) {
        if (category == null || category.equals("All")) {
            return knowledgeNodeRepository.findAll(Sort.by(Sort.Direction.ASC, "topic"));
        } else {
            // Need a custom query if category filter is present
            // Wait, we can just use the repository if we add findByCategory
            return mongoTemplate.query(KnowledgeNode.class)
                    .matching(org.springframework.data.mongodb.core.query.Query.query(
                            org.springframework.data.mongodb.core.query.Criteria.where("category").is(category))
                            .with(Sort.by(Sort.Direction.ASC, "topic")))
                    .all();
        }
    }

    @Cacheable(value = "knowledge:detail", key = "#topic")
    public KnowledgeNode getKnowledgeDetails(String topic) {
        return knowledgeNodeRepository.findByTopic(topic)
                .orElseThrow(() -> new RuntimeException("Knowledge topic not found"));
    }

    @Cacheable(value = "knowledge:categories")
    public List<String> getCategories() {
        return mongoTemplate.findDistinct(new org.springframework.data.mongodb.core.query.Query(), "category", KnowledgeNode.class, String.class);
    }
}
