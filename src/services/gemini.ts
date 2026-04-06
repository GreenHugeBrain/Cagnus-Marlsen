import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client
// Note: In a real app, you might want to handle the API key more securely,
// but for this AI Studio environment, it's injected via process.env.
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Gemini API key is missing. Please set it in the environment.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

export async function explainMove(fen: string, move: string, evalScore: number | string, previousEval: number | string): Promise<string> {
  try {
    const ai = getAiClient();
    
    const prompt = `
You are an expert chess coach. Explain a chess move to a beginner/intermediate player.
Keep the explanation concise (2-3 sentences max). Focus on the key ideas: control, development, safety, or tactics.

Current Position (FEN): ${fen}
Move Played: ${move}
Evaluation Before Move: ${previousEval}
Evaluation After Move: ${evalScore}

Explain why this move is good, bad, or interesting based on the evaluation change.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "I couldn't generate an explanation for this move.";
  } catch (error) {
    console.error("Error generating move explanation:", error);
    return "Sorry, there was an error generating the explanation. Please check your API key.";
  }
}
