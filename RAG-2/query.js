import readlineSync from 'readline-sync';
import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';



//configuration
const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'embedding-001', //'text-embedding-004',
    taskType: "RETRIEVAL_QUERY",
});


//Configure model
const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-1.5-flash',
    temperature: 0.3,
});




//Configure pinecone
const pinecone = new Pinecone();
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);




async function chatting(question) {

    //Creating embedding(vector) for the user-Question.
    const queryVector = await embeddings.embedQuery(question);



    //Searching that vector(embedding) in the vectorDB and return top-10
    const searchResults = await pineconeIndex.query({
        topK: 10,
        vector: queryVector,
        includeMetadata: true,
    });
    const context = searchResults.matches
        .map(match => match.metadata.text)
        .join("\n\n---\n\n");


    //Give those top 10+user-Question to the LLM
    // Step 4: Create a prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful assistant answering questions based on the provided documentation.

Context from the documentation:
{context}

Question: {question}

Instructions:
- Answer the question using ONLY the information from the context above
- If the answer is not in the context, say "I don't have enough information to answer that question."
- Be concise and clear
- Use code examples from the context if relevant

Answer:
        `);

    // Step 5: Create a chain (prompt → model → parser)
    const chain = RunnableSequence.from([
        promptTemplate,
        model,
        new StringOutputParser(),
    ]);

    // Step 6: Invoke the chain and get the answer
    const answer = await chain.invoke({
        context: context,
        question: question,
    });

    console.log(answer);

    //Output the answer returned by the LLM to user

}



async function main() {
    while (true) {
        const userProblem = readlineSync.question("\nAsk me anything (or type 'exit')--> ");

        if (userProblem.toLowerCase() === 'exit') {
            console.log("Goodbye!");
            break;
        }

        try {
            await chatting(userProblem);
        } catch (error) {
            console.error("An error occurred:", error.message);
        }
    }
}


main();