import { categories, styles, cleanHandle, sendJson, methodNotAllowed, getOpenAIClient } from "../lib/shared.js";

function readRequestBody(body) {
  if (body && typeof body === "object") return body;
  if (typeof body === "string") {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return {};
}

function parseNames(content) {
  if (!content) return [];
  const cleaned = String(content)
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.names)) return parsed.names;
  } catch {
    // Fall back to extracting a JSON array if the model added surrounding text.
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* handled by returning an empty list below */ }
    }
  }
  return [];
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

    const client = getOpenAIClient();
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const completion = await client.chat.completions.create({
      model,
      temperature: 1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert YouTube channel branding strategist. Return one valid JSON object with a names array containing EXACTLY 10 distinct strings. No markdown and no explanations. Names must fit the requested word count, be memorable, pronounceable, original, and suitable as YouTube channel display names. Avoid famous creator names and existing famous brands. Do not number the names."
        },
        {
          role: "user",
          content: `Category: ${category}\nStyle: ${style}\nWords per name: ${wordCount}\nCreate exactly 10 different YouTube channel names. Return JSON in this format: {"names":["Name One", "Name Two"]}.`
        }
      ]
    });

    const content = completion.choices?.[0]?.message?.content;
    const rawNames = parseNames(content);
    const names = [...new Set(rawNames
      .filter(name => typeof name === "string")
      .map(cleanHandle)
      .filter(name => name.length >= 3 && name.length <= 30))].slice(0, 10);

    if (names.length !== 10) {
      console.error("AI returned fewer than 10 usable names:", { model, returned: rawNames.length, usable: names.length });
      return sendJson(res, 502, {
        error: "The AI returned fewer than 10 usable names. Please click Generate names to try again."
      });
    }

    return sendJson(res, 200, { names });
  } catch (error) {
    console.error("Name generation error:", error);
    const status = Number(error?.status || error?.statusCode) || 500;
    let message = "Name generation failed. Check your OpenAI API key, API billing/usage, model setting, and Vercel Function Logs.";

    if (status === 401) message = "OpenAI rejected the API key. Check OPENAI_API_KEY in Vercel and redeploy.";
    else if (status === 429) message = "OpenAI API quota or rate limit reached. Check API billing and usage in your OpenAI platform account.";
    else if (status === 400) message = `OpenAI rejected the request. Check OPENAI_MODEL in Vercel. Details: ${String(error?.message || "Bad request").slice(0, 220)}`;
    else if (status === 503) message = error.message;

    return sendJson(res, status >= 400 && status < 600 ? status : 500, { error: message });
  }
}
