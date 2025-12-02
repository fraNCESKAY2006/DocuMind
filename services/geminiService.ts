import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LocalDocument, ToolType } from "../types";

export const analyzeDocument = async (
  file: LocalDocument,
  toolType: ToolType,
  customQuery?: string
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found in environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Determine prompt based on tool
    let systemInstruction = "You are a helpful document analysis assistant. Provide clear, concise, and accurate responses.";
    let userPrompt = "";

    switch (toolType) {
      case ToolType.SUMMARY:
        userPrompt = "Please provide a comprehensive summary of this document. Capture the main points, key arguments, and conclusions. Use bullet points for readability.";
        break;
      case ToolType.KEYWORDS:
        userPrompt = "Extract the top 10 most important keywords and concepts from this document. Format them as a list of tags.";
        break;
      case ToolType.CITATION:
        userPrompt = "Generate a bibliographic citation for this document in APA, MLA, and Chicago styles. If author/date details are missing, infer them from context or mark them as [Unknown].";
        break;
      case ToolType.INSIGHTS:
        userPrompt = "Analyze this document and provide 3-5 deep insights or strategic takeaways. What are the implications of this information? What is the subtext?";
        break;
      case ToolType.WRITER:
        userPrompt = "Based on the style and content of this document, write a follow-up paragraph or a concluding remark that would fit naturally at the end.";
        break;
      case ToolType.QA:
        userPrompt = customQuery || "What is the main topic of this document?";
        break;
    }

    const parts: any[] = [];

    // Prioritize sending raw text if available (for code, markdown, txt, etc.)
    if (typeof file.text === 'string') {
      parts.push({
        text: `Document Content:\n${file.text}`
      });
    } else {
      // Handle binary files (PDFs, Images)
      const supportedMimeTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg', 
        'image/webp', 
        'image/heic', 
        'image/heif'
      ];

      // Clean mime type check
      let mimeType = file.type;
      // Handle edge cases where browser might give specific jpeg variants
      if (mimeType === 'image/jpg') mimeType = 'image/jpeg';

      if (!supportedMimeTypes.includes(mimeType)) {
        throw new Error(`The file type "${file.type}" is not supported for AI analysis. Please use PDF, PNG, JPEG, WEBP, or text files.`);
      }

      // Extract base64 data
      const base64Data = file.content.split(',')[1] || file.content;
      
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    // Add the user prompt
    parts.push({ text: userPrompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4, // Lower temperature for more analytical/factual responses
      }
    });

    return response.text || "No response generated.";

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Return a user-friendly error message if we caught our own validation error or API error
    if (error.message.includes("not supported")) {
      throw error; // Re-throw our validation error
    }
    throw new Error(error.message || "Failed to analyze document.");
  }
};