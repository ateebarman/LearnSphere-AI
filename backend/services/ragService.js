import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import mongoose from 'mongoose';
import StudyMaterial from '../models/StudyMaterial.js';

/**
 * Process PDF: Extract text, chunk it, and store in MongoDB Vector Search
 */
export const processPDF = async (materialId) => {
  const material = await StudyMaterial.findById(materialId);
  if (!material) return;

  try {
    // 1. Extract Text using PDFParse (v2.x)
    const dataBuffer = fs.readFileSync(material.fileUrl);
    const parser = new PDFParse({ data: dataBuffer });
    
    try {
      const textResult = await parser.getText();
      const infoResult = await parser.getInfo();
      
      // Update metadata
      material.metadata.pageCount = textResult.total;
      material.metadata.title = infoResult.info?.Title || material.fileName;
      await material.save();

      // 2. Chunk Text
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      
      const docs = await splitter.createDocuments([textResult.text], [{ 
        materialId: material._id.toString(),
        user: material.user.toString() 
      }]);

      // 3. Initialize Embeddings & Vector Store
      const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS?.split(',')[0];
      
      if (!apiKey) {
         throw new Error('GEMINI_API_KEY is missing in .env. RAG requires a Gemini key for embeddings.');
      }

      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey,
        modelName: "gemini-embedding-001",
      });


      const collection = mongoose.connection.db.collection('vectors');
      
      await MongoDBAtlasVectorSearch.fromDocuments(
        docs,
        embeddings,
        {
          collection,
          indexName: "vector_index",
          textKey: "text",
          embeddingKey: "embedding",
        }
      );

      // 4. Update Material Status
      material.status = 'ready';
      material.vectorStatus = 'completed';
      await material.save();
      
      console.log(`✅ Processed material: ${material.fileName}`);
    } finally {
      await parser.destroy();
    }
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
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS?.split(',')[0];
    
    if (!apiKey) {
       console.error('❌ GEMINI_API_KEY is missing. RAG retrieval will fail.');
       return '';
    }

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      modelName: "gemini-embedding-001",
    });


    const collection = mongoose.connection.db.collection('vectors');
    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection,
      indexName: "vector_index",
      textKey: "text",
      embeddingKey: "embedding",
    });

    // Filter by user to ensure security
    const filter = {
      user: userId.toString()
    };
    
    // Optionally filter by specific material
    if (materialId) {
      filter.materialId = materialId.toString();
    }

    const results = await vectorStore.similaritySearch(query, 4, filter);
    return results.map(r => r.pageContent).join('\n\n');
  } catch (error) {
    console.error(`❌ Error retrieving context: ${error.message}`);
    return '';
  }
};
