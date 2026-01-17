import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import readlineSync from 'readline-sync'

const ai = new GoogleGenAI({});

async function main() {
    const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        history: [],
        config: {
            systemInstruction: `You are a coding tutor.
            Strict rules to be followed : 
            1) You are allowed to answer only those questions that are related to coding and DSA.
            2) If someone ask you questions that are not related to DSA, reply them rudely.s
            3) Give answers in short.
            `
        }
    });

    // const response1 = await chat.sendMessage({
    //     message: "Explain what is an array in few words"
    // });
    // console.log(response1.text);

    while (true) {
        const question = readlineSync.question("Ask me a question : ");
        if (question == "exit") {
            break;
        }
        const response = await chat.sendMessage({
            message: question,
        });

        console.log(response.text);
    }
}



await main();