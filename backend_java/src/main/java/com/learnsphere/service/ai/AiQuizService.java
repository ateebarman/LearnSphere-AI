package com.learnsphere.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class AiQuizService {

    @Value("${AI_PROVIDER:hybrid}")
    private String aiProvider;

    @Value("${GROQ_API_KEY1:${GROQ_API_KEY:}}")
    private String groqApiKey;

    @Value("${GROQ_BASE_URL:https://api.groq.com/openai/v1}")
    private String groqBaseUrl;

    @Value("${GROQ_MODEL:openai/gpt-oss-120b}")
    private String groqModel;

    @Value("${GEMINI_API_KEY:${GEMINI_API_KEY1:}}")
    private String geminiApiKey;

    private ChatLanguageModel groqPrimaryModel;
    private ChatLanguageModel groqFallbackModel;
    private ChatLanguageModel geminiModel;
    private final ObjectMapper objectMapper;

    public AiQuizService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
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
                        .timeout(Duration.ofSeconds(30))
                        .build();
                System.out.println("✅ AiQuizService Groq Primary Model initialized: " + targetModel);
            } catch (Exception e) {
                System.err.println("⚠️ Failed to initialize Groq Primary Model for Quizzes: " + e.getMessage());
            }

            try {
                this.groqFallbackModel = OpenAiChatModel.builder()
                        .baseUrl(groqBaseUrl)
                        .apiKey(groqApiKey.trim())
                        .modelName("openai/gpt-oss-20b")
                        .temperature(0.7)
                        .timeout(Duration.ofSeconds(20))
                        .build();
                System.out.println("✅ AiQuizService Groq Fallback Model initialized: openai/gpt-oss-20b");
            } catch (Exception e) {
                System.err.println("⚠️ Failed to initialize Groq Fallback Model for Quizzes: " + e.getMessage());
            }
        }

        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            try {
                this.geminiModel = GoogleAiGeminiChatModel.builder()
                        .apiKey(geminiApiKey.trim())
                        .modelName("gemini-3.8-flash")
                        .temperature(0.7)
                        .build();
                System.out.println("✅ AiQuizService Gemini Model initialized: gemini-3.8-flash");
            } catch (Exception e) {
                System.err.println("⚠️ Failed to initialize Gemini Chat Model for Quizzes: " + e.getMessage());
            }
        }
    }

    private String generateWithFallback(List<ChatMessage> messages) {
        boolean preferGroq = "groq".equalsIgnoreCase(aiProvider) || "hybrid".equalsIgnoreCase(aiProvider);

        if (preferGroq) {
            if (groqPrimaryModel != null) {
                try {
                    return groqPrimaryModel.generate(messages).content().text();
                } catch (Exception e) {
                    System.err.println("⚠️ Quiz Groq Primary (" + groqModel + ") failed: " + e.getMessage() + ". Retrying with fallback...");
                }
            }
            if (groqFallbackModel != null) {
                try {
                    return groqFallbackModel.generate(messages).content().text();
                } catch (Exception e) {
                    System.err.println("⚠️ Quiz Groq Fallback (openai/gpt-oss-20b) failed: " + e.getMessage() + ". Retrying with Gemini...");
                }
            }
            if (geminiModel != null) {
                try {
                    return geminiModel.generate(messages).content().text();
                } catch (Exception e) {
                    throw new RuntimeException("Quiz AI failure: all models failed. " + e.getMessage(), e);
                }
            }
        } else {
            if (geminiModel != null) {
                try {
                    return geminiModel.generate(messages).content().text();
                } catch (Exception e) {
                    System.err.println("⚠️ Quiz Gemini failed: " + e.getMessage() + ". Retrying with Groq...");
                }
            }
            if (groqPrimaryModel != null) {
                try {
                    return groqPrimaryModel.generate(messages).content().text();
                } catch (Exception e) {
                    System.err.println("⚠️ Quiz Groq Primary failed: " + e.getMessage());
                }
            }
            if (groqFallbackModel != null) {
                try {
                    return groqFallbackModel.generate(messages).content().text();
                } catch (Exception e) {
                    throw new RuntimeException("Quiz AI failure: all models failed. " + e.getMessage(), e);
                }
            }
        }

        throw new RuntimeException("AI Model not initialized");
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> generateQuizFromAI(String moduleTitle, String topic, String knowledgeContext) {
        String prompt = "You are an expert assessment designer.\n" +
                "Generate a 10-question multiple-choice quiz for the topic \"" + moduleTitle + "\" within the broader subject of \"" + topic + "\".\n\n";

        if (knowledgeContext != null && !knowledgeContext.isEmpty()) {
            prompt += "GROUNDING SOURCE MATERIAL:\n" +
                    "The following content is from our official expert-verified knowledge base.\n" +
                    "PLEASE generate at least 7 of the 10 questions STRICTLY BASED on the information provided below.\n\n" +
                    "\"\"\"\n" + knowledgeContext + "\n\"\"\"\n\n";
        }

        prompt += "QUIZ RULES:\n" +
                "1. Ensure questions cover technical nuances, common pitfalls, and core principles.\n" +
                "2. Each question must have 4 distinct options.\n" +
                "3. One option must be clearly correct.\n\n" +
                "Respond with a JSON object containing a single key \"questions\".\n" +
                "\"questions\" should be an array of objects. Each object must have:\n" +
                "1. \"question\" (string): The text of the question.\n" +
                "2. \"options\" (array of strings): An array of 4 possible answers.\n" +
                "3. \"correctAnswer\" (string): The string of the correct answer, which must be one of the strings from the \"options\" array.";

        try {
            String jsonResponse = generateWithFallback(List.of(
                    SystemMessage.from("You are a helpful assistant that returns only valid JSON."),
                    UserMessage.from(prompt)
            ));
            jsonResponse = jsonResponse.replaceAll("```json", "").replaceAll("```", "").trim();
            return objectMapper.readValue(jsonResponse, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate quiz: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getRecommendationsFromAI(String moduleTitle, double score, List<String> incorrectAnswers) {
        String incorrectStr = String.join(", ", incorrectAnswers);
        String prompt = "A user just scored " + score + "% on a quiz about \"" + moduleTitle + "\".\n" +
                "Their incorrect answers were on these topics: " + incorrectStr + ".\n\n" +
                "Generate a short, encouraging feedback message and personalized recommendations.\n" +
                "If the score is < 70%, suggest specific resources or concepts to review based on the incorrect answers.\n" +
                "If the score is > 90%, congratulate them and suggest they move on or explore an advanced related topic.\n\n" +
                "Respond with a JSON object with one key: \"feedback\".\n\n" +
                "Example:\n" +
                "{\n" +
                "  \"feedback\": \"Great job on the quiz! You scored " + score + "%. You seem to have a good grasp, but try reviewing... Here is a good article: [link]\"\n" +
                "}";

        try {
            String jsonResponse = generateWithFallback(List.of(
                    SystemMessage.from("You are a helpful assistant that returns only valid JSON."),
                    UserMessage.from(prompt)
            ));
            jsonResponse = jsonResponse.replaceAll("```json", "").replaceAll("```", "").trim();
            return objectMapper.readValue(jsonResponse, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate recommendations: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getArticlesFromAI(String topic) {
        String prompt = "Find 3 high-quality articles or documentation links for learning about \"" + topic + "\".\n" +
                "Respond with a JSON object with a key \"resources\".\n" +
                "\"resources\" should be an array of objects, each with \"title\", \"url\", \"description\", and \"type\" (set to \"article\" or \"doc\").\n\n" +
                "Example:\n" +
                "{\n" +
                "  \"resources\": [\n" +
                "    {\n" +
                "      \"title\": \"MDN Docs: " + topic + "\",\n" +
                "      \"url\": \"https://developer.mozilla.org/...\",\n" +
                "      \"description\": \"The official MDN documentation.\",\n" +
                "      \"type\": \"doc\"\n" +
                "    }\n" +
                "  ]\n" +
                "}";

        try {
            String jsonResponse = generateWithFallback(List.of(
                    SystemMessage.from("You are a helpful assistant that returns only valid JSON."),
                    UserMessage.from(prompt)
            ));
            jsonResponse = jsonResponse.replaceAll("```json", "").replaceAll("```", "").trim();
            return objectMapper.readValue(jsonResponse, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch articles: " + e.getMessage(), e);
        }
    }
}
