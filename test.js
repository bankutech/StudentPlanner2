import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyA4aIJgb1GNi9549MYryySgRluThIazAxw" });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello",
    });
    console.log(response.text);
  } catch(e) {
    console.error("ERROR:");
    console.error(e.message);
  }
}
run();
