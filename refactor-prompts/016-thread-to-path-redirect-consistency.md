# Thread -> Path redirect consistency

Problem

- `src/pages/threads/[id].astro` generates a meta refresh and a message. Consider an HTTP level redirect in `astro.config.mjs`/adapter or `vercel.json`.

Why this matters

- Client-side refresh is less ideal for SEO and user experience than a proper redirect.

Scope

- Replace the dynamic route with a static redirect rule (if feasible) or a small serverless redirect if moving to hybrid/server output. Alternatively, pre-generate static HTML with canonical link and http-equiv, but prefer platform redirects.

Acceptance criteria

- Visiting `/threads/<id>` 301/308 redirects to `/paths/<id>` at hosting layer.
- The dynamic page can be removed if redirect is configured.
