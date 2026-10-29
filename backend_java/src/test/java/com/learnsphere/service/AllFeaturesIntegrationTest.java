package com.learnsphere.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsphere.model.Roadmap;
import com.learnsphere.model.User;
import com.learnsphere.repository.RoadmapRepository;
import com.learnsphere.repository.UserRepository;
import com.learnsphere.service.ai.AiService;
import io.github.cdimascio.dotenv.Dotenv;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AllFeaturesIntegrationTest {

    @BeforeAll
    static void setupEnv() {
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(entry -> {
                if (System.getProperty(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });
        } catch (Exception ignored) {}
    }

    @Autowired
    private RoadmapService roadmapService;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private RoadmapRepository roadmapRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AiService aiService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testPublicRoadmapsFetchAndSerialization() throws Exception {
        System.out.println("--- 1. Testing Public / Community Roadmaps ---");
        List<Roadmap> publicList = roadmapService.getPublicRoadmaps();
        assertNotNull(publicList, "Public roadmaps list should not be null");
        assertFalse(publicList.isEmpty(), "Should have public roadmaps available");
        System.out.println("✅ Found " + publicList.size() + " public roadmaps.");

        Roadmap first = publicList.get(0);
        assertNotNull(first.getId(), "Roadmap ID must not be null");
        System.out.println("Sample Public Roadmap: title='" + first.getTitle() + "', id=" + first.getId());

        // Verify JSON serialization includes BOTH _id and id
        String json = objectMapper.writeValueAsString(first);
        assertTrue(json.contains("\"_id\":\"" + first.getId() + "\""), "JSON must contain _id field matching ID");
        assertTrue(json.contains("\"id\":\"" + first.getId() + "\""), "JSON must contain id field matching ID");
        System.out.println("✅ Dual _id and id verification passed in JSON output.");
    }

    @Test
    void testGetRoadmapById() {
        System.out.println("--- 2. Testing Get Roadmap by ID ---");
        List<Roadmap> publicList = roadmapService.getPublicRoadmaps();
        if (!publicList.isEmpty()) {
            String sampleId = publicList.get(0).getId();
            Roadmap found = roadmapService.getRoadmapById(sampleId, null);
            assertNotNull(found, "Roadmap should be found by ID");
            assertEquals(sampleId, found.getId());
            System.out.println("✅ Successfully fetched roadmap by ID: " + found.getTitle());
        }
    }

    @Test
    void testUserRoadmapsAndAnalytics() {
        System.out.println("--- 3. Testing User Roadmaps & Analytics ---");
        List<User> users = userRepository.findAll();
        if (!users.isEmpty()) {
            User sampleUser = users.get(0);
            String userId = sampleUser.getId();
            System.out.println("Testing with User: " + sampleUser.getName() + " (ID: " + userId + ")");

            List<Roadmap> userRoadmaps = roadmapService.getUserRoadmaps(userId);
            System.out.println("✅ User has " + userRoadmaps.size() + " roadmaps.");

            Map<String, Object> analytics = analyticsService.getAnalytics(userId);
            assertNotNull(analytics, "Analytics overview should not be null");
            System.out.println("✅ Analytics Overview: " + analytics);

            List<Map<String, Object>> roadmapStats = analyticsService.getRoadmapStats(userId);
            assertNotNull(roadmapStats, "Roadmap stats should not be null");
            System.out.println("✅ User Roadmap Stats count: " + roadmapStats.size());

            List<Map<String, Object>> quizStats = analyticsService.getQuizStats(userId);
            assertNotNull(quizStats, "Quiz stats should not be null");
            System.out.println("✅ User Quiz Stats count: " + quizStats.size());
        }
    }
}
