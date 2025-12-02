import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LocalDocument, ToolType } from "../types";

// Helper to get mime type for Gemini
const getMimeType = (file: LocalDocument): string => {
  if (file.type === 'application/pdf') return 'application/pdf';
  if (file.type.startsWith('image/')) return file.type;
  if (file.type === 'text/markdown' || file.name.endsWith('.md')) return 'text/plain';
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) return 'text/plain';
  return file.type;
};

// --------------
// NEW: chunk text
// --------------
const chunkText = (text: string, maxChunkSize = 8000): string[] => {
  const chunks: string[] = [];
  let current = 0;

  while (current < text.length) {
    chunks.push(text.slice(current, current + maxChunkSize));
    current += maxChunkSize;
  }
  return chunks;
};

export const analyzeDocument = async (
  file: LocalDocument,
  toolType: ToolType,
  customQuery?: string
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found.");

    const ai = new GoogleGenAI({ apiKey });

    // Determine system + user prompt
    let systemInstruction = "You are a helpful document analysis assistant. Provide clear, concise, and accurate responses.";
    let userPrompt = "";

    switch (toolType) {
      case ToolType.SUMMARY:
        userPrompt = "Please provide a comprehensive summary of this document chunk. Capture the main points, key arguments, and conclusions.";
        break;
      case ToolType.KEYWORDS:
        userPrompt = "Extract the 10 most important keywords from this document chunk. Output tags only.";
        break;
      case ToolType.CITATION:
        userPrompt = "Generate a bibliographic citation for this document chunk if possible.";
        break;
      case ToolType.INSIGHTS:
        userPrompt = "Analyze this text chunk and provide key insights or strategic takeaways.";
        break;
      case ToolType.WRITER:
        userPrompt = "Write a concluding remark based on this document chunk.";
        break;
      case ToolType.QA:
        userPrompt = customQuery || "What is the main topic of this document chunk?";
        break;
    }

    const mimeType = getMimeType(file);

    // -------------------------------------------
    // If content is non-text (PDF, images), proceed normally
    // -------------------------------------------
    const isText = mimeType === "text/plain";

    if (!isText) {
      const base64Data = file.content.split(',')[1] || file.content;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: userPrompt }
          ]
        },
        config: {
          systemInstruction,
          temperature: 0.4,
        }
      });

      return response.text || "No response generated.";
    }

    // -------------------------------------------
    // TEXT MODE → CHUNKING ENABLED
    // -------------------------------------------
    const fullText = atob(file.content.split(',')[1] || file.content);

    const chunks = chunkText(fullText, 8000);

    const partialResults: string[] = [];

    for (const chunk of chunks) {
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ text: `${userPrompt}\n\n---\nCHUNK:\n${chunk}` }],
        config: {
          systemInstruction,
          temperature: 0.4,
        }
      });

      partialResults.push(res.text || "");
    }

    // -------------------------------------------
    // (Optional) FINAL SYNTHESIS PASS
    // Combine chunk results into a final answer
    // -------------------------------------------
    const finalResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        text: `Here are analyses from multiple chunks:\n\n${partialResults.join(
          "\n\n---\n\n"
        )}\n\nPlease synthesize this into a single final answer.`
      }],
      config: {
        systemInstruction: "You are a summarizer merging chunk analyses.",
        temperature: 0.3,
      }
    });

    return finalResponse.text || partialResults.join("\n\n");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to analyze document.");
  }
};
