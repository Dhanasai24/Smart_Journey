import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

class SmartAIService {
  constructor() {
    // Gemini API Key
    this.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.geminiClient = new GoogleGenerativeAI(this.geminiApiKey);

    // Gemini models in priority order
    this.geminiModels = [
      "gemini-2.0-flash-lite",
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-2.5-pro"
    ];

    // DeepSeek API Keys
    this.deepseekApiKey1 = import.meta.env.VITE_DEEPSEEK_API_KEY1;
    this.deepseekApiKey2 = import.meta.env.VITE_DEEPSEEK_API_KEY2;
    this.deepseekModel = "deepseek/deepseek-r1:free";

    // GPT-4o (OpenRouter)
    this.gptApiKey = "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";
    this.gptModel = "openai/gpt-4o";
    this.baseUrl = "https://openrouter.ai/api/v1/chat/completions";

    // Metadata
    this.referer = "http://localhost:3000";
    this.title = "Smart Journey AI Trip Planner";
  }

  // Try Gemini Models in Order
  async tryGeminiModels(prompt) {
    for (const modelName of this.geminiModels) {
      try {
        const model = this.geminiClient.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (text) {
          console.log(`✅ Gemini responded using: ${modelName}`);
          return text;
        }
      } catch (err) {
        console.warn(`❌ Gemini model ${modelName} failed:`, err.message);
      }
    }
    return null;
  }

  // Get AI response (fallback order: Gemini > DeepSeek > GPT-4o)
  async getResponse(prompt) {
    // 1. Try Gemini Models
    const geminiResponse = await this.tryGeminiModels(prompt);
    if (geminiResponse) return geminiResponse;

    // 2. DeepSeek (Key 1)
    try {
      const res1 = await axios.post(
        this.baseUrl,
        {
          model: this.deepseekModel,
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${this.deepseekApiKey1}`,
            "Content-Type": "application/json",
            Referer: this.referer,
            "X-Title": this.title,
          },
        }
      );
      return res1.data.choices[0].message.content;
    } catch (err1) {
      console.warn("❌ DeepSeek Key 1 failed:", err1.response?.data || err1.message);
    }

    // 3. DeepSeek (Key 2)
    try {
      const res2 = await axios.post(
        this.baseUrl,
        {
          model: this.deepseekModel,
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${this.deepseekApiKey2}`,
            "Content-Type": "application/json",
            Referer: this.referer,
            "X-Title": this.title,
          },
        }
      );
      return res2.data.choices[0].message.content;
    } catch (err2) {
      console.warn("❌ DeepSeek Key 2 failed:", err2.response?.data || err2.message);
    }

    // 4. GPT-4o (Final fallback)
    try {
      const gptRes = await axios.post(
        this.baseUrl,
        {
          model: this.gptModel,
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${this.gptApiKey}`,
            "Content-Type": "application/json",
            Referer: this.referer,
            "X-Title": this.title,
          },
        }
      );
      return gptRes.data.choices[0].message.content;
    } catch (gptErr) {
      console.error("❌ GPT-4o failed:", gptErr.response?.data || gptErr.message);
      return "❌ AI failed to generate a response. Please try again later.";
    }
  }
}

export default new SmartAIService();
