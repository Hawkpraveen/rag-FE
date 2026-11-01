# RAG frontend

React + Vite with feature-based folders: `app`, `pages`, `features`, `entities`,
and `shared`. Document indexing, question submission, and source excerpts are
separate features. Browser requests use the shared Node API client.

```powershell
cd D:\Projects\RAG\rag-FE
npm install
npm run dev
```

Open http://localhost:8080. Vite proxies `/api` to the Node backend on port 5000.
The frontend does not know or call the Python agent URL. Port conflicts fail
instead of silently changing ports. The existing local dependencies have been
preserved; `npm install` is only needed for a fresh installation.

Build: `npm run build`. Keep the Node backend and Python agent running to use
indexing and document questions.


File attachments: choose the paperclip Attach button in the chat or Attach a file in the library. Supported formats: .txt, .md, and text-based .pdf; maximum 10 MB per file. Files travel through Node to the agent and are retained under rag-agent/data/uploads for citations. Node then publishes a MongoDB dataset snapshot. Scanned PDFs require OCR. Start the agent with .venv\Scripts\python.exe run.py so HOST and PORT in rag-agent/.env are used. Node reads PORT and AGENT_URL from rag-BE/.env. Restart Node after changing its configuration.

## Saved chats

Saved chats load from Node/MongoDB on startup. The conversation selector shows the
latest 50 chats; Reload checks pending answers, and Load earlier messages paginates
older turns. New conversation keeps the previous chat saved. Browser storage holds
only the selected conversation ID; messages and excerpts restore from the backend.
Token counts are saved server-side and are not shown in the chat UI. Saved history
does not yet become model context.

The composer includes Auto, Fast, and Thorough answer modes. Auto routes by task
and context; the other modes override routing. Answers show the selected model,
with the selection reason on hover. Model routing and usage survive history
reloads. Model names are configured by the agent, never accepted from the browser.
