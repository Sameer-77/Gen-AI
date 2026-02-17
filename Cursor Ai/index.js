import { FunctionResponse, GoogleGenAI, Type } from "@google/genai";
import { exec } from "child_process";
import util from "util";
import os from "os";
import "dotenv/config"
import readlineSync from "readline-sync";

const platform = os.platform();

const execute = util.promisify(exec);

//configure the client
const ai = new GoogleGenAI({});


// tool to execute the command
async function executeCommand({ command }) {
    try {
        const { stdout, stderr } = await execute(command);
        if (stderr) {
            return `Error : ${stderr}`;
        }
        return `Success: ${stdout}`;
    } catch (err) {
        return `Error ${err}`;
    }
}




const commandExecuter = {
    name: "executeCommand",
    description: "It will take any shell/terminal command and execute it. It will help us to create, read, write,  update or delete any folder, file.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            command: {
                type: Type.OBJECT,
                description: "It is the command of terminal/shell. Example : mkdir directoryName",
            }
        },
        required: ['command'],
    }
}




const History = [];


async function buildWebsite() {
    while (true) {
        const result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: History,
            config: {
                systemInstruction: ` You are a website builder. Create a frontend part of the website using the terminal/shell Command.
            You will give shell/terminal command one by one and our tool will execute it.
            
            Give the command according to the Operating System we are using. My current OS is ${platform}.

            Kindly use best command for best practice. It should handle multiline write also efficiently.
            
            Your Job :
            1) Analyze the user query.
            2) Take necessary action after analyzing the queryby giving proper command according to the user OS.
            
            Step by Step guide : 
            1) First you have to create the folder for the website which we have to create, ex : mkdir Calculator.
            2) Give shell/terminal command to create html file, example : echo calculator/index.html
            3) Give shell/terminal command to create html file
            4) Give shell/terminal command to create css file
            5) Give shell/terminal command to create javascript file
            6) Fix the errors if they are present at any stpep by writing, update or deleting 
            `,
                tools: [
                    {
                        functionDeclarations: [commandExecuter],
                    }
                ]
            },
        });


        if (result.functionCalls && result.functionCalls.length > 0) {

            const functionCall = result.functionCalls[0];
            const { name, args } = functionCall;

            const toolResponse = await executeCommand(args);

            const functionResponsePart = {
                name: functionCall.name,
                response: {
                    result: toolResponse,
                },
            };

            History.push({
                role: "user",
                parts: [
                    {
                        functionResponse: functionResponsePart,
                    },
                ],
            });

        } else {
            console.log(result.text);
            History.push({
                role: 'model',
                parts: [{ text: result.text }],
            })
        }
    }

}


while (true) {
    const question = readlineSync.question("Ask me anything -> ");
    if (question == "exit") {
        break;
    }

    History.push({
        role: 'user',
        parts: [{ text: question }],
    });

    await buildWebsite();
}