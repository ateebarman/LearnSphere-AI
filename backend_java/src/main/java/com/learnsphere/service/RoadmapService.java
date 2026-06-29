package com.learnsphere.service;

import com.learnsphere.model.CodingQuestion;
import com.learnsphere.model.KnowledgeNode;
import com.learnsphere.model.Roadmap;
import com.learnsphere.repository.CodingQuestionRepository;
import com.learnsphere.repository.KnowledgeNodeRepository;
import com.learnsphere.repository.RoadmapRepository;
import com.learnsphere.service.ai.AiService;
import com.learnsphere.service.ai.RagService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoadmapService {

    private final RoadmapRepository roadmapRepository;
    private final KnowledgeNodeRepository knowledgeNodeRepository;
    private final CodingQuestionRepository codingQuestionRepository;
    private final AiService aiService;
    private final RagService ragService;
    private final YouTubeService youtubeService;
    private final ResourceDatabase resourceDatabase;

    public RoadmapService(RoadmapRepository roadmapRepository,
                          KnowledgeNodeRepository knowledgeNodeRepository,
                          CodingQuestionRepository codingQuestionRepository,
                          AiService aiService,
                          RagService ragService,
                          YouTubeService youtubeService,
                          ResourceDatabase resourceDatabase) {
        this.roadmapRepository = roadmapRepository;
        this.knowledgeNodeRepository = knowledgeNodeRepository;
        this.codingQuestionRepository = codingQuestionRepository;
        this.aiService = aiService;
        this.ragService = ragService;
        this.youtubeService = youtubeService;
        this.resourceDatabase = resourceDatabase;
    }

    public Roadmap getRoadmapPreview(String topic, String difficulty, String targetRole) {
        // Simple generation via AI
        Roadmap roadmap = aiService.generateRoadmapFromAI(topic);
        if (difficulty != null && !difficulty.isEmpty()) roadmap.setDifficulty(difficulty);
        enrichModules(roadmap);
        return roadmap;
    }

    @CacheEvict(value = "roadmaps:public:list", allEntries = true)
    public Roadmap createRoadmap(Roadmap roadmap, String userId) {
        roadmap.setUser(userId);
        
        if (roadmap.getModules() != null) {
            for (int i = 0; i < roadmap.getModules().size(); i++) {
                roadmap.getModules().get(i).setOrder(i);
                if (roadmap.getModules().get(i).getQuizConfig() == null) {
                    roadmap.getModules().get(i).setQuizConfig(new Roadmap.QuizConfig(true, roadmap.getModules().get(i).getTitle(), 5));
                }
            }
        }
        
        return roadmapRepository.save(roadmap);
    }

    @CacheEvict(value = "roadmaps:public:list", allEntries = true)
    public Roadmap generateRoadmap(String topic, String userId) {
        Roadmap aiRoadmap = aiService.generateRoadmapFromAI(topic);
        enrichModules(aiRoadmap);
        
        aiRoadmap.setUser(userId);
        aiRoadmap.setTopic(topic);
        return roadmapRepository.save(aiRoadmap);
    }

    @CacheEvict(value = "roadmaps:public:list", allEntries = true)
    public Roadmap generateRAGRoadmap(String topic, String materialId, String userId) {
        String context = ragService.getRelevantContext(topic, userId, materialId);
        
        if (context == null || context.isEmpty()) {
            throw new RuntimeException("Could not find relevant context in your study material. Try a different topic or ensure the PDF content is searchable.");
        }

        Roadmap aiRoadmap = aiService.generateRoadmapFromRAG(topic, context);
        enrichModules(aiRoadmap);

        aiRoadmap.setUser(userId);
        aiRoadmap.setTopic(topic);
        aiRoadmap.setSourceMaterial(materialId);
        return roadmapRepository.save(aiRoadmap);
    }

    public List<Roadmap> getUserRoadmaps(String userId) {
        return roadmapRepository.findByUserOrderByCreatedAtDesc(userId);
    }

    @Cacheable(value = "roadmap:detail", key = "#roadmapId")
    public Roadmap getRoadmapById(String roadmapId, String userId) {
        Roadmap roadmap = roadmapRepository.findById(roadmapId)
                .orElseThrow(() -> new RuntimeException("Roadmap not found"));

        boolean isOwner = roadmap.getUser().equals(userId);
        if (!isOwner && !roadmap.getIsPublic()) {
            throw new RuntimeException("Not authorized to view this roadmap");
        }
        
        return roadmap;
    }

    @Cacheable(value = "roadmaps:public:list")
    public List<Roadmap> getPublicRoadmaps() {
        return roadmapRepository.findByIsPublicTrueOrderByCreatedAtDesc();
    }

    @CacheEvict(value = {"roadmaps:public:list", "roadmap:detail"}, allEntries = true)
    public Roadmap toggleRoadmapVisibility(String roadmapId, String userId) {
        Roadmap roadmap = roadmapRepository.findById(roadmapId)
                .orElseThrow(() -> new RuntimeException("Roadmap not found"));

        if (!roadmap.getUser().equals(userId)) {
            throw new RuntimeException("Not authorized to modify this roadmap");
        }

        roadmap.setIsPublic(!roadmap.getIsPublic());
        return roadmapRepository.save(roadmap);
    }

    @CacheEvict(value = {"roadmaps:public:list", "roadmap:detail"}, allEntries = true)
    public void deleteRoadmap(String roadmapId, String userId) {
        Roadmap roadmap = roadmapRepository.findById(roadmapId)
                .orElseThrow(() -> new RuntimeException("Roadmap not found"));

        if (!roadmap.getUser().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this roadmap");
        }

        roadmapRepository.delete(roadmap);
    }

    private void enrichModules(Roadmap roadmap) {
        if (roadmap.getModules() == null) return;

        for (Roadmap.RoadmapModule module : roadmap.getModules()) {
            // 1. YouTube Videos
            List<Roadmap.RoadmapResource> videos = youtubeService.searchYouTubeVideos(module.getTitle() + " tutorial developer", 2);
            
            // 2. Static trusted resources
            List<Roadmap.RoadmapResource> staticResources = resourceDatabase.getResourcesForTopic(module.getTitle());
            if (staticResources.size() > 2) staticResources = staticResources.subList(0, 2);

            // 3. Internal Knowledge Base
            List<String> keywords = module.getKeyConcepts() != null ? module.getKeyConcepts().stream().map(String::toLowerCase).collect(Collectors.toList()) : new ArrayList<>();
            List<KnowledgeNode> internalDocs = knowledgeNodeRepository.findRelevantNodes(module.getTitle(), keywords);
            if (internalDocs.size() > 2) internalDocs = internalDocs.subList(0, 2);

            List<Roadmap.RoadmapResource> learningResources = new ArrayList<>();
            learningResources.addAll(videos);
            learningResources.addAll(staticResources);
            
            for (KnowledgeNode doc : internalDocs) {
                Roadmap.RoadmapResource r = new Roadmap.RoadmapResource();
                r.setTitle("Internal: " + doc.getTopic());
                r.setUrl("/knowledge/" + doc.getSlug());
                r.setType("doc");
                r.setSource("internal");
                learningResources.add(r);
            }

            if (module.getLearningResources() != null) {
                learningResources.addAll(module.getLearningResources());
            }
            
            module.setLearningResources(learningResources.subList(0, Math.min(learningResources.size(), 6)));

            // 4. Internal Practice Problems
            List<CodingQuestion> internalProblems = codingQuestionRepository.findRelevantProblems(module.getTitle(), keywords);
            if (internalProblems.size() > 2) internalProblems = internalProblems.subList(0, 2);

            List<Roadmap.PracticeProblem> practiceProblems = new ArrayList<>();
            for (CodingQuestion q : internalProblems) {
                Roadmap.PracticeProblem p = new Roadmap.PracticeProblem();
                p.setTitle("Internal: " + q.getTitle());
                p.setUrl("/problems/" + q.getSlug());
                p.setDifficulty(q.getDifficulty());
                p.setSource("internal");
                practiceProblems.add(p);
            }

            if (module.getPracticeProblems() != null) {
                practiceProblems.addAll(module.getPracticeProblems());
            }
            module.setPracticeProblems(practiceProblems.subList(0, Math.min(practiceProblems.size(), 4)));
        }
    }
}
