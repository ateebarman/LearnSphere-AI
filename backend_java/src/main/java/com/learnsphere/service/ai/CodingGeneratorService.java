package com.learnsphere.service.ai;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsphere.model.CodingQuestion;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CodingGeneratorService {

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

    public CodingGeneratorService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
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
                System.out.println("✅ CodingGenerator Groq Primary Model initialized: " + targetModel);
            } catch (Exception e) {
                System.err.println("⚠️ Failed to initialize Groq Primary Model for Coding: " + e.getMessage());
            }

            try {
                this.groqFallbackModel = OpenAiChatModel.builder()
                        .baseUrl(groqBaseUrl)
                        .apiKey(groqApiKey.trim())
                        .modelName("openai/gpt-oss-20b")
                        .temperature(0.7)
                        .timeout(Duration.ofSeconds(20))
                        .build();
                System.out.println("✅ CodingGenerator Groq Fallback Model initialized: openai/gpt-oss-20b");
            } catch (Exception e) {
                System.err.println("⚠️ Failed to initialize Groq Fallback Model for Coding: " + e.getMessage());
            }
        }

        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            try {
                this.geminiModel = GoogleAiGeminiChatModel.builder()
                        .apiKey(geminiApiKey.trim())
                        .modelName("gemini-3.8-flash")
                        .temperature(0.7)
                        .build();
                System.out.println("✅ CodingGenerator Gemini Model initialized: gemini-3.8-flash");
            } catch (Exception e) {
                System.err.println("⚠️ Failed to initialize Gemini Chat Model for Coding: " + e.getMessage());
            }
        }
    }

    public CodingQuestion generateCodingQuestionFromAI(String topic, String description) {
        String contextPrompt = (description != null && !description.isEmpty()) ? 
                "\n    CONTEXT/DESCRIPTION: \"" + description + "\"\n    INTEGRATE this context into the problem logic." : "";

        String prompt = String.format(
            "You are a Senior Technical Content Engineer at LeetCode. \n" +
            "Generate a coding problem for: \"%s\".%s\n\n" +
            "### LANGUAGE RULES:\n" +
            "- **C++**: Use \"int\", \"long long\", \"string\", \"vector<T>\". Include <bits/stdc++.h>.\n" +
            "- **Python**: Use standard type hints (e.g., List[int], str).\n" +
            "- **JavaScript**: Use standard ES6. No TypeScript types in JS.\n" +
            "- **FORBIDDEN**: Never use \"number\" or \"number[]\" in C++. Never use \"require\" or \"import\".\n\n" +
            "### STRUCTURE RULE:\n" +
            "- Standard Function: class Solution { public: [method] } (CPP), class Solution: def [method] (Python), class Solution { [method] } (JS).\n\n" +
            "### FINAL JSON STRUCTURE:\n" +
            "{\n" +
            "  \"title\": \"string\",\n" +
            "  \"slug\": \"string\",\n" +
            "  \"difficulty\": \"Easy\" | \"Medium\" | \"Hard\",\n" +
            "  \"problemStatement\": \"markdown\",\n" +
            "  \"constraints\": [\"strings\"],\n" +
            "  \"examples\": [{ \"input\": \"string\", \"output\": \"string\", \"explanation\": \"string\" }],\n" +
            "  \"functionSignature\": { \"methodName\": \"string\", \"parameters\": [{\"name\": \"string\", \"type\": \"string\"}], \"returnType\": \"string\" },\n" +
            "  \"judgeDriver\": { \"javascript\": \"string\", \"python\": \"string\", \"cpp\": \"string\" },\n" +
            "  \"referenceSolution\": { \"javascript\": \"string\", \"python\": \"string\", \"cpp\": \"string\" },\n" +
            "  \"starterCode\": { \"javascript\": \"string\", \"python\": \"string\", \"cpp\": \"string\" },\n" +
            "  \"visibleTestCases\": [ { \"input\": \"string\", \"expectedOutput\": \"string\" } ],\n" +
            "  \"hiddenTestCases\": [ { \"input\": \"string\", \"expectedOutput\": \"string\" } ]\n" +
            "}", topic, contextPrompt
        );

        String jsonResponse = generateJson(prompt);
        try {
            CodingQuestion question = objectMapper.readValue(jsonResponse, CodingQuestion.class);
            
            // Stage 4 Fallback: Generate Platform-Controlled Starter Code
            if (question.getFunctionSignature() != null && (question.getStarterCode() == null || question.getStarterCode().getJavascript() == null)) {
                question.setStarterCode(generateStarterCode(question.getFunctionSignature()));
            }

            return question;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate high-quality coding question: " + e.getMessage(), e);
        }
    }

    private CodingQuestion.CodeSnippet generateStarterCode(CodingQuestion.FunctionSignature signature) {
        String methodName = signature.getMethodName();
        var parameters = signature.getParameters();
        String returnType = signature.getReturnType();

        Map<String, String> typeMapCpp = new HashMap<>();
        typeMapCpp.put("integer", "int");
        typeMapCpp.put("int", "int");
        typeMapCpp.put("string", "string");
        typeMapCpp.put("array", "vector<int>&");
        typeMapCpp.put("boolean", "bool");
        typeMapCpp.put("vector<int>", "vector<int>");
        typeMapCpp.put("vector<int>&", "vector<int>&");
        typeMapCpp.put("vector<vector<int>>", "vector<vector<int>>");

        StringBuilder cppParams = new StringBuilder();
        StringBuilder jsParams = new StringBuilder();
        StringBuilder pyParams = new StringBuilder();

        for (int i = 0; i < parameters.size(); i++) {
            var p = parameters.get(i);
            String cppType = typeMapCpp.getOrDefault(p.getType().toLowerCase(), p.getType());
            
            cppParams.append(cppType).append(" ").append(p.getName());
            jsParams.append(p.getName());
            pyParams.append(p.getName());

            if (i < parameters.size() - 1) {
                cppParams.append(", ");
                jsParams.append(", ");
                pyParams.append(", ");
            }
        }

        String cppRetType = returnType != null ? typeMapCpp.getOrDefault(returnType.toLowerCase(), returnType) : "void";

        CodingQuestion.CodeSnippet starterCode = new CodingQuestion.CodeSnippet();
        starterCode.setCpp(String.format("class Solution {\npublic:\n    %s %s(%s) {\n        \n    }\n};", cppRetType, methodName, cppParams));
        starterCode.setJavascript(String.format("class Solution {\n    %s(%s) {\n        \n    }\n}", methodName, jsParams));
        starterCode.setPython(String.format("class Solution:\n    def %s(self, %s):\n        pass\n", methodName, pyParams));

        return starterCode;
    }

    private String generateJson(String prompt) {
        boolean preferGroq = "groq".equalsIgnoreCase(aiProvider) || "hybrid".equalsIgnoreCase(aiProvider);

        if (preferGroq) {
            if (groqPrimaryModel != null) {
                try {
                    String response = groqPrimaryModel.generate(prompt);
                    return extractJsonFromMarkdown(response);
                } catch (Exception e) {
                    System.err.println("⚠️ Coding Groq Primary (" + groqModel + ") failed: " + e.getMessage() + ". Retrying with fallback...");
                }
            }
            if (groqFallbackModel != null) {
                try {
                    String response = groqFallbackModel.generate(prompt);
                    return extractJsonFromMarkdown(response);
                } catch (Exception e) {
                    System.err.println("⚠️ Coding Groq Fallback (openai/gpt-oss-20b) failed: " + e.getMessage() + ". Retrying with Gemini...");
                }
            }
            if (geminiModel != null) {
                try {
                    String response = geminiModel.generate(prompt);
                    return extractJsonFromMarkdown(response);
                } catch (Exception e) {
                    throw new RuntimeException("Coding AI failure: all models failed. " + e.getMessage(), e);
                }
            }
        } else {
            if (geminiModel != null) {
                try {
                    String response = geminiModel.generate(prompt);
                    return extractJsonFromMarkdown(response);
                } catch (Exception e) {
                    System.err.println("⚠️ Coding Gemini failed: " + e.getMessage() + ". Retrying with Groq...");
                }
            }
            if (groqPrimaryModel != null) {
                try {
                    String response = groqPrimaryModel.generate(prompt);
                    return extractJsonFromMarkdown(response);
                } catch (Exception e) {
                    System.err.println("⚠️ Coding Groq Primary failed: " + e.getMessage());
                }
            }
            if (groqFallbackModel != null) {
                try {
                    String response = groqFallbackModel.generate(prompt);
                    return extractJsonFromMarkdown(response);
                } catch (Exception e) {
                    throw new RuntimeException("Coding AI failure: all models failed. " + e.getMessage(), e);
                }
            }
        }

        throw new RuntimeException("Coding AI Chat model is not initialized. Ensure GROQ_API_KEY or GEMINI_API_KEY is configured.");
    }

    private String extractJsonFromMarkdown(String text) {
        if (text == null) return "{}";
        Matcher matcher = Pattern.compile("```(?:json)?\\s*(.*?)\\s*```", Pattern.DOTALL).matcher(text);
        if (matcher.find()) return matcher.group(1).trim();
        
        int startIndex = text.indexOf('{');
        int endIndex = text.lastIndexOf('}');
        if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
            return text.substring(startIndex, endIndex + 1);
        }
        return text;
    }
}
