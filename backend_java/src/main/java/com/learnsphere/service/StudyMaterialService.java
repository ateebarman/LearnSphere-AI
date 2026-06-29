package com.learnsphere.service;

import com.learnsphere.model.StudyMaterial;
import com.learnsphere.repository.StudyMaterialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

@Service
public class StudyMaterialService {

    @Autowired
    private StudyMaterialRepository studyMaterialRepository;

    private final String uploadDir = "uploads/materials";

    public StudyMaterial uploadMaterial(String userId, MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file uploaded");
        }

        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String filename = userId + "-" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir, filename);
        Files.copy(file.getInputStream(), filePath);

        StudyMaterial material = new StudyMaterial();
        material.setUser(userId);
        material.setFileName(file.getOriginalFilename());
        material.setFileUrl(filePath.toString());
        material.setStatus("processing");

        StudyMaterial.StudyMaterialMetadata metadata = new StudyMaterial.StudyMaterialMetadata();
        metadata.setTitle(file.getOriginalFilename());
        metadata.setFileSize(file.getSize());
        material.setMetadata(metadata);

        return studyMaterialRepository.save(material);
    }

    public List<StudyMaterial> getUserMaterials(String userId) {
        return studyMaterialRepository.findAll().stream()
                .filter(m -> userId.equals(m.getUser()))
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .toList();
    }

    public void deleteMaterial(String userId, String id) throws Exception {
        Optional<StudyMaterial> materialOpt = studyMaterialRepository.findById(id);
        if (materialOpt.isEmpty()) {
            throw new IllegalArgumentException("Material not found");
        }

        StudyMaterial material = materialOpt.get();
        if (!userId.equals(material.getUser())) {
            throw new IllegalAccessException("Not authorized");
        }

        if (material.getFileUrl() != null) {
            File file = new File(material.getFileUrl());
            if (file.exists()) {
                file.delete();
            }
        }

        studyMaterialRepository.deleteById(id);
    }
}
