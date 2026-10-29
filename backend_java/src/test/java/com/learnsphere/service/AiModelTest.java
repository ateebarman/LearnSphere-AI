package com.learnsphere.service;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import io.github.cdimascio.dotenv.Dotenv;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class AiModelTest {

    @Test
    void testGroqConnectionWithFreeModels() {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        String groqKey = dotenv.get("GROQ_API_KEY1", System.getenv("GROQ_API_KEY1"));
        if (groqKey == null || groqKey.isBlank()) {
            groqKey = dotenv.get("GROQ_API_KEY", System.getenv("GROQ_API_KEY"));
        }
        if (groqKey == null || groqKey.isBlank()) {
            // Also check parent backend/.env
            try {
                Dotenv parentDotenv = Dotenv.configure().directory("../backend").ignoreIfMissing().load();
                groqKey = parentDotenv.get("GROQ_API_KEY1");
            } catch (Exception ignored) {}
        }

        if (groqKey == null || groqKey.isBlank()) {
            System.out.println("⚠️ No GROQ_API_KEY found, skipping live API test.");
            return;
        }

        try {
            System.out.println("--- Testing Groq Flagship Model (openai/gpt-oss-120b) ---");
            ChatLanguageModel primaryModel = OpenAiChatModel.builder()
                    .baseUrl("https://api.groq.com/openai/v1")
                    .apiKey(groqKey)
                    .modelName("openai/gpt-oss-120b")
                    .temperature(0.1)
                    .timeout(Duration.ofSeconds(30))
                    .build();

            String response120b = primaryModel.generate("Say hello in 3 words or less.");
            System.out.println("Groq 120B Response: " + response120b);
            assertNotNull(response120b);
            assertFalse(response120b.isBlank());

            System.out.println("--- Testing Groq Fallback Model (openai/gpt-oss-20b) ---");
            ChatLanguageModel fallbackModel = OpenAiChatModel.builder()
                    .baseUrl("https://api.groq.com/openai/v1")
                    .apiKey(groqKey)
                    .modelName("openai/gpt-oss-20b")
                    .temperature(0.1)
                    .timeout(Duration.ofSeconds(20))
                    .build();

            String response20b = fallbackModel.generate("Say hello in 3 words or less.");
            System.out.println("Groq 20B Response: " + response20b);
            assertNotNull(response20b);
            assertFalse(response20b.isBlank());

            System.out.println("✅ All Java Groq Free Model tests passed successfully!");
        } catch (Exception e) {
            if (e.getMessage() != null && (e.getMessage().contains("UnknownHostException") || e.getMessage().contains("No such host"))) {
                System.out.println("⚠️ Network is isolated/offline, skipping live Groq API call assertion: " + e.getMessage());
            } else {
                throw e;
            }
        }
    }
}
