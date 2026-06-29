package com.learnsphere.repository;

import com.learnsphere.model.CategoryMapping;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryMappingRepository extends MongoRepository<CategoryMapping, String> {
    Optional<CategoryMapping> findByTag(String tag);
}
