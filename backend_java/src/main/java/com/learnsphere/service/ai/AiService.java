package com.learnsphere.service.ai;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.json.JsonReadFeature;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsphere.model.Roadmap;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiService {

    @Value("${app.ai.provider:hybrid}")
    private String aiProvider;

    @Value("${groq.base-url:https://api.groq.com/openai/v1}")
    private String groqBaseUrl;

    @Value("${GROQ_API_KEY1:${GROQ_API_KEY:}}")
    private String groqApiKey;

    @Value("${groq.model:openai/gpt-oss-120b}")
    private String groqModel;

    @Value("${GEMINI_API_KEY:${GEMINI_API_KEY1:}}")
    private String geminiApiKey;

    private ChatLanguageModel groqPrimaryModel;
    private ChatLanguageModel groqFallbackModel;
    private ChatLanguageModel geminiModel;
    private final ObjectMapper objectMapper;

    public AiService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        this.objectMapper.configure(JsonReadFeature.ALLOW_TRAILING_COMMA.mappedFeature(), true);
        this.objectMapper.configure(JsonParser.Feature.ALLOW_COMMENTS, true);
        this.objectMapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);
        this.objectMapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true);
    }

    @PostConstruct
    public void init() {
        String targetModel = (groqModel != null && !groqModel.isBlank() && !groqModel.toLowerCase().contains("llama") && !groqModel.toLowerCase().contains("mixtral"))
                ? groqModel.trim()
                : "openai/gpt-oss-120b";

        if (groqApiKey != null && !groqApiKey.trim().isEmpty()) {
            try {
                this.groqPrimaryModel = OpenAiChatModel.builder()
                        .baseUrl(groqBaseUrl)
                        .apiKey(groqApiKey.trim())
                        .modelName(targetModel)
                        .temperature(0.7)
                        .maxTokens(4000)
                        .timeout(Duration.ofSeconds(60))
                        .build();
                System.out.println("✅ AiService Groq Primary Model initialized: " + targetModel);
            } catch (Exception e) {
                System.err.println("⚠️ Failed to initialize Groq Primary Model: " + e.getMessage());
            }

            try {
                this.groqFallbackModel = OpenAiChatModel.builder()
                        .baseUrl(groqBaseUrl)
                        .apiKey(groqApiKey.trim())
                        .modelName("openai/gpt-oss-20b")
                        .temperature(0.7)
                        .maxTokens(4000)
                        .timeout(Duration.ofSeconds(45))
                        .build();
                System.out.println("✅ AiService Groq Fallback Model initialized: openai/gpt-oss-20b");
            } catch (Exception e) {
                System.err.println("⚠️ Failed to initialize Groq Fallback Model: " + e.getMessage());
            }
        }

        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            try {
                this.geminiModel = GoogleAiGeminiChatModel.builder()
                        .apiKey(geminiApiKey.trim())
                        .modelName("gemini-1.5-flash")
                        .temperature(0.7)
                        .build();
                System.out.println("✅ AiService Gemini Model initialized: gemini-1.5-flash");
            } catch (Exception e) {
                System.err.println("⚠️ Failed to initialize Gemini Chat Model: " + e.getMessage());
            }
        }
    }

    public Roadmap generateRoadmapFromAI(String topic) {
        String prompt = String.format(
            "You are a World-Class Educational Architect.\n" +
            "Generate a structured learning roadmap for: \"%s\".\n\n" +
            "CURRICULUM RULES:\n" +
            "1. STRUCTURE: 6-8 progressive modules.\n" +
            "2. RICH DETAIL:\n" +
            "   - \"description\": 2-3 professional sentences focusing on practical depth.\n" +
            "   - \"objectives\": 3-4 concrete learning outcomes.\n" +
            "   - \"keyConcepts\": 4-5 granular technical terms.\n" +
            "3. REAL RESOURCES:\n" +
            "   - Provide URLs to official documentation or top learning sites.\n\n" +
            "JSON STRUCTURE:\n" +
            "{\n" +
            "  \"title\": \"Mastering %s\",\n" +
            "  \"description\": \"Comprehensive summary of the learning path.\",\n" +
            "  \"difficulty\": \"Intermediate\",\n" +
            "  \"totalDuration\": \"6 Weeks\",\n" +
            "  \"modules\": [\n" +
            "    {\n" +
            "      \"title\": \"string\",\n" +
            "      \"description\": \"string\",\n" +
            "      \"objectives\": [\"string\"],\n" +
            "      \"keyConcepts\": [\"string\"],\n" +
            "      \"estimatedTime\": \"1 Week\",\n" +
            "      \"learningResources\": [\n" +
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
            System.err.println("⚠️ First JSON parse failed: " + e.getMessage() + ". Attempting sanitization...");
            try {
                String sanitized = jsonResponse.replaceAll(",\\s*([}\\]])", "$1");
                return objectMapper.readValue(sanitized, Roadmap.class);
            } catch (Exception ex) {
                throw new RuntimeException("Failed to parse AI Roadmap JSON: " + e.getMessage() + " | Raw: " + jsonResponse, e);
            }
        }
    }

    public Roadmap generateRoadmapFromRAG(String topic, String context) {
        String prompt = String.format(
            "You are an elite educational architect specializing in Curriculum Extracting.\n" +
            "Below are excerpts from a user's study material regarding \"%s\".\n\n" +
            "CONTEXT FROM STUDY MATERIAL:\n" +
            "\"\"\"\n%s\n\"\"\"\n\n" +
            "TASK:\n" +
            "Generate a structured roadmap based on this SPECIFIC context.\n\n" +
            "CURRICULUM RULES:\n" +
            "1. STRUCTURE: 5-8 progressive modules based on the context.\n" +
            "2. RICH DETAIL:\n" +
            "   - \"description\": 2-3 detailed sentences explaining the core concepts found in the text.\n" +
            "   - \"objectives\": 3-4 outcomes extracted from the context.\n" +
            "   - \"keyConcepts\": 4-5 terms found in the context.\n\n" +
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
            "      \"learningResources\": []\n" +
            "    }\n" +
            "  ]\n" +
            "}\n" +
            "Respond ONLY with valid JSON.", topic, context
        );

        String jsonResponse = generateJson(prompt);
        try {
            return objectMapper.readValue(jsonResponse, Roadmap.class);
        } catch (Exception e) {
            System.err.println("⚠️ First RAG JSON parse failed: " + e.getMessage() + ". Attempting sanitization...");
            try {
                String sanitized = jsonResponse.replaceAll(",\\s*([}\\]])", "$1");
                return objectMapper.readValue(sanitized, Roadmap.class);
            } catch (Exception ex) {
                throw new RuntimeException("Failed to parse RAG AI Roadmap JSON: " + e.getMessage() + " | Raw: " + jsonResponse, e);
            }
        }
    }

    public String generateText(String prompt) {
        return executeWithProvider(prompt);
    }

    public String generateJson(String prompt) {
        String response = executeWithProvider(prompt);
        return extractJsonFromMarkdown(response);
    }

    private String executeWithProvider(String prompt) {
        boolean preferGroq = "groq".equalsIgnoreCase(aiProvider) || "hybrid".equalsIgnoreCase(aiProvider);

        if (preferGroq) {
            if (groqPrimaryModel != null) {
                try {
                    return groqPrimaryModel.generate(prompt);
                } catch (Exception e) {
                    System.err.println("⚠️ Groq Primary (" + groqModel + ") failed: " + e.getMessage() + ". Retrying with fallback model...");
                }
            }
            if (groqFallbackModel != null) {
                try {
                    return groqFallbackModel.generate(prompt);
                } catch (Exception e) {
                    System.err.println("⚠️ Groq Fallback (openai/gpt-oss-20b) failed: " + e.getMessage() + ". Retrying with Gemini...");
                }
            }
            if (geminiModel != null) {
                try {
                    return geminiModel.generate(prompt);
                } catch (Exception e) {
                    throw new RuntimeException("AI failure: all models failed. " + e.getMessage(), e);
                }
            }
        } else {
            if (geminiModel != null) {
                try {
                    return geminiModel.generate(prompt);
                } catch (Exception e) {
                    System.err.println("⚠️ Gemini model failed: " + e.getMessage() + ". Retrying with Groq...");
                }
            }
            if (groqPrimaryModel != null) {
                try {
                    return groqPrimaryModel.generate(prompt);
                } catch (Exception e) {
                    System.err.println("⚠️ Groq Primary model failed: " + e.getMessage());
                }
            }
            if (groqFallbackModel != null) {
                try {
                    return groqFallbackModel.generate(prompt);
                } catch (Exception e) {
                    throw new RuntimeException("AI failure: all models failed. " + e.getMessage(), e);
                }
            }
        }

        throw new RuntimeException("No AI chat model is initialized. Ensure GROQ_API_KEY or GEMINI_API_KEY is configured.");
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
