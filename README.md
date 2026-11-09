# YT NAMES GENERATOR — Vercel Edition

This version is structured for **GitHub → Vercel deployment**. It uses Vercel serverless functions, so there is no Express server to keep running.

## Project structure

```text
/
├── api/
│   ├── config.js
│   ├── generate.js
│   └── check-handles.js
├── lib/
│   └── shared.js
├── index.html
├── style.css
├── app.js
├── package.json
├── vercel.json
└── .gitignore
```

## 1. Upload to GitHub

1. Extract this ZIP.
2. Create a new GitHub repository.
3. Upload the **contents** of the extracted folder (not an extra parent folder).
4. Make sure `api/`, `lib/`, `index.html`, `style.css`, `app.js`, and `package.json` are at the repository root.
5. Do not upload your real API key or a `.env` file.

## 2. Import into Vercel

1. Open https://vercel.com/new
2. Import your GitHub repository.
3. Framework Preset: **Other**.
4. Build Command: leave empty.
5. Output Directory: leave empty.
6. Install Command: `npm install`.
7. Deploy.

Vercel automatically detects the functions inside `/api`.

## 3. Add your OpenAI secret in Vercel

After importing (or before redeploying):

1. Open your Vercel project.
2. Go to **Settings → Environment Variables**.
3. Add:

   - Name: `OPENAI_API_KEY`
   - Value: your actual OpenAI API key
   - Environments: Production, Preview, and Development (select the ones you need)

4. Optional second variable:

   - Name: `OPENAI_MODEL`
   - Value: `gpt-4.1-mini`

5. Save, then go to **Deployments** and redeploy the latest deployment so the function receives the new variables.

**Never put the secret in `app.js`, `index.html`, or any `NEXT_PUBLIC_` / `VITE_` variable.** The browser only calls your `/api` endpoints; the OpenAI key remains server-side.

## 4. Local development (optional)

Requires Node.js 18+.

```bash
npm install
```

Copy `.env.example` to `.env`, add your key, then run:

```bash
npm run dev
```

Vercel CLI will start a local development server. Open the local URL it prints.

## Important: YouTube handle check

The optional filter requests `https://www.youtube.com/@HANDLE` from a Vercel function to avoid browser CORS restrictions. A 404 response is shown as **possible availability**, not guaranteed availability. YouTube may reserve handles, block automated requests, rate-limit traffic, or change responses. Confirm the handle in YouTube Studio before relying on it.

## Troubleshooting

- **AI ready / API key needed:** Check that `OPENAI_API_KEY` is set in Vercel Environment Variables, then redeploy.
- **Function returns 500:** Open Vercel → Deployments → latest deployment → Functions / Logs.
- **Model error:** Set `OPENAI_MODEL` to a model enabled for your OpenAI API project.
- **Do not deploy as static-only hosting:** the `/api` serverless functions are required for AI generation and availability checks.

OpenAI API usage is billed separately from a ChatGPT subscription.
