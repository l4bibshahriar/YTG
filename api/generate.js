import { GoogleGenAI } from "@google/genai";
import { categories, styles, cleanHandle, sendJson, methodNotAllowed, getGeminiClient } from "../lib/shared.js";

function readRequestBody(body) {
  if (body && typeof body === "object") return body;
  if (typeof body === "string") {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return {};
}

function parseNames(content) {
  if (!content) return [];
  const cleaned = String(content).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.names)) return parsed.names;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed.names)) return parsed.names;
      } catch { /* return empty below */ }
    }
  }
  return [];
}

function errorMessage(error) {
  const status = Number(error?.status || error?.statusCode || error?.code) || 500;
  const detail = String(error?.message || "Unknown Gemini API error").slice(0, 240);
  if (status === 401 || status === 403) return { status, message: "Gemini rejected the API key. Check GEMINI_API_KEY in Vercel and redeploy." };
  if (status === 429) return { status, message: "Gemini API rate limit or free-tier quota reached. Wait for the quota to reset, or check your Google AI Studio usage limits." };
  if (status === 400) return { status, message: `Gemini rejected the request. Check the model setting. Details: ${detail}` };
  return { status: status >= 400 && status < 600 ? status : 500, message: `Gemini name generation failed: ${detail}` };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);

  try {
    const body = readRequestBody(req.body);
    const { category, style, words } = body;
    const wordCount = Number(words);

    if (!categories.includes(category) || !styles.includes(style) || ![1, 2, 3].includes(wordCount)) {
      return sendJson(res, 400, { error: "Please choose a valid category, style, and word count." });
    }

    const apiKey = getGeminiClient();
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
    const response = await ai.models.generateContent({
      model,
      contents: `Create exactly 10 distinct, memorable, pronounceable YouTube channel names. Category: ${category}. Style: ${style}. Each name must contain exactly ${wordCount} word(s). Avoid famous creator names and existing famous brands. Return only a JSON object in this format: {"names":["Name One","Name Two"]}. The names array must contain exactly 10 strings.`,
      config: {
        temperature: 1,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            names: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["names"]
        }
      }
    });

    const rawNames = parseNames(response.text);
    const names = [...new Set(rawNames
      .filter(name => typeof name === "string")
      .map(cleanHandle)
      .filter(name => name.length >= 3 && name.length <= 30))].slice(0, 10);

    if (names.length !== 10) {
      console.error("Gemini returned fewer than 10 usable names:", { model, returned: rawNames.length, usable: names.length });
      return sendJson(res, 502, { error: "Gemini returned fewer than 10 usable names. Please click Generate names to try again." });
    }

    return sendJson(res, 200, { names });
  } catch (error) {
    console.error("Gemini name generation error:", error);
    const result = errorMessage(error);
    return sendJson(res, result.status, { error: result.message });
  }
}
