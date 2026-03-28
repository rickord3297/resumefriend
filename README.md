# Resume Friend

Sentinel background service for job search: Gmail classification, Calendar prep windows, and suggested reply drafts.

## Sentinel

- **Email**: Connects to Gmail API (watch or poll), classifies new threads with an LLM as **Interview Request**, **Rejection**, or **Follow-up**.
- **Calendar**: Connects to Google Calendar; for any event that looks like an interview, creates a **Prep Mode** window 30 minutes before and stores it in Dashboard state.
- **Action Engine**: For emails classified as **Interview Request**, generates a suggested reply using your **CalendarAvailability** and saves it as a Gmail draft.

### Setup

1. Copy `.env.example` to `.env` and fill in:
   - **Google**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`  
     Use [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client → scopes: `gmail.readonly`, `gmail.modify`, `gmail.compose`, `calendar.readonly`. Run the OAuth flow to obtain a refresh token.
   - **OpenAI**: `OPENAI_API_KEY` for classification and reply generation.

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

3. **Dashboard**: Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to see Prep Mode windows (refreshed from local state).

### Running Sentinel

- **API**: `POST /api/sentinel/run`  
  Optional body: `{ "calendarAvailability": { "weekdays": ["Monday","Tuesday"], "window": { "start": "09:00", "end": "17:00" }, "timezone": "America/Los_Angeles" }, "calendarOnly": false, "gmailOnly": false }`.
- **CLI** (with app running):  
  `SENTINEL_URL=http://localhost:3000 npm run sentinel`  
  Optional: `SENTINEL_AVAILABILITY_JSON='{"weekdays":["Monday","Tuesday"]}'` or `SENTINEL_AVAILABILITY_FILE=./availability.json`.
- **Cron**: Call `POST /api/sentinel/run` on a schedule, or run `npm run sentinel` against your deployed URL.

### Gmail push (optional)

To use Gmail push instead of polling:

1. Create a Pub/Sub topic and push subscription to your `POST /api/sentinel/gmail/notify` URL.
2. Set `GMAIL_WATCH_TOPIC=projects/YOUR_PROJECT/topics/YOUR_TOPIC`.
3. Call `POST /api/sentinel/gmail/watch` once (renew before expiration).

### API routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/dashboard/state` | GET | Dashboard state (prep mode windows). |
| `/api/sentinel/run` | POST | Run one Sentinel cycle. |
| `/api/sentinel/gmail/watch` | POST | Start Gmail watch (needs `GMAIL_WATCH_TOPIC`). |
| `/api/sentinel/gmail/notify` | POST | Webhook for Gmail push notifications. |

---

## Severance Agent

Tools for pivoting your story and outbound: **PersonaEngine**, **JobHunter**, and **VoiceLab**.

### PersonaEngine

- **Input**: Base resume or LinkedIn export (plain text).
- **Output**: Three tailored resume versions with **re-contextualized** achievements (not just keyword swap):
  - **SaaS / Startup**: speed, building, 0-to-1, shipped, scrappy.
  - **Enterprise**: scale, process, governance, metrics, stakeholder alignment.
  - **Generalist / Alternative**: transferable skills, adaptability.
- Each version includes a summary, rewritten sections, and **highlight bullets** for use in outreach.
- **API**: `POST /api/persona/generate` with body `{ "sourceText": "..." }` (optional `sections: [{ title, content }]`).

### JobHunter (outbound automation)

- **Research**: Given a company name, find potential hiring managers. Prefers **Gemini with Google Search** (open internet) when `GEMINI_API_KEY` is set; optional **Apollo.io** when `APOLLO_API_KEY` is set; else **OpenAI** or a stub. Add `GEMINI_API_KEY` for web-grounded, open-source-style research.
- **Sequencing**: Draft a **3-step outreach** (Initial, Follow-up 1, Follow-up 2) with subjects and bodies.
- **Tailoring**: Automatically **inject** 2–3 highlight bullets from the selected Persona into the messages.
- **API**:  
  - `POST /api/job-hunter/research` with `{ "companyName": "..." }`.  
  - `POST /api/job-hunter/sequence` with `{ "companyName", "personaBullets": [], "personaLabel", "contactName?", "contactTitle?" }`.
- **UI**: [/tools/job-hunter](/tools/job-hunter) — enter company, run research, paste persona bullets, draft sequence.

### VoiceLab

- **Speech-to-text**: Browser **Web Speech API** (Chrome; use HTTPS or localhost) to record answers to common interview questions.
- **Instant feedback** (after “Get instant feedback”):
  - **Content**: Did they answer the prompt? Score and suggested improvements.
  - **Confidence**: Filler word count and list, filler score; tone summary and optional tone score.
  - **Alignment**: How well the answer matches the selected **Resume Persona** (score, summary, matched themes, missed opportunities).
- **API**:  
  - `GET /api/voicelab/questions` — list default questions.  
  - `POST /api/voicelab/feedback` with `{ "prompt", "transcript", "personaLabel?", "personaSummaryOrBullets?" }`.
- **UI**: [/tools/voicelab](/tools/voicelab) — select persona, optional summary/bullets, pick question, record, get feedback.
