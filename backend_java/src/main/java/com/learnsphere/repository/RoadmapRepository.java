package com.learnsphere.repository;

import com.learnsphere.model.Roadmap;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoadmapRepository extends MongoRepository<Roadmap, String> {
    List<Roadmap> findByUserOrderByCreatedAtDesc(String userId);
    List<Roadmap> findByIsPublicTrueOrderByCreatedAtDesc();
}
