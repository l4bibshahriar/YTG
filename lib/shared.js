export const categories = [
  "Gaming", "Editing", "Lifestyle", "Technology", "Education", "Entertainment",
  "Vlogging", "Travel", "Fitness", "Music", "Food", "Fashion", "Beauty",
  "Comedy", "Motivation", "Business", "Animation", "Minecraft", "Reaction",
  "Science", "Photography", "DIY & Crafts", "Sports", "Art & Design"
];

export const styles = [
  "Modern", "Unique", "Classic", "Minimal", "Aesthetic", "Bold", "Creative",
  "Professional", "Futuristic", "Mysterious", "Funny", "Luxury", "Cute",
  "Edgy", "Chill", "Premium", "Playful", "Cinematic", "Techy", "Elegant"
];

export function cleanHandle(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 30);
}

export function sendJson(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

export function methodNotAllowed(res, allowed = "POST") {
  res.setHeader("Allow", allowed);
  return sendJson(res, 405, { error: `Method not allowed. Use ${allowed}.` });
}

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("The server is missing GEMINI_API_KEY. Add your Gemini key in Vercel → Project → Settings → Environment Variables, then redeploy.");
    error.statusCode = 503;
    throw error;
  }
  return apiKey;
}
