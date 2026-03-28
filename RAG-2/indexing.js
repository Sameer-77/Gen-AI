import * as dotenv from 'dotenv';
dotenv.config();
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from "@langchain/pinecone";

// -------------------------------- Indexing ----------------------------------
async function indexing() {

    //Load the file
    const PDF_PATH = './dsa.pdf';
    const pdfLoader = new PDFLoader("./Node.pdf");
    const rawDocs = await pdfLoader.load();
    //console.log(rawDocs.length);
    //console.log(rawDocs);



    // ------------------------ Chunking -----------------------------------------
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const chunkedDocs = await textSplitter.splitDocuments(rawDocs);
    //console.log(chunkedDocs);





    //-------------------------------------- Embedding -----------------------------------------

    //Configure Embedding.
    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        model: 'text-embedding-004',
        //taskType: "retrieval_document",
    });
    //console.log(embeddings);


    //Configure Pinecone
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);


    //Embed Chunks and Upload to Pinecone
    //Single step => ChunkedDocs -> Embeddings -> Vector DB
    await PineconeStore.fromDocuments(chunkedDocs, embeddings, {
        pineconeIndex,
        maxConcurrency: 5,
    });



}

indexing();