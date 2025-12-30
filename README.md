# AI Assistant Website (Minimal)

This is a minimal demo website with an AI assistant using Node/Express and the OpenAI Chat API.

## What it includes
- Backend: `server.js` — Express endpoint `/api/chat` that forwards requests to OpenAI.
- Frontend: a small static SPA in `public/` with a chat UI.
- `.env.example`: shows how to provide your OpenAI API key.

## Quick start (local)
1. Clone or copy files into a folder.
2. Install dependencies:
   ```
   npm install
   ```
3. Create `.env` from `.env.example` and add your OpenAI API key:
   ```
   cp .env.example .env
   # edit .env and set OPENAI_API_KEY
   ```
4. Run:
   ```
   npm start
   ```
5. Open http://localhost:3000 in your browser.

## Notes & security
- Keep your API key secret. Do NOT put it into client-side JS or public repos.
- This example sends user messages to OpenAI via the server. You are billed by OpenAI for usage.
- The example uses a simple in-memory chat history kept in the browser and passed to the server; it is not persisted.

## Next steps / features you may want
- React or Vue frontend (componentized chat, nicer UX).
- Persistent conversation memory (database: SQLite, Postgres).
- Authentication so each user has private history.
- Upload documents / knowledge base and use retrieval-augmented generation (RAG).
- Voice input/output (Web Speech API + TTS).
- Deploy: Vercel/Render/Heroku for frontend + server, or split serverless functions.

## Need help?
Tell me:
- Do you want React instead of vanilla JS?
- Do you want voice or file upload support?
- Will you provide an OpenAI API key or do you want a serverless deployment guide?
- Would you like me to create a GitHub repo and push these files for you?
