# YT Names Generator (Vercel + Gemini)

A static YouTube channel-name generator frontend with Vercel serverless API routes. It uses Google's Gemini API on the server, so the API key is not exposed in browser code.

## Features

- Category, style, and one/two/three-word controls
- Generates exactly 10 names per successful request
- Responsive results grid (5 columns × 2 rows on wide screens)
- Optional YouTube handle availability checks
- Dark/light theme
- Gemini API key stored as a Vercel environment variable

## Deploy to Vercel

1. Upload these project files to a GitHub repository.
2. Import the repository into Vercel.
3. In Vercel, open **Project → Settings → Environment Variables**.
4. Add:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** your Google AI Studio Gemini API key
   - **Environments:** Production, Preview, and Development as needed
5. Optionally add:
   - **Name:** `GEMINI_MODEL`
   - **Value:** `gemini-flash-latest`
6. Save the variables and trigger a new deployment (Deployments → latest deployment → Redeploy, or push a new commit).

Do not add the API key to frontend files or commit it to GitHub. Never share the key in screenshots or chats. If a key is exposed, revoke it and create a replacement.

## Local development

```bash
npm install
npx vercel dev
```

Create a local `.env` file using `.env.example` as a guide and add your Gemini key. Keep `.env` private; it is excluded by `.gitignore`.

## Troubleshooting

- **Gemini rejected the API key:** confirm `GEMINI_API_KEY` is spelled correctly in Vercel and redeploy.
- **429 / quota:** the Gemini account's rate limit or free-tier quota may have been reached. Wait for reset or check the account's usage limits.
- **Model error:** remove `GEMINI_MODEL` to use the default `gemini-flash-latest`, or set a model available to your API account.
- **Changes not visible:** check the latest Vercel deployment is Ready and hard-refresh the website.
