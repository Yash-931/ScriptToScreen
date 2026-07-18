import { GoogleGenAI } from "@google/genai";
import { SCRIPT_BREAKDOWN_SYSTEM_PROMPT } from "./config/prompts";

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT,
  location: "us-central1",
});

interface StoryboardSceneSchema {
  sceneNumber: number;
  charactersInScene: string[];
  imagePrompt: string;
  caption: string;
}

export async function scriptBreakdown(script: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: script,
    config: {
      systemInstruction: SCRIPT_BREAKDOWN_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "OBJECT",
        properties: {
          scenes: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                sceneNumber: { type: "INTEGER" },
                charactersInScene: { type: "ARRAY", items: { type: "STRING" } },
                imagePrompt: { type: "STRING" },
                caption: { type: "STRING" },
              },
              required: [
                "sceneNumber",
                "charactersInScene",
                "imagePrompt",
                "caption",
              ],
            },
          },
        },
        required: ["scenes"],
      },
    },
  });

  const responseText = response.text;

  if (!responseText) {
    throw new Error("Gemini script breakdown pipeline failed");
  }
  console.log("Script breakdown success!")
  return JSON.parse(responseText) as StoryboardSceneSchema;
}
