package com.learnsphere.repository;

import com.learnsphere.model.StudyMaterial;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudyMaterialRepository extends MongoRepository<StudyMaterial, String> {
}
