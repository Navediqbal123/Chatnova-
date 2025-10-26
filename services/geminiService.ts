
import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse, Part } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateChatResponse = async (prompt: string, imageBase64?: string, mimeType?: string): Promise<string> => {
    try {
        const parts: Part[] = [{ text: prompt }];

        if (imageBase64 && mimeType) {
            parts.unshift({
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType,
                },
            });
        }
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: parts },
        });

        return response.text;
    } catch (error) {
        console.error("Error generating chat response:", error);
        return "Sorry, I encountered an error. Please try again.";
    }
};

export const processPassportPhoto = async (imageBase64: string, mimeType: string, removeBg: boolean): Promise<string> => {
    try {
        let prompt = "You are an expert passport photo processor. Upscale the subject's image to a high resolution (4K equivalent), enhancing clarity, lighting, and details to meet professional passport photo standards. Do not alter the subject's facial features.";

        if (removeBg) {
            prompt += " Meticulously remove the background, ensuring clean edges around the subject (hair, clothes). The output background must be transparent.";
        }
        prompt += " The final output must be a PNG image of the subject, cropped to a 1:1 aspect ratio focusing on the head and shoulders.";

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: imageBase64,
                            mimeType: mimeType,
                        },
                    },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

        if (imagePart && imagePart.inlineData) {
            return imagePart.inlineData.data;
        } else {
            throw new Error("No image data in Gemini response.");
        }

    } catch (error) {
        console.error("Error processing passport photo:", error);
        throw new Error("Failed to process the photo with AI. Please try again.");
    }
};
