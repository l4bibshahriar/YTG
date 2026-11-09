import { categories, styles, cleanHandle, sendJson, methodNotAllowed, getOpenAIClient } from "../lib/shared.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);

  try {
    const { category, style, words } = req.body || {};
    if (!categories.includes(category) || !styles.includes(style) || ![1, 2, 3].includes(Number(words))) {
      return sendJson(res, 400, { error: "Please choose a valid category, style, and word count." });
    }

    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "You are an expert YouTube channel branding strategist. Create memorable, pronounceable, original channel names. Return only valid JSON: an object with a names array of exactly 18 strings. Do not include @ symbols or explanations. Names must fit the requested word count, be suitable as channel display names, and avoid famous creator names or existing famous brands."
        },
        {
          role: "user",
          content: `Category: ${category}\nStyle: ${style}\nWords per name: ${Number(words)}\nGenerate 18 distinct YouTube channel name ideas.`
        }
      ]
    });

    const raw = response.output_text.trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    const parsed = JSON.parse(raw);
    const names = [...new Set((parsed.names || [])
      .map(cleanHandle)
      .filter(name => name.length >= 3 && name.length <= 30))].slice(0, 18);

    if (!names.length) return sendJson(res, 502, { error: "The AI did not return usable names. Please try again." });
    return sendJson(res, 200, { names });
  } catch (error) {
    console.error("Name generation error:", error);
    return sendJson(res, error.statusCode || 500, {
      error: error.statusCode === 503
        ? error.message
        : "Could not generate names right now. Check your Vercel function logs and try again."
    });
  }
}
