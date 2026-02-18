/**
 * Migration Script: Enrich existing Knowledge Base entries
 * 
 * This script:
 * 1. Generates slugs from topic names
 * 2. Copies codeSnippets → implementations 
 * 3. Copies verifiedResources → furtherReading
 * 4. Sets sensible defaults for new fields
 * 5. Auto-generates searchableText
 * 6. Auto-calculates estimatedReadTime
 * 
 * Run: node --env-file=.env scripts/migrateKnowledge.js
 *   or: npx dotenv -- node scripts/migrateKnowledge.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const INTERVIEW_CATEGORIES = {
  'DSA': { importance: 9.0, frequency: 'High', weight: 0.9 },
  'System Design': { importance: 8.5, frequency: 'High', weight: 0.85 },
  'Database': { importance: 7.5, frequency: 'High', weight: 0.75 },
  'DBMS': { importance: 7.5, frequency: 'High', weight: 0.75 },
  'OS': { importance: 7.0, frequency: 'Medium', weight: 0.70 },
  'Networking': { importance: 6.5, frequency: 'Medium', weight: 0.65 },
  'Web Development': { importance: 7.0, frequency: 'Medium', weight: 0.70 },
  'AI/ML': { importance: 6.0, frequency: 'Medium', weight: 0.60 },
  'Security': { importance: 6.0, frequency: 'Low', weight: 0.55 },
  'Distributed Systems': { importance: 8.0, frequency: 'Medium', weight: 0.80 },
  'Languages': { importance: 5.5, frequency: 'Medium', weight: 0.55 },
  'Cloud': { importance: 6.5, frequency: 'Medium', weight: 0.65 },
  'DevOps': { importance: 5.5, frequency: 'Low', weight: 0.50 },
  'Compiler Design': { importance: 5.0, frequency: 'Low', weight: 0.45 },
  'General': { importance: 5.0, frequency: 'Low', weight: 0.50 },
  'Big Data': { importance: 5.5, frequency: 'Low', weight: 0.50 },
  'Emerging Tech': { importance: 4.5, frequency: 'Low', weight: 0.40 },
  'Embedded': { importance: 4.5, frequency: 'Low', weight: 0.40 },
  'Low Level': { importance: 5.5, frequency: 'Low', weight: 0.50 },
};

function generateSlug(topic) {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function guessTopicType(topic, content) {
  const lower = (topic + ' ' + (content || '')).toLowerCase();
  if (lower.includes('algorithm') || lower.includes('sort') || lower.includes('search') || lower.includes('traversal'))
    return 'Algorithm';
  if (lower.includes('design') || lower.includes('pattern') || lower.includes('architecture'))
    return 'Design';
  if (lower.includes('theory') || lower.includes('theorem') || lower.includes('proof'))
    return 'Theory';
  return 'Concept';
}

function guessDifficulty(content, complexity) {
  if (!content) return 'Intermediate';
  const wordCount = content.split(/\s+/).length;
  const hasAdvanced = content.toLowerCase().includes('advanced') || content.toLowerCase().includes('complex');
  const timeComplexity = complexity?.time || '';
  
  if (wordCount > 800 || hasAdvanced || timeComplexity.includes('log') || timeComplexity.includes('n^2'))
    return 'Advanced';
  if (wordCount < 300)
    return 'Beginner';
  return 'Intermediate';
}

function generateTags(topic, category) {
  const tags = new Set();
  tags.add(category);
  
  // Split topic into meaningful words
  const words = topic.split(/[\s,&+/]+/).filter(w => w.length > 2);
  words.forEach(w => tags.add(w));
  
  return [...tags];
}

function generateSearchableText(doc) {
  return [
    doc.topic,
    doc.category,
    doc.summary,
    ...(doc.tags || []),
    ...(doc.keywords || []),
    ...(doc.keyPrinciples || []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function calculateReadTime(content) {
  if (!content) return 5;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

async function migrate() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!\n');

    const collection = mongoose.connection.collection('knowledgenodes');
    const entries = await collection.find({}).toArray();
    
    console.log(`📦 Found ${entries.length} knowledge entries to migrate\n`);

    let updated = 0;
    let skipped = 0;

    for (const entry of entries) {
      const updates = {};
      const topic = entry.topic || '';
      const category = entry.category || 'General';

      // 1. Generate slug if missing
      if (!entry.slug) {
        updates.slug = generateSlug(topic);
      }

      // 2. Set topicType if missing
      if (!entry.topicType) {
        updates.topicType = guessTopicType(topic, entry.detailedContent);
      }

      // 3. Set difficulty if missing
      if (!entry.difficulty) {
        updates.difficulty = guessDifficulty(entry.detailedContent, entry.complexity);
      }

      // 4. Generate tags if empty
      if (!entry.tags || entry.tags.length === 0) {
        updates.tags = generateTags(topic, category);
      }

      // 5. Generate keywords if empty
      if (!entry.keywords || entry.keywords.length === 0) {
        updates.keywords = topic.toLowerCase().split(/[\s,&+/]+/).filter(w => w.length > 2);
      }

      // 6. Copy codeSnippets → implementations
      if (entry.codeSnippets?.length > 0 && (!entry.implementations || entry.implementations?.length === 0)) {
        updates.implementations = entry.codeSnippets;
      }

      // 7. Copy verifiedResources → furtherReading (if furtherReading is empty)
      if (entry.verifiedResources?.length > 0 && (!entry.furtherReading || entry.furtherReading?.length === 0)) {
        updates.furtherReading = entry.verifiedResources;
      }

      // 8. Set platform intelligence based on category
      const catInfo = INTERVIEW_CATEGORIES[category] || INTERVIEW_CATEGORIES['General'];
      if (entry.importanceScore === undefined) {
        updates.importanceScore = catInfo.importance;
      }
      if (!entry.interviewFrequency) {
        updates.interviewFrequency = catInfo.frequency;
      }
      if (entry.conceptWeight === undefined) {
        updates.conceptWeight = catInfo.weight;
      }

      // 9. Generate searchableText
      if (!entry.searchableText) {
        updates.searchableText = generateSearchableText({ ...entry, ...updates });
      }

      // 10. Calculate estimatedReadTime
      if (!entry.estimatedReadTime) {
        updates.estimatedReadTime = calculateReadTime(entry.detailedContent);
      }

      // 11. Initialize stats if missing
      if (!entry.stats) {
        updates.stats = { views: 0, completions: 0, avgReadTime: 0 };
      }

      // 12. Set defaults for missing fields
      if (entry.isPublished === undefined) {
        updates.isPublished = true;
      }
      if (entry.intuition === undefined) {
        updates.intuition = '';
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        await collection.updateOne({ _id: entry._id }, { $set: updates });
        console.log(`  ✅ ${topic}`);
        console.log(`     → slug: ${updates.slug || entry.slug || '(kept)'}`);
        console.log(`     → type: ${updates.topicType || entry.topicType || '(kept)'}, difficulty: ${updates.difficulty || entry.difficulty || '(kept)'}`);
        console.log(`     → importance: ${updates.importanceScore ?? entry.importanceScore ?? '?'}, frequency: ${updates.interviewFrequency || entry.interviewFrequency || '?'}`);
        console.log(`     → ${updates.tags?.length || 0} tags, ${updates.implementations?.length || 0} implementations migrated`);
        console.log('');
        updated++;
      } else {
        console.log(`  ⏭️  ${topic} (already up to date)`);
        skipped++;
      }
    }

    console.log('\n' + '═'.repeat(50));
    console.log(`🎉 Migration Complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total:   ${entries.length}`);
    console.log('═'.repeat(50));
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
