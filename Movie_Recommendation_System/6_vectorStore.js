// =====================================================================
// 6_vectorStore.js — STEP 4: Movie Text → Embedding → Pinecone
// =====================================================================
//
// Vector DB stores MEANING, not facts.
// It answers:  "Movies LIKE this" ✅
// It does NOT: "Who directed this?" ❌ (that's Neo4j's job)
//
// How embeddings work:
//   Text → Gemini → [0.3, 0.8, 0.1, ...] (768 numbers)
//   Similar texts → similar numbers → close in space
//
// Each movie becomes one vector with metadata in Pinecone.
// Pinecone index must have: dimensions=768, metric=cosine
// =====================================================================

import { embedTexts, pineconeIndex } from "./2_config.js";
import fs from "fs";
import PDFParser from "pdf-parse";
import pdf from "pdf-parse";

// Create a clean text description for embedding
// Raw PDF text has noise. Clean text embeds better.
function createEmbeddingText(entity) {
    const parts = [
        `${entity.movie.title} is a ${entity.genres.join(", ")} movie released in ${entity.movie.year}.`,
        `Directed by ${entity.director.name}.`,
        `Starring ${entity.actors.join(", ")}.`,
        `The movie explores themes of ${entity.themes.join(", ")}.`,
    ];
    if (entity.awards.length > 0) {
        parts.push(`Awards: ${entity.awards.join(", ")}.`);
    }
    return parts.join(" ");
}

// Store all movie embeddings in Pinecone
/*
async function buildVectorStore(entities) {
    console.log(`\n📐 Building vector store for ${entities.length} movies...\n`);

    const batchSize = 50;

    for (let i = 0; i < entities.length; i += batchSize) {
        const batch = entities.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(entities.length / batchSize);

        console.log(`   📦 Embedding batch ${batchNum}/${totalBatches}...`);

        // Create clean texts
        const texts = batch.map((entity) => createEmbeddingText(entity));

        // Get 768-dim vectors from Gemini
        const vectors = await embedTexts(texts);

        // Prepare Pinecone records
        const records = batch.map((entity, idx) => ({
            id: entity.movie.title.replace(/\s+/g, "-").toLowerCase(),
            values: vectors[idx],
            metadata: {
                title: entity.movie.title,
                year: entity.movie.year,
                director: entity.director.name,
                genres: entity.genres.join(", "),
                themes: entity.themes.join(", "),
                actors: entity.actors.join(", "),
                text: texts[idx],
            },
        }));

        // Upsert (update + insert) to Pinecone
        await pineconeIndex.upsert(records);

        if (i + batchSize < entities.length) {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }

    const stats = await pineconeIndex.describeIndexStats();
    console.log(`\n✅ Vector store built! Total vectors: ${stats.totalRecordCount}`);
}

*/



async function buildVectorStore(pdfPath) {
    // 1. Read PDF and extract raw text
    const dataBuffer = fs.readFileSync(pdfPath);
    // Note: Ensure the import matches (e.g., import pdf from 'pdf-parse')
    const data = await pdf(dataBuffer);
    const fullText = data.text;

    // 2. Split text into chunks
    const rawChunks = [];
    const chunkSize = 1000;
    const overlap = 200;

    for (let i = 0; i < fullText.length; i += (chunkSize - overlap)) {
        rawChunks.push(fullText.substring(i, i + chunkSize));
    }

    // --- CHANGE 1: Filter out empty strings/whitespace ---
    // This prevents Pinecone from receiving "empty" vectors
    const chunks = rawChunks.map(c => c.trim()).filter(c => c.length > 0);

    console.log(`\n📐 Creating ${chunks.length} sanitized text chunks from PDF...`);

    // 3. Batch and Embed
    const batchSize = 20;
    for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        if (batch.length === 0) continue;

        console.log(`   📦 Embedding batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(chunks.length / batchSize)}...`);

        try {
            const vectors = await embedTexts(batch);

            // Safety check: Ensure Gemini actually returned vectors
            if (!vectors || vectors.length === 0) {
                throw new Error("Gemini returned empty vectors.");
            }

            const records = batch.map((text, idx) => ({
                id: `chunk-${Date.now()}-${i + idx}`,
                values: vectors[idx],
                metadata: {
                    source: pdfPath,
                    text: text
                },
            }));

            await pineconeIndex.upsert(records);

            // --- THE FIX: Add a delay to avoid 429 Rate Limit ---
            // For Gemini Free Tier, a 2-3 second delay between batches 
            // of 20 chunks usually keeps you safe.
            if (i + batchSize < chunks.length) {
                console.log("   ⏳ Cooling down (3s) to avoid Rate Limits...");
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }

        } catch (error) {
            console.error(`   ❌ Batch failed:`, error.message);
            // Wait longer if we hit a rate limit before trying next batch
            if (error.message.includes("429")) {
                console.log("   🚨 Rate limit hit! Waiting 15s...");
                await new Promise((resolve) => setTimeout(resolve, 15000));
            }
        }
    }

    console.log("✅ Vector store built from raw PDF text!");
}


export { buildVectorStore, createEmbeddingText };