# AI Productivity Assistant

A single-page workspace with three AI modes: Email Generator, Meeting Notes Summarizer, and Research Assistant. Powered by Lovable AI (no API keys needed from you).

## What gets built

**Home (`/`)** — replaces the placeholder page.
- Mode switcher (three tabs): Email / Meeting Notes / Research
- Input panel tailored per mode:
  - Email: rough notes/intent, recipient, tone (formal / concise / warm / persuasive), length
  - Meeting Notes: paste raw notes, optional meeting title & attendees
  - Research: question box, depth toggle (quick answer vs. deep dive)
- Result panel that streams the answer live as the AI writes it
- Copy button, plus regenerate; for email, a "give me 3 alternative versions" action
- Empty, loading, and error states (including a clear message if AI credits run out)

**Output formatting per mode**
- Email: subject line + ready-to-send body
- Meeting Notes: Summary / Key Discussion Points / Decisions / Action Items (owner + deadline) / Next Steps
- Research: key points, structured explanation, assumptions & limitations, brief conclusion

**Design direction** — a calm, focused productivity look: warm off-white canvas, deep ink text, one confident accent color, generous whitespace, a distinctive non-default typeface pairing. No purple-gradient AI cliché.

## Technical notes

- Streaming chat route at `src/routes/api/chat.ts` using the AI SDK with the Lovable AI Gateway; system prompt encodes the three roles and the output-style rules from your prompt, with the active mode and user options passed as context.
- Client uses `useChat` with `DefaultChatTransport` so text renders progressively.
- Default model: `openai/gpt-5.6-sol` via the gateway Responses API (streaming, reasoning enabled).
- No database in this version — results live in the current session only.
- SEO head metadata on the home route.

## Not included (say the word and I'll add)

- Saving/history of past generations (needs Lovable Cloud + a database)
- Accounts/login
- Export to PDF/docx or sending email directly
