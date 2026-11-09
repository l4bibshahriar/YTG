import { sendJson, methodNotAllowed } from "../lib/shared.js";

export default function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, "GET");
  return sendJson(res, 200, { configured: Boolean(process.env.GEMINI_API_KEY) });
}
