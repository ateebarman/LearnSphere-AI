package com.learnsphere.service.ai;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsphere.model.Roadmap;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiService {

    @Value("${GEMINI_API_KEY:${GEMINI_API_KEY1:}}")
    private String geminiApiKey;

    private ChatLanguageModel chatModel;
    private final ObjectMapper objectMapper;

    public AiService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    @PostConstruct
    public void init() {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            System.err.println("⚠️ GEMINI_API_KEY not found in environment. AI operations will fail.");
            return;
        }

        try {
            this.chatModel = GoogleAiGeminiChatModel.builder()
                    .apiKey(geminiApiKey)
                    .modelName("gemini-1.5-flash")
                    .temperature(0.7)
                    .build();
        } catch (Exception e) {
            System.err.println("⚠️ Failed to initialize Gemini Chat Model: " + e.getMessage());
        }
    }

    public Roadmap generateRoadmapFromAI(String topic) {
        String prompt = String.format(
            "You are a World-Class Educational Architect.\n" +
            "Generate a MASTERCLASS roadmap for: \"%s\".\n\n" +
            "CURRICULUM RULES:\n" +
            "1. STRUCTURE: 8 strictly progressive modules.\n" +
            "2. RICH DETAIL:\n" +
            "   - \"description\": 3-4 professional sentences focusing on technical depth.\n" +
            "   - \"objectives\": 4-5 high-level technical outcomes.\n" +
            "   - \"keyConcepts\": 5-6 granular technical terms.\n" +
            "3. REAL RESOURCES:\n" +
            "   - Provide URLs to official documentation or top learning sites.\n\n" +
            "JSON STRUCTURE:\n" +
            "{\n" +
            "  \"title\": \"Mastering %s\",\n" +
            "  \"description\": \"Comprehensive summary.\",\n" +
            "  \"difficulty\": \"Intermediate\",\n" +
            "  \"totalDuration\": \"8 Weeks\",\n" +
            "  \"modules\": [\n" +
            "    {\n" +
            "      \"title\": \"string\",\n" +
            "      \"description\": \"string\",\n" +
            "      \"objectives\": [\"string\"],\n" +
            "      \"keyConcepts\": [\"string\"],\n" +
            "      \"estimatedTime\": \"1 Week\",\n" +
            "      \"suggestedResources\": [\n" +
            "         { \"title\": \"Official Doc\", \"url\": \"https://...\", \"type\": \"doc\" }\n" +
            "      ]\n" +
            "    }\n" +
            "  ]\n" +
            "}\n" +
            "Respond ONLY with valid JSON.", topic, topic
        );

        String jsonResponse = generateJson(prompt);
        try {
            return objectMapper.readValue(jsonResponse, Roadmap.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse AI Roadmap JSON: " + e.getMessage(), e);
        }
    }

    public Roadmap generateRoadmapFromRAG(String topic, String context) {
        String prompt = String.format(
            "You are an elite educational architect specializing in Curriculum Extracting.\n" +
            "Below are excerpts from a user's study material regarding \"%s\".\n\n" +
            "CONTEXT FROM STUDY MATERIAL:\n" +
            "\"\"\"\n%s\n\"\"\"\n\n" +
            "TASK:\n" +
            "Generate a MASTERCLASS roadmap based on this SPECIFIC context.\n\n" +
            "CURRICULUM RULES:\n" +
            "1. STRUCTURE: 7-10 progressive modules based exclusively on the context.\n" +
            "2. RICH DETAIL:\n" +
            "   - \"description\": 3-4 detailed sentences explaining the core concepts found in the text.\n" +
            "   - \"objectives\": 4-5 outcomes extracted from the context.\n" +
            "   - \"keyConcepts\": 5-6 terms found in the context.\n\n" +
            "JSON STRUCTURE:\n" +
            "{\n" +
            "  \"title\": \"string\",\n" +
            "  \"description\": \"string\",\n" +
            "  \"difficulty\": \"Intermediate\",\n" +
            "  \"totalDuration\": \"4 Weeks\",\n" +
            "  \"modules\": [\n" +
            "    {\n" +
            "      \"title\": \"string\",\n" +
            "      \"description\": \"string\",\n" +
            "      \"objectives\": [\"string\"],\n" +
            "      \"keyConcepts\": [\"string\"],\n" +
            "      \"estimatedTime\": \"1 Week\",\n" +
            "      \"suggestedResources\": []\n" +
            "    }\n" +
            "  ]\n" +
            "}\n" +
            "Respond ONLY with JSON.", topic, context
        );

        String jsonResponse = generateJson(prompt);
        try {
            return objectMapper.readValue(jsonResponse, Roadmap.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse RAG AI Roadmap JSON: " + e.getMessage(), e);
        }
    }

    public String generateText(String prompt) {
        if (chatModel == null) {
            throw new RuntimeException("Chat model is not initialized. Ensure GEMINI_API_KEY is set.");
        }
        return chatModel.generate(prompt);
    }

    public String generateJson(String prompt) {
        if (chatModel == null) {
            throw new RuntimeException("Chat model is not initialized. Ensure GEMINI_API_KEY is set.");
        }

        String response = chatModel.generate(prompt);
        return extractJsonFromMarkdown(response);
    }

    private String extractJsonFromMarkdown(String text) {
        if (text == null) return "{}";
        
        Matcher matcher = Pattern.compile("```(?:json)?\\s*(.*?)\\s*```", Pattern.DOTALL).matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        // If no markdown blocks, find first { and last }
        int startIndex = text.indexOf('{');
        int endIndex = text.lastIndexOf('}');
        if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
            return text.substring(startIndex, endIndex + 1);
        }
        
        return text;
    }
}
