import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyBJMJCYREzFj8QRW1mO_OK2TQSgnBDf5fc" });

async function main() {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            {
                role: "user",
                parts: [{ text: "Explain what is an array in a few words" }]
            },
        ],
    });
    console.log(response.text);
}

await main();