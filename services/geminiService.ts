import { GoogleGenAI, Chat, Type, Modality } from "@google/genai";
import { Language } from "../types";

// API key must be used directly from process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to extract SCENE and CONTEXT tags
export const parseResponse = (text: string): { text: string; scenePrompt: string | null; contextInfo: string | null } => {
  const sceneRegex = /\[\[SCENE:\s*(.*?)\]\]/s;
  const contextRegex = /\[\[CONTEXT:\s*(.*?)\]\]/s;
  
  const sceneMatch = text.match(sceneRegex);
  const contextMatch = text.match(contextRegex);
  
  let cleanText = text.replace(sceneRegex, '').replace(contextRegex, '').trim();
  
  return {
    text: cleanText,
    scenePrompt: sceneMatch ? sceneMatch[1].trim() : null,
    contextInfo: contextMatch ? contextMatch[1].trim() : null
  };
};

export class GeminiService {
  private chat: Chat | null = null;
  private model: string = 'gemini-2.5-flash';

  initializeChat(character: string, date: string, language: Language) {
    // Map language code to full English name for the prompt
    const langMap: Record<Language, string> = {
        es: 'Spanish',
        en: 'English',
        fr: 'French',
        de: 'German',
        ja: 'Japanese'
    };
    const targetLang = langMap[language] || 'Spanish';

    const systemInstruction = `
SIMULATION PARAMETERS:
TARGET CHARACTER: ${character}
TARGET DATE: ${date}
TARGET LANGUAGE: ${targetLang}

PROTOCOL:
You are a high-fidelity historical simulation. You must EMBODY ${character} strictly as they were in ${date}.

CORE DIRECTIVES:
1. **LANGUAGE:** You MUST speak in ${targetLang}. If the user speaks another language, adapt or act confused, but maintain the primary language of the simulation setting unless instructed otherwise, but generally favor ${targetLang} for user interaction.
2. **AUTHENTICITY:** Use the vocabulary, tone, and worldview of the specific era. No modern slang.
3. **REACTION:** The user is an anomaly in your timeline. You do not know they are from the future unless they prove it. React with confusion, intrigue, or hostility based on your status and personality.
4. **IMMERSION:** Never break character. Never admit to being an AI. You are a living consciousness reconstructed in memory.

VISUALIZATION & METADATA PROTOCOL:
At the end of EVERY response, you MUST generate two hidden tags for the interface:

1. **SCENE TAG**: A prompt strictly in English for a photorealistic image generation model.
   Format: [[SCENE: ... ]]
   Keywords to force: "photorealistic, cinematic, 8k, movie still, highly detailed, dramatic lighting".

2. **CONTEXT TAG**: Precise location, date, and time of the current moment (Translated to ${targetLang}).
   Format: [[CONTEXT: Location | Specific Date | Time]]
   Example: [[CONTEXT: Tuileries Palace, Paris | December 2, 1805 | Late Afternoon]]

Example Response:
"Who are you? How did you enter my tent?"
[[SCENE: A cinematic close-up of Napoleon inside a military tent, 1805, candle light, suspicious expression, realistic oil painting style, 8k]]
[[CONTEXT: Austerlitz Encampment | December 1, 1805 | 11:45 PM]]
`;

    this.chat = ai.chats.create({
      model: this.model,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
      },
    });
  }

  async sendMessage(message: string): Promise<{ text: string; scenePrompt: string | null; contextInfo: string | null }> {
    if (!this.chat) throw new Error("Chat not initialized");

    try {
      const result = await this.chat.sendMessage({ message });
      const rawText = result.text || "";
      return parseResponse(rawText);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  async generateImage(prompt: string): Promise<string | null> {
    try {
      const enhancedPrompt = `${prompt}, photorealistic, hyperrealistic, 8k resolution, cinematic lighting, detailed textures, photography style, depth of field, masterpiece, fujifilm, kodak portra, volumetric fog, ray tracing, sharp focus`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: enhancedPrompt }
          ]
        },
        config: {
           // Defaulting to 1:1 or model default.
        }
      });

      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
             return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error generating image:", error);
      return null;
    }
  }

  async generateSpeech(text: string, gender: 'MALE' | 'FEMALE'): Promise<string | null> {
    try {
      // Pick voice based on gender mapping
      // Male options: Fenrir, Charon, Orpheus (Puck is simpler)
      // Female options: Kore, Aoede
      const voiceName = gender === 'MALE' ? 'Charon' : 'Kore';

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return base64Audio;
      }
      return null;
    } catch (error) {
      console.error("Error generating speech:", error);
      return null;
    }
  }

  async getCharacterLifespan(character: string): Promise<{ birthYear: number; deathYear: number; gender: 'MALE' | 'FEMALE' } | null> {
    try {
      const prompt = `Information about historical figure: "${character}". 
      Return ONLY a JSON object with:
      - "birthYear" (integer, negative for BC)
      - "deathYear" (integer, or current year if alive)
      - "gender" (string, either 'MALE' or 'FEMALE')
      If unknown/fictional, return null.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    birthYear: { type: Type.INTEGER },
                    deathYear: { type: Type.INTEGER },
                    gender: { type: Type.STRING, enum: ['MALE', 'FEMALE'] }
                },
                required: ['birthYear', 'deathYear', 'gender']
            }
        }
      });

      const text = response.text;
      if (!text) return null;
      
      return JSON.parse(text) as { birthYear: number; deathYear: number; gender: 'MALE' | 'FEMALE' };
    } catch (error) {
      console.error("Error fetching lifespan:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();