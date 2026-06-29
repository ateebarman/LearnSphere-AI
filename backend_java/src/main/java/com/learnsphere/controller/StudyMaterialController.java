package com.learnsphere.controller;

import com.learnsphere.model.StudyMaterial;
import com.learnsphere.service.StudyMaterialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/study-materials")
public class StudyMaterialController {

    @Autowired
    private StudyMaterialService studyMaterialService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadMaterial(Authentication authentication, @RequestParam("pdf") MultipartFile file) {
        try {
            String userId = authentication.getName();
            StudyMaterial material = studyMaterialService.uploadMaterial(userId, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(material);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserMaterials(Authentication authentication) {
        try {
            String userId = authentication.getName();
            List<StudyMaterial> materials = studyMaterialService.getUserMaterials(userId);
            return ResponseEntity.ok(materials);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMaterial(Authentication authentication, @PathVariable String id) {
        try {
            String userId = authentication.getName();
            studyMaterialService.deleteMaterial(userId, id);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Material removed");
            return ResponseEntity.ok(response);
        } catch (IllegalAccessException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
