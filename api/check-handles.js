import { cleanHandle, sendJson, methodNotAllowed } from "../lib/shared.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const handles = Array.isArray(req.body?.handles) ? req.body.handles : [];
  if (!handles.length || handles.length > 10) {
    return sendJson(res, 400, { error: "Send between 1 and 10 handles." });
  }

  const results = await Promise.all(handles.map(async raw => {
    const handle = cleanHandle(raw);
    if (handle.length < 3) {
      return { handle, status: "invalid", message: "Handle must be at least 3 characters." };
    }

    try {
      const response = await fetch(`https://www.youtube.com/@${encodeURIComponent(handle)}`, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; YTNamesGenerator/1.1)" },
        signal: AbortSignal.timeout(7000)
      });

      if (response.status === 404) {
        return { handle, status: "possible", message: "YouTube returned 404; this may be available, but it is not guaranteed." };
      }
      if (response.ok) {
        return { handle, status: "taken", message: "YouTube returned a channel page." };
      }
      return { handle, status: "unknown", message: `YouTube returned status ${response.status}.` };
    } catch {
      return { handle, status: "unknown", message: "YouTube could not be reached or timed out." };
    }
  }));

  return sendJson(res, 200, { results });
}
