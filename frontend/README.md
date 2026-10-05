# Research RAG Assistant — frontend

A responsive React + Vite chat workspace with Tailwind CSS, Lucide icons, light/dark themes, Markdown answers, loading states, error recovery, and keyboard support.

## Start locally

Use Node.js 22 LTS or newer. From the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the localhost URL printed by Vite (usually http://localhost:5173). In another terminal, start the existing backend from its directory with your Python environment activated:

```powershell
cd Assistant
python -m uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

The backend requires its existing Python dependencies, research documents, and GOOGLE_API_KEY configuration. Frontend code does not require that API key.

## Project structure

```text
frontend/
  .env.example
  .gitignore
  index.html
  package.json
  package-lock.json
  postcss.config.js
  tailwind.config.js
  vite.config.js
  src/
    main.jsx
    App.jsx                  # Theme, conversation, request lifecycle
    api.js                   # POST /query and response validation
    index.css                # Theme tokens and Markdown typography
    components/
      Sidebar.jsx            # Branding, placeholder library, mobile drawer
      ChatWindow.jsx         # Welcome prompts, messages, composer
```

## API connection

The browser sends `POST /api/query`; Vite proxies it to `http://127.0.0.1:8000/query`, avoiding cross-origin issues during local development and preview.

```json
{ "question": "What are the key findings?" }
```

Expected response:

```json
{ "question": "What are the key findings?", "answer": "The paper finds..." }
```

Questions are sent independently because the API accepts no chat-history field. Answers support Markdown paragraphs, lists, links, tables, code, and footnotes (`[^1]` with `[^1]: source` definitions). Plain-text citations remain intact. No citations or document metadata are invented; this API only returns answer text.

Network failures, unsuccessful HTTP statuses, malformed responses, and a two-minute timeout produce an error message with a retry button. Only one request runs at a time. Conversation history stays in memory; refreshing clears it. Theme preference is stored locally when storage is available.

The library and ingestion indicator are explicitly placeholders. Uploading requires a separate backend endpoint and is not implemented.

## Build and deployment

```powershell
npm run build
npm run preview
npm test
```

Deploy `dist/` to your static host. Vite's development proxy is not part of the static bundle: configure a production reverse proxy from `/api/*` to your backend, or copy `.env.example` to `.env.local`, set `VITE_API_BASE_URL` to the backend URL, and rebuild. A remote frontend needs a reachable backend URL; `127.0.0.1` always refers to the browser user's computer.

For a direct cross-origin connection, add FastAPI CORS middleware in `Assistant/server.py` after creating `app` (replace origins with your actual frontend URLs):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)
```

## Manual checks

- Submit with Enter; use Shift+Enter for multiline input.
- Confirm blank input and repeat sends are blocked while loading.
- With FastAPI running, ask about an ingested paper and inspect the answer.
- Stop FastAPI and submit: an error and retry action should appear.
- Check the mobile sidebar, Escape dismissal, keyboard navigation, theme toggle, and a long Markdown answer.
