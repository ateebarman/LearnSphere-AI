package com.learnsphere.service;

import com.learnsphere.model.CodingQuestion;
import com.learnsphere.model.KnowledgeNode;
import com.learnsphere.model.Roadmap;
import com.learnsphere.repository.CodingQuestionRepository;
import com.learnsphere.repository.KnowledgeNodeRepository;
import com.learnsphere.repository.RoadmapRepository;
import com.learnsphere.service.ai.AiService;
import com.learnsphere.service.ai.RagService;
import org.bson.types.ObjectId;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
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
    private final MongoTemplate mongoTemplate;

    public RoadmapService(RoadmapRepository roadmapRepository,
                          KnowledgeNodeRepository knowledgeNodeRepository,
                          CodingQuestionRepository codingQuestionRepository,
                          AiService aiService,
                          RagService ragService,
                          YouTubeService youtubeService,
                          ResourceDatabase resourceDatabase,
                          MongoTemplate mongoTemplate) {
        this.roadmapRepository = roadmapRepository;
        this.knowledgeNodeRepository = knowledgeNodeRepository;
        this.codingQuestionRepository = codingQuestionRepository;
        this.aiService = aiService;
        this.ragService = ragService;
        this.youtubeService = youtubeService;
        this.resourceDatabase = resourceDatabase;
        this.mongoTemplate = mongoTemplate;
    }

    public Roadmap getRoadmapPreview(String topic, String difficulty, String targetRole) {
        Roadmap roadmap = aiService.generateRoadmapFromAI(topic);
        if (difficulty != null && !difficulty.isEmpty()) roadmap.setDifficulty(difficulty);
        enrichModules(roadmap);
        return roadmap;
    }

    @CacheEvict(value = "roadmaps:public:list", allEntries = true)
    public Roadmap createRoadmap(Roadmap roadmap, String userId) {
        roadmap.setUser(userId);
        if (roadmap.getProgress() == null) {
            roadmap.setProgress(0.0);
        }
        if (roadmap.getIsPublic() == null) {
            roadmap.setIsPublic(false);
        }
        
        if (roadmap.getModules() != null) {
            for (int i = 0; i < roadmap.getModules().size(); i++) {
                Roadmap.RoadmapModule m = roadmap.getModules().get(i);
                m.setOrder(i);
                if (m.getQuizConfig() == null) {
                    m.setQuizConfig(new Roadmap.QuizConfig(true, m.getTitle(), 5));
                }
                if (m.getEffortEstimate() == null) {
                    m.setEffortEstimate(new Roadmap.EffortEstimate(30, 45, 15));
                }
                if (m.getUnlockCriteria() == null) {
                    m.setUnlockCriteria(new Roadmap.UnlockCriteria(0.0, 0.0, 0));
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
        if (aiRoadmap.getProgress() == null) {
            aiRoadmap.setProgress(0.0);
        }
        if (aiRoadmap.getIsPublic() == null) {
            aiRoadmap.setIsPublic(false);
        }
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
        if (aiRoadmap.getProgress() == null) {
            aiRoadmap.setProgress(0.0);
        }
        if (aiRoadmap.getIsPublic() == null) {
            aiRoadmap.setIsPublic(false);
        }
        return roadmapRepository.save(aiRoadmap);
    }

    public List<Roadmap> getUserRoadmaps(String userId) {
        if (userId == null || userId.isBlank()) return List.of();

        Criteria criteria;
        if (ObjectId.isValid(userId)) {
            criteria = new Criteria().orOperator(
                    Criteria.where("user").is(userId),
                    Criteria.where("user").is(new ObjectId(userId))
            );
        } else {
            criteria = Criteria.where("user").is(userId);
        }

        Query query = new Query(criteria).with(Sort.by(Sort.Direction.DESC, "createdAt"));
        return mongoTemplate.find(query, Roadmap.class);
    }

    @Cacheable(value = "roadmap:detail", key = "#roadmapId")
    public Roadmap getRoadmapById(String roadmapId, String userId) {
        if (roadmapId == null || roadmapId.isBlank() || "undefined".equalsIgnoreCase(roadmapId)) {
            throw new IllegalArgumentException("Invalid roadmap ID");
        }

        Roadmap roadmap = roadmapRepository.findById(roadmapId)
                .orElseThrow(() -> new RuntimeException("Roadmap not found"));

        boolean isOwner = userId != null && userId.equals(roadmap.getUser());
        boolean isPublic = Boolean.TRUE.equals(roadmap.getIsPublic());
        if (!isOwner && !isPublic) {
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

        boolean current = Boolean.TRUE.equals(roadmap.getIsPublic());
        roadmap.setIsPublic(!current);
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
