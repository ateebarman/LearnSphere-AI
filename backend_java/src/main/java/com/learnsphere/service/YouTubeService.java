package com.learnsphere.service;

import com.learnsphere.model.Roadmap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class YouTubeService {

    @Value("${YOUTUBE_API_KEY:}")
    private String youtubeApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public List<Roadmap.RoadmapResource> searchYouTubeVideos(String topic, int maxResults) {
        if (youtubeApiKey == null || youtubeApiKey.trim().isEmpty()) {
            System.err.println("⚠️ YOUTUBE_API_KEY not found in environment");
            return new ArrayList<>();
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl("https://www.googleapis.com/youtube/v3/search")
                    .queryParam("part", "snippet")
                    .queryParam("q", topic)
                    .queryParam("maxResults", maxResults)
                    .queryParam("key", youtubeApiKey)
                    .queryParam("type", "video")
                    .queryParam("relevanceLanguage", "en")
                    .queryParam("order", "relevance")
                    .toUriString();

            Map response = restTemplate.getForObject(url, Map.class);

            List<Roadmap.RoadmapResource> resources = new ArrayList<>();

            if (response != null && response.containsKey("items")) {
                List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
                
                for (Map<String, Object> item : items) {
                    Map<String, Object> idMap = (Map<String, Object>) item.get("id");
                    Map<String, Object> snippetMap = (Map<String, Object>) item.get("snippet");
                    
                    if (idMap != null && snippetMap != null) {
                        String videoId = (String) idMap.get("videoId");
                        String title = (String) snippetMap.get("title");
                        String description = (String) snippetMap.get("description");
                        
                        String thumbnailUrl = null;
                        Map<String, Object> thumbnails = (Map<String, Object>) snippetMap.get("thumbnails");
                        if (thumbnails != null) {
                            Map<String, Object> medium = (Map<String, Object>) thumbnails.get("medium");
                            if (medium != null) {
                                thumbnailUrl = (String) medium.get("url");
                            }
                        }

                        Roadmap.RoadmapResource resource = new Roadmap.RoadmapResource();
                        resource.setTitle(title);
                        resource.setUrl("https://www.youtube.com/watch?v=" + videoId);
                        resource.setDescription(description);
                        resource.setType("video");
                        resource.setThumbnail(thumbnailUrl);
                        resource.setSource("external");
                        
                        resources.add(resource);
                    }
                }
            }

            return resources;
        } catch (HttpClientErrorException e) {
            String errorMsg = e.getMessage();
            if (errorMsg != null && (errorMsg.toLowerCase().contains("quota") || e.getStatusCode().value() == 403)) {
                System.err.println("⚠️ YouTube API Quota Exceeded. Returning empty results.");
            } else {
                System.err.println("❌ YouTube Search Error: " + errorMsg);
            }
            return new ArrayList<>();
        } catch (Exception e) {
            System.err.println("❌ YouTube Search Error: " + e.getMessage());
            return new ArrayList<>();
        }
    }
}
