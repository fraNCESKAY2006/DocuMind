import { GoogleGenAI, Type } from "@google/genai";
import type { SummaryTone, CitationStyle } from '../types';

let ai: GoogleGenAI | null = null;

/**
 * Lazily initializes and returns the GoogleGenAI client instance.
 * Throws an error if the API key is not configured.
 */
const getAiClient = (): GoogleGenAI => {
  if (ai) {
    return ai;
  }
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    throw new Error("API_KEY environment variable is not set. Please configure it to use AI features.");
  }
  ai = new GoogleGenAI({ apiKey: API_KEY });
  return ai;
};


export const summarizeText = async (text: string, tone: SummaryTone): Promise<string> => {
  const client = getAiClient();
  if (!text) return "";
  const prompt = `Summarize the following document in a concise, structured overview with a ${tone} tone. Use markdown for formatting:\n\n---\n\n${text}`;
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text;
};

export const extractKeywords = async (text: string): Promise<string[]> => {
  const client = getAiClient();
  if (!text) return [];
  const prompt = `Extract the most important key phrases and concepts from the following document. Return a JSON array of strings. For example: ["React development", "AI integration", "UI/UX design"].\n\n---\n\n${text}`;
   const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
     config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        }
      }
    }
  });

  try {
    const keywords = JSON.parse(response.text.trim());
    return Array.isArray(keywords) ? keywords : [];
  } catch (error) {
    console.error("Failed to parse keywords JSON:", error);
    return [];
  }
};

export const generateCitation = async (text: string, style: CitationStyle): Promise<string> => {
  const client = getAiClient();
  if (!text) return "";
  const prompt = `Based on the following document, generate a citation in ${style} format. If the document is not a citable source, state that. \n\n---\n\n${text}`;
   const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text;
};


export const getInsights = async (text: string): Promise<{ readability: string; density: { keyword: string; density: number }[] }> => {
  const client = getAiClient();
  if (!text) return { readability: "N/A", density: [] };
  const prompt = `Analyze the following text and provide:
1. A Flesch-Kincaid readability grade level (e.g., "Grade 10").
2. The top 5 keywords and their density as a percentage.

Return the result as a JSON object with keys "readability" and "density". The "density" value should be an array of objects, each with "keyword" and "density" keys. For example:
{
  "readability": "Grade 11",
  "density": [
    {"keyword": "technology", "density": 2.5},
    {"keyword": "innovation", "density": 1.8}
  ]
}

---
TEXT TO ANALYZE:
${text}
---
`;
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    readability: { type: Type.STRING },
                    density: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                keyword: { type: Type.STRING },
                                density: { type: Type.NUMBER }
                            },
                            required: ['keyword', 'density']
                        }
                    }
                },
                required: ['readability', 'density']
            }
        }
    });

  try {
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Failed to parse insights:", error);
    return { readability: "Error", density: [] };
  }
};


export const processWithAIWriter = async (text: string, action: 'rewrite' | 'expand' | 'fix' | 'academic'): Promise<string> => {
  const client = getAiClient();
  if(!text) return "";
  let instruction = '';
  switch(action) {
    case 'rewrite':
      instruction = 'Rewrite the following text to improve clarity and engagement:';
      break;
    case 'expand':
      instruction = 'Expand on the following text, adding more detail and context:';
      break;
    case 'fix':
      instruction = 'Fix any grammar and spelling mistakes in the following text:';
      break;
    case 'academic':
      instruction = 'Rephrase the following text to use more formal and academic language:';
      break;
  }
  const prompt = `${instruction}\n\n---\n\n${text}`;
   const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text;
};

export const answerQuestion = async (documentText: string, question: string): Promise<string> => {
  const client = getAiClient();
  if (!documentText || !question) return "Please provide a document and a question.";
  const prompt = `Based on the document provided below, answer the following question. If the answer is not in the document, say so.\n\nDOCUMENT:\n---\n${documentText}\n---\n\nQUESTION: ${question}`;
  const response = await client.models.generateContent({
    model: 'gemini-2.5-pro', // Pro for better reasoning on Q&A
    contents: prompt,
  });
  return response.text;
};