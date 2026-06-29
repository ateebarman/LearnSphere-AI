package com.learnsphere.service;

import com.learnsphere.model.CodingQuestion;
import com.learnsphere.model.KnowledgeNode;
import com.learnsphere.model.Roadmap;
import com.learnsphere.repository.*;
import com.learnsphere.service.ai.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CodingQuestionRepository codingQuestionRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private KnowledgeNodeRepository knowledgeNodeRepository;

    @Autowired
    private RoadmapRepository roadmapRepository;

    @Autowired
    private AiService aiService;

    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalProblems", codingQuestionRepository.count());
        stats.put("totalSubmissions", submissionRepository.count());
        stats.put("totalKnowledge", knowledgeNodeRepository.count());
        stats.put("totalRoadmaps", roadmapRepository.count());
        return stats;
    }

    public Map<String, Object> getAdminProblems(int page, int limit) {
        long total = codingQuestionRepository.count();
        List<CodingQuestion> problems = codingQuestionRepository.findAll(PageRequest.of(page - 1, limit)).getContent();
        Map<String, Object> response = new HashMap<>();
        response.put("problems", problems);
        response.put("page", page);
        response.put("pages", (int) Math.ceil((double) total / limit));
        response.put("total", total);
        return response;
    }

    public CodingQuestion createProblem(CodingQuestion problem) {
        if (problem.getSlug() == null || problem.getSlug().isEmpty()) {
            problem.setSlug(problem.getTitle().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", ""));
        }
        problem.setValidated(true);
        return codingQuestionRepository.save(problem);
    }

    public void deleteProblem(String id) {
        codingQuestionRepository.deleteById(id);
    }

    public Map<String, Object> getAdminKnowledge(int page, int limit) {
        long total = knowledgeNodeRepository.count();
        List<KnowledgeNode> nodes = knowledgeNodeRepository.findAll(PageRequest.of(page - 1, limit)).getContent();
        Map<String, Object> response = new HashMap<>();
        response.put("nodes", nodes);
        response.put("page", page);
        response.put("pages", (int) Math.ceil((double) total / limit));
        response.put("total", total);
        return response;
    }

    public KnowledgeNode createKnowledge(KnowledgeNode node) {
        return knowledgeNodeRepository.save(node);
    }

    public void deleteKnowledge(String id) {
        knowledgeNodeRepository.deleteById(id);
    }

    public Map<String, Object> getAdminRoadmaps(int page, int limit) {
        long total = roadmapRepository.count();
        List<Roadmap> roadmaps = roadmapRepository.findAll(PageRequest.of(page - 1, limit)).getContent();
        Map<String, Object> response = new HashMap<>();
        response.put("roadmaps", roadmaps);
        response.put("page", page);
        response.put("pages", (int) Math.ceil((double) total / limit));
        response.put("total", total);
        return response;
    }

    public Roadmap createRoadmap(String userId, Roadmap roadmap) {
        roadmap.setUser(userId);
        roadmap.setIsPublic(true);
        return roadmapRepository.save(roadmap);
    }

    public Roadmap updateRoadmap(String id, Roadmap update) {
        Optional<Roadmap> existingOpt = roadmapRepository.findById(id);
        if (existingOpt.isEmpty()) {
            throw new IllegalArgumentException("Roadmap not found");
        }
        Roadmap existing = existingOpt.get();
        if (update.getTitle() != null) existing.setTitle(update.getTitle());
        if (update.getDescription() != null) existing.setDescription(update.getDescription());
        if (update.getDifficulty() != null) existing.setDifficulty(update.getDifficulty());
        if (update.getModules() != null) existing.setModules(update.getModules());
        return roadmapRepository.save(existing);
    }

    public void deleteRoadmap(String id) {
        roadmapRepository.deleteById(id);
    }
}
