package com.learnsphere.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsphere.model.User;
import com.learnsphere.repository.UserRepository;
import com.learnsphere.service.ai.AiService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;

@Service
public class ResumeService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AiService aiService;

    private final ObjectMapper objectMapper;

    public ResumeService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public Map<String, Object> processAndSaveResume(String userId, MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file uploaded");
        }

        String resumeText;
        try (InputStream inputStream = file.getInputStream();
             PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            resumeText = stripper.getText(document);
        } catch (Exception e) {
            throw new RuntimeException("Could not extract text from PDF file: " + e.getMessage(), e);
        }

        if (resumeText == null || resumeText.trim().length() < 50) {
            throw new IllegalArgumentException("Could not extract text. Ensure PDF is not image-only.");
        }

        String prompt = String.format(
            "Parse this resume and return structured JSON. Extract EVERYTHING.\n\n" +
            "Resume text:\n%s\n\n" +
            "Return ONLY valid JSON:\n" +
            "{\n" +
            "  \"name\": \"Full name\",\n" +
            "  \"email\": \"email if present\",\n" +
            "  \"summary\": \"professional summary\",\n" +
            "  \"skills\": [\"skill1\", \"skill2\"],\n" +
            "  \"experience\": [{\"company\": \"...\", \"role\": \"...\", \"duration\": \"...\", \"description\": \"...\", \"technologies\": []}],\n" +
            "  \"projects\": [{\"name\": \"...\", \"description\": \"...\", \"technologies\": [], \"highlights\": []}],\n" +
            "  \"education\": [{\"institution\": \"...\", \"degree\": \"...\", \"field\": \"...\", \"year\": \"...\"}],\n" +
            "  \"achievements\": [\"achievement1\"]\n" +
            "}", resumeText.length() > 4000 ? resumeText.substring(0, 4000) : resumeText
        );

        String json = aiService.generateJson(prompt);
        Object resumeData = objectMapper.readValue(json, Object.class);

        List<String> skills = new ArrayList<>();
        if (resumeData instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) resumeData;
            if (map.containsKey("skills") && map.get("skills") instanceof List) {
                for (Object item : (List<?>) map.get("skills")) {
                    skills.add(String.valueOf(item));
                }
            }
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getProfile() == null) {
                user.setProfile(new User.UserProfile());
            }
            user.getProfile().setResumeText(resumeText);
            user.getProfile().setResumeData(resumeData);
            user.getProfile().setSkills(skills);
            userRepository.save(user);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("resumeData", resumeData);
        response.put("preview", resumeText.length() > 300 ? resumeText.substring(0, 300) + "..." : resumeText);
        return response;
    }

    public Map<String, Object> getResumeData(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        Map<String, Object> response = new HashMap<>();
        if (userOpt.isPresent() && userOpt.get().getProfile() != null) {
            User.UserProfile profile = userOpt.get().getProfile();
            response.put("success", true);
            response.put("resumeData", profile.getResumeData());
            response.put("skills", profile.getSkills() != null ? profile.getSkills() : Collections.emptyList());
        } else {
            response.put("success", true);
            response.put("resumeData", null);
            response.put("skills", Collections.emptyList());
        }
        return response;
    }
}
