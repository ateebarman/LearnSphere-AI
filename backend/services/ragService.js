import fs from 'fs';
import pdf from 'pdf-parse-fork';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import mongoose from 'mongoose';
import StudyMaterial from '../models/StudyMaterial.js';

// ─── Multi-Key Rotation for Embeddings ───────────────────────────
let embeddingKeys = [];
let currentEmbeddingKeyIndex = 0;

const initEmbeddingKeys = () => {
  if (embeddingKeys.length > 0) return; // already initialized

  // Collect keys: GEMINI_API_KEY1..10 (same pool as main AI service)
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY${i}`];
    if (key) embeddingKeys.push(key);
  }
  // Also try the single-key env var as fallback
  if (embeddingKeys.length === 0 && process.env.GEMINI_API_KEY) {
    embeddingKeys.push(process.env.GEMINI_API_KEY);
  }
  // Also try comma-separated keys
  if (embeddingKeys.length === 0 && process.env.GEMINI_API_KEYS) {
    embeddingKeys = process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(Boolean);
  }

  if (embeddingKeys.length > 0) {
    console.log(`🔑 RAG Embedding Service: ${embeddingKeys.length} Gemini key(s) available for rotation`);
  } else {
    console.warn('⚠️  RAG: No Gemini API keys found. Embeddings will fail.');
  }
};

/**
 * Get an embedding instance with the next available key (round-robin rotation)
 */
const getEmbeddingsWithRotation = (keyOffset = 0) => {
  initEmbeddingKeys();

  if (embeddingKeys.length === 0) {
    throw new Error('No Gemini API keys configured for RAG embeddings');
  }

  const index = (currentEmbeddingKeyIndex + keyOffset) % embeddingKeys.length;
  const apiKey = embeddingKeys[index];

  // Advance the pointer for next call
  if (keyOffset === 0) {
    currentEmbeddingKeyIndex = (currentEmbeddingKeyIndex + 1) % embeddingKeys.length;
  }

  return {
    embeddings: new GoogleGenerativeAIEmbeddings({
      apiKey,
      modelName: 'gemini-embedding-001',
    }),
    keyIndex: index,
  };
};

/**
 * Retry wrapper — tries operation across all available keys with exponential backoff
 */
const withKeyRotationRetry = async (operation, operationName = 'RAG operation') => {
  const maxRetries = Math.max(embeddingKeys.length, 3);
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { embeddings, keyIndex } = getEmbeddingsWithRotation(attempt);

    try {
      const result = await operation(embeddings, keyIndex);
      return result;
    } catch (error) {
      lastError = error;
      const isRateLimit = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('quota');
      const isTransient = error.message?.includes('503') || error.message?.includes('500') || error.message?.includes('UNAVAILABLE');

      if (isRateLimit || isTransient) {
        const waitMs = Math.min(1000 * Math.pow(2, attempt), 15000); // 1s, 2s, 4s, 8s, 15s max
        console.warn(`⚠️ ${operationName} failed on Key ${keyIndex + 1} (${isRateLimit ? 'rate limited' : 'transient error'}). Retrying with next key in ${waitMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }

      // Non-retriable error (bad key, auth error, etc.) — try next key but don't wait
      console.warn(`❌ ${operationName} failed on Key ${keyIndex + 1}: ${error.message}`);
    }
  }

  throw lastError || new Error(`${operationName}: All ${maxRetries} key attempts failed`);
};

// ─── Core RAG Functions ──────────────────────────────────────────

/**
 * Process PDF: Extract text, chunk it, and store in MongoDB Vector Search
 */
export const processPDF = async (materialId) => {
  const material = await StudyMaterial.findById(materialId);
  if (!material) return;

  try {
    // 1. Extract Text using stable pdf-parse (v1.1.1)
    const dataBuffer = fs.readFileSync(material.fileUrl);
    const data = await pdf(dataBuffer);

    // Update metadata
    material.metadata.pageCount = data.numpages;
    material.metadata.title = data.info?.Title || material.fileName;
    await material.save();

    // 2. Chunk Text
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.createDocuments([data.text], [{
      materialId: material._id.toString(),
      user: material.user.toString()
    }]);

    // 3. Store vectors with key rotation + retry
    await withKeyRotationRetry(async (embeddings, keyIndex) => {
      console.log(`📦 Embedding ${docs.length} chunks using Key ${keyIndex + 1}...`);

      const collection = mongoose.connection.db.collection('vectors');

      await MongoDBAtlasVectorSearch.fromDocuments(
        docs,
        embeddings,
        {
          collection,
          indexName: 'vector_index',
          textKey: 'text',
          embeddingKey: 'embedding',
        }
      );
    }, 'PDF Embedding');

    // 4. Update Material Status
    material.status = 'ready';
    material.vectorStatus = 'completed';
    await material.save();

    console.log(`✅ Processed material: ${material.fileName} (${docs.length} chunks)`);
  } catch (error) {
    console.error(`❌ Error processing PDF: ${error.message}`);
    material.status = 'error';
    material.vectorStatus = 'failed';
    material.metadata.errorMessage = error.message;
    await material.save();
  }
};

/**
 * Retrieve relevant chunks for a given query and user
 */
export const getRelevantContext = async (query, userId, materialId = null) => {
  try {
    return await withKeyRotationRetry(async (embeddings, keyIndex) => {
      const collection = mongoose.connection.db.collection('vectors');
      const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
        collection,
        indexName: 'vector_index',
        textKey: 'text',
        embeddingKey: 'embedding',
      });

      // Filter by user to ensure security
      const filter = { user: userId.toString() };
      if (materialId) {
        filter.materialId = materialId.toString();
      }

      const results = await vectorStore.similaritySearch(query, 4, filter);
      console.log(`🔍 RAG retrieval: ${results.length} chunks found using Key ${keyIndex + 1}`);
      return results.map(r => r.pageContent).join('\n\n');
    }, 'RAG Retrieval');
  } catch (error) {
    console.error(`❌ RAG retrieval failed after all retries: ${error.message}`);
    return '';
  }
};
