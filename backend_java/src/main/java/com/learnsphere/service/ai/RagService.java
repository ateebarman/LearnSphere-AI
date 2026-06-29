package com.learnsphere.service.ai;

import com.learnsphere.model.StudyMaterial;
import com.learnsphere.repository.StudyMaterialRepository;
import com.mongodb.client.MongoClient;
import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentParser;
import dev.langchain4j.data.document.parser.apache.pdfbox.ApachePdfBoxDocumentParser;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.mongodb.MongoDbEmbeddingStore;
import dev.langchain4j.store.embedding.filter.Filter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static dev.langchain4j.store.embedding.filter.MetadataFilterBuilder.metadataKey;

@Service
public class RagService {

    @Value("${GEMINI_API_KEY:${GEMINI_API_KEY1:}}")
    private String geminiApiKey;

    @Value("${spring.data.mongodb.database:learnsphere}")
    private String databaseName;

    private final MongoClient mongoClient;
    private final StudyMaterialRepository studyMaterialRepository;

    private EmbeddingModel embeddingModel;
    private EmbeddingStore<TextSegment> embeddingStore;

    public RagService(MongoClient mongoClient, StudyMaterialRepository studyMaterialRepository) {
        this.mongoClient = mongoClient;
        this.studyMaterialRepository = studyMaterialRepository;
    }

    @PostConstruct
    public void init() {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            System.err.println("⚠️ GEMINI_API_KEY not found in environment. RAG embeddings will fail.");
            return;
        }

        try {
            this.embeddingModel = GoogleAiEmbeddingModel.builder()
                    .apiKey(geminiApiKey)
                    .modelName("models/text-embedding-004")
                    .build();

            this.embeddingStore = MongoDbEmbeddingStore.builder()
                    .fromClient(mongoClient)
                    .databaseName(databaseName)
                    .collectionName("vectors")
                    .indexName("vector_index")
                    .build();
        } catch (Throwable e) {
            System.err.println("⚠️ RAG vector store initialization skipped (MongoDB driver compatibility): " + e.getMessage());
            System.err.println("   → RAG-based roadmap generation will be unavailable. All other features work normally.");
            this.embeddingStore = null;
        }
    }

    public void processPDF(String materialId) {
        Optional<StudyMaterial> materialOpt = studyMaterialRepository.findById(materialId);
        if (materialOpt.isEmpty()) return;

        StudyMaterial material = materialOpt.get();

        try {
            File pdfFile = new File(material.getFileUrl());
            if (!pdfFile.exists()) {
                throw new RuntimeException("File not found at path: " + material.getFileUrl());
            }

            // 1. Extract Text
            DocumentParser parser = new ApachePdfBoxDocumentParser();
            Document document;
            try (InputStream is = new FileInputStream(pdfFile)) {
                document = parser.parse(is);
            }

            // Update Metadata
            StudyMaterial.StudyMaterialMetadata metadata = material.getMetadata();
            if (metadata == null) metadata = new StudyMaterial.StudyMaterialMetadata();
            metadata.setTitle(document.metadata().getString("title") != null ? document.metadata().getString("title") : material.getFileName());
            material.setMetadata(metadata);
            studyMaterialRepository.save(material);

            // Add our custom metadata for filtering
            document.metadata().put("materialId", material.getId());
            document.metadata().put("user", material.getUser());

            // 2. Chunk Text
            List<TextSegment> segments = DocumentSplitters.recursive(1000, 200).split(document);

            // 3. Store vectors
            System.out.println("📦 Embedding " + segments.size() + " chunks...");
            List<Embedding> embeddings = embeddingModel.embedAll(segments).content();
            embeddingStore.addAll(embeddings, segments);

            // 4. Update Status
            material.setStatus("ready");
            material.setVectorStatus("completed");
            studyMaterialRepository.save(material);

            System.out.println("✅ Processed material: " + material.getFileName() + " (" + segments.size() + " chunks)");

        } catch (Exception e) {
            System.err.println("❌ Error processing PDF: " + e.getMessage());
            material.setStatus("error");
            material.setVectorStatus("failed");
            StudyMaterial.StudyMaterialMetadata metadata = material.getMetadata();
            if (metadata == null) metadata = new StudyMaterial.StudyMaterialMetadata();
            metadata.setErrorMessage(e.getMessage());
            material.setMetadata(metadata);
            studyMaterialRepository.save(material);
        }
    }

    public String getRelevantContext(String query, String userId, String materialId) {
        if (embeddingStore == null || embeddingModel == null) {
            System.err.println("❌ RAG components not initialized.");
            return "";
        }

        try {
            Embedding queryEmbedding = embeddingModel.embed(query).content();

            Filter filter = metadataKey("user").isEqualTo(userId);
            if (materialId != null && !materialId.isEmpty()) {
                filter = filter.and(metadataKey("materialId").isEqualTo(materialId));
            }

            EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                    .queryEmbedding(queryEmbedding)
                    .maxResults(4)
                    .filter(filter)
                    .build();

            EmbeddingSearchResult<TextSegment> result = embeddingStore.search(request);
            System.out.println("🔍 RAG retrieval: " + result.matches().size() + " chunks found.");

            return result.matches().stream()
                    .map(EmbeddingMatch::embedded)
                    .map(TextSegment::text)
                    .collect(Collectors.joining("\n\n"));
        } catch (Exception e) {
            System.err.println("❌ RAG retrieval failed: " + e.getMessage());
            return "";
        }
    }
}
