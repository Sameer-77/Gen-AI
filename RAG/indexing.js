import * as dotenv from 'dotenv';
dotenv.config();
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from "@langchain/pinecone";

async function indexing() {
    try {
        console.log("📂 Loading PDF...");
        const loader = new PDFLoader("./Node.pdf");
        const docs = await loader.load();

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const splitDocs = await splitter.splitDocuments(docs);
        const validDocs = splitDocs.filter(d => d.pageContent.trim().length > 0);
        console.log(`✂️ Processing ${validDocs.length} valid chunks.`);

        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            model: "gemini-embedding-001",
            // We let it default to 3072 to match your new index
        });

        // --- THE DEBUG TEST ---
        console.log("🧪 Testing first chunk embedding...");
        const testVector = await embeddings.embedQuery(validDocs[0].pageContent);
        console.log(`📏 Verified Vector Length: ${testVector.length}`);

        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

        console.log("🤖 Initializing Pinecone Store...");
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index,
            textKey: "text",
        });

        const batchSize = 20;
        for (let i = 0; i < validDocs.length; i += batchSize) {
            const batch = validDocs.slice(i, i + batchSize);
            await vectorStore.addDocuments(batch);
            console.log(`✅ Indexed chunks ${i + 1} to ${Math.min(i + batchSize, validDocs.length)}`);
        }

        console.log("🏁 All chunks indexed successfully!");

    } catch (error) {
        console.error("❌ FAILED:", error.message);
    }
}

indexing();