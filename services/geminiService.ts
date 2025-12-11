import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateEpicTaskDescription = async (taskTitle: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Ett viktigt uppdrag för familjens hjältar.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a short, funny, RPG-style quest description (max 2 sentences) in Swedish for a household chore titled: "${taskTitle}". Make it sound epic.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini gen error:", error);
    return "Ett legendariskt uppdrag väntar.";
  }
};

export const generateBossTaunt = async (monsterName: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Du kommer aldrig förbi mig!";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a very short (1 sentence) funny taunt in Swedish from a household monster named "${monsterName}" to a family member trying to clean up.`,
    });
    return response.text.trim();
  } catch (error) {
    return "Grrr! Stöket är mitt!";
  }
};