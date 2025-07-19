
import { GoogleGenAI } from "@google/genai";
import { InventoryItem } from '../types';

const apiKey = "AIzaSyCIhBSAinrslphItiVw1dv2nnyYrDwEcaw";
if (!apiKey) {
    console.error("Gemini API key not found. Please set the GEMINI_API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const generateInventoryInsights = async (items: InventoryItem[], prompt: string): Promise<string> => {
    if (!apiKey) {
        return "Gemini API key is not configured. Please contact your administrator.";
    }

    try {
        const model = "gemini-2.5-flash";

        const inventorySummary = items.length > 0 
            ? items.map(item => 
                `Item: ${item.name}, Category: ${item.category}, Quantity: ${item.quantity}, Price: ${item.price}`
              ).join('\n')
            : "No inventory data available.";
        
        const fullPrompt = `
You are an expert inventory management assistant called InventoFlow AI.
Based on the following inventory data, please answer the user's question.
Be insightful, concise, and friendly. If the user asks a general question not related to inventory, politely decline.

Inventory Data:
---
${inventorySummary}
---

User Question: "${prompt}"
        `;

        const result = await ai.models.generateContent({
            model: model,
            contents: fullPrompt,
        });

        return result.text;
    } catch (error) {
        console.error("Error generating insights from Gemini:", error);
        return "Sorry, I encountered an error while generating insights. The API may be unavailable or the request could not be processed. Please check the console for details.";
    }
};
