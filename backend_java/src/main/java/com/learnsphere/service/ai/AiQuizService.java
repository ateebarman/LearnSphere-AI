package com.learnsphere.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;

@Service
public class AiQuizService {

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    private ChatLanguageModel chatModel;
    private final ObjectMapper objectMapper;

    public AiQuizService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return;
        }
        try {
            this.chatModel = GoogleAiGeminiChatModel.builder()
                    .apiKey(geminiApiKey)
                    .modelName("gemini-1.5-flash")
                    .temperature(0.7)
                    .build();
        } catch (Exception e) {
            System.err.println("⚠️ Failed to initialize Gemini Chat Model for Quizzes: " + e.getMessage());
        }
    }

    public Map<String, Object> generateQuizFromAI(String moduleTitle, String topic, String knowledgeContext) {
        if (chatModel == null) {
            throw new RuntimeException("AI Model not initialized");
        }

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
            String jsonResponse = chatModel.generate(SystemMessage.from("You are a helpful assistant that returns only JSON."), UserMessage.from(prompt)).content().text();
            jsonResponse = jsonResponse.replaceAll("```json", "").replaceAll("```", "").trim();
            return objectMapper.readValue(jsonResponse, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate quiz: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> getRecommendationsFromAI(String moduleTitle, double score, List<String> incorrectAnswers) {
        if (chatModel == null) {
            throw new RuntimeException("AI Model not initialized");
        }

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
            String jsonResponse = chatModel.generate(SystemMessage.from("You are a helpful assistant that returns only JSON."), UserMessage.from(prompt)).content().text();
            jsonResponse = jsonResponse.replaceAll("```json", "").replaceAll("```", "").trim();
            return objectMapper.readValue(jsonResponse, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate recommendations: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> getArticlesFromAI(String topic) {
        if (chatModel == null) {
            throw new RuntimeException("AI Model not initialized");
        }

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
            String jsonResponse = chatModel.generate(SystemMessage.from("You are a helpful assistant that returns only JSON."), UserMessage.from(prompt)).content().text();
            jsonResponse = jsonResponse.replaceAll("```json", "").replaceAll("```", "").trim();
            return objectMapper.readValue(jsonResponse, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch articles: " + e.getMessage(), e);
        }
    }
}
