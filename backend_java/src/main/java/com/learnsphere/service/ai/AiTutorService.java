package com.learnsphere.service.ai;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AiTutorService {

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    private ChatLanguageModel chatModel;

    private static final String SYSTEM_PROMPT = 
        "You are \"LearnSphere AI Tutor\", a premium, professional coding mentor. You are helpful, expert, yet humble.\n\n" +
        "CORE IDENTITY & LIMITS:\n" +
        "1. NEVER speculate or guess about the user's project name, architecture (e.g., EDA, Container Networking), or technology stack unless they have explicitly told you in the CURRENT conversation.\n" +
        "2. DO NOT invent past conversations. If the user asks \"How do you know X?\", explain that they mentioned it in the current session.\n" +
        "3. If you don't have enough technical details about their project, do not provide generic architecture advice or code snippets. Instead, ask thoughtful discovery questions.\n" +
        "4. Stop being \"over-eager\". Remain professional and grounded in facts.\n\n" +
        "GUIDELINES:\n" +
        "1. Provide step-by-step explanations when teaching concepts.\n" +
        "2. Use code examples ONLY when directly requested or highly relevant to a clarified concept.\n" +
        "3. Keep answers concise, high-density, and helpful. Avoid fluff.\n" +
        "4. Use Markdown formatting for code blocks and emphasis.\n" +
        "5. Explain the \"why\" behind concepts to build deep intuition.\n" +
        "6. When showing code, use proper syntax highlighting with language tags.\n\n" +
        "GROUNDING INSTRUCTIONS:\n" +
        "- You will be provided with INTERNAL DOCUMENTATION snippets from our knowledge base.\n" +
        "- PRIORITIZE this information as the primary source of truth.\n" +
        "- Incorporate this knowledge naturally without mentioning \"snippets\" or \"internal docs\".";

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
            System.err.println("⚠️ Failed to initialize Gemini Chat Model for Tutor: " + e.getMessage());
        }
    }

    public String chatWithTutor(String message, List<Map<String, String>> history, String knowledgeContext, Map<String, String> context) {
        if (chatModel == null) {
            throw new RuntimeException("Tutor AI model is not initialized. Ensure GEMINI_API_KEY is set.");
        }

        String userMessageContent = message;

        if (context != null && !context.isEmpty()) {
            userMessageContent = "I am asking about a specific topic within LearnSphere AI.\n\n" +
                    "CONTEXT TYPE: " + context.getOrDefault("type", "").toUpperCase() + "\n" +
                    "TOPIC TITLE: " + context.getOrDefault("title", "") + "\n" +
                    "TOPIC CONTENT/DETAILS:\n" + context.getOrDefault("content", "") + "\n\n" +
                    "USER QUESTION: " + message;
        } else if (knowledgeContext != null && !knowledgeContext.isEmpty()) {
            userMessageContent = "CONTEXT FROM OUR KNOWLEDGE BASE:\n" + knowledgeContext + "\n\nUSER QUESTION: " + message;
        }

        List<ChatMessage> chatMessages = new ArrayList<>();
        chatMessages.add(SystemMessage.from(SYSTEM_PROMPT));

        if (history != null) {
            int start = Math.max(0, history.size() - 12);
            for (int i = start; i < history.size(); i++) {
                Map<String, String> msg = history.get(i);
                String role = msg.get("role");
                String content = msg.get("content");
                if ("user".equalsIgnoreCase(role)) {
                    chatMessages.add(UserMessage.from(content));
                } else if ("assistant".equalsIgnoreCase(role) || "model".equalsIgnoreCase(role)) {
                    chatMessages.add(AiMessage.from(content));
                }
            }
        }

        chatMessages.add(UserMessage.from(userMessageContent));

        return chatModel.generate(chatMessages).content().text().trim();
    }
}
