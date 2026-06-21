# Blogging API

Backend for a personal blog. Write posts, organize them by category, embed photos and videos, and search by topic.

## What it does

Posts are made of **blocks** — paragraphs and media in order.

Categories: Tech, Projects, GitHub Activity, Sports, Random.

**Semantic search** finds related posts by meaning. A search for "distributed systems" can surface posts about MapReduce or key-value stores without those exact words. Embeddings run locally; no OpenAI key required.

Anyone can read published posts. Creating and editing requires a short-lived API key (minted via the admin endpoint).

## API keys

Generate a short-lived write key with your admin key:

```bash
curl -X POST http://localhost:3000/api/admin/keys \
  -H "X-API-Key: your-admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{"label": "claude-session"}'
```

Copy the returned `key` and use it as `X-API-Key` for write requests.

Full API reference with every `curl` example: **[docs/API.md](docs/API.md)**.

Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_API_KEY` in `.env.development`. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor. Create a public storage bucket named `blog-media`.

```bash
npm install
cp .env.development.example .env.development
npm run dev
npm run seed   # optional sample post (dev only)
```

Runs at `http://localhost:3000`. Interactive API docs at **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)** (OpenAPI spec: `/api/openapi.yaml`). Startup logs show `supabaseProject` so you know which database you're connected to.

Node 20+ and a [Supabase](https://supabase.com) project required.

## Dev vs production

Use **two Supabase projects** — one for dev, one for prod. Same migration SQL on both; data stays separate.

| | Development | Production |
|---|---|---|
| Supabase | Dev project | Prod project |
| Config file | `.env.development` (local) | Host dashboard env vars |
| Start | `npm run dev` | `npm run start` |
| Template | `.env.development.example` | `.env.production.example` |

**Your steps:**

1. Keep your current Supabase project as **dev**
2. Create a second Supabase project for **prod** when you deploy
3. Run `001_initial_schema.sql` + create `blog-media` bucket on **both**
4. Copy `.env.development.example` → `.env.development` (fill dev credentials)
5. On your host, set prod vars from `.env.production.example` — never commit prod secrets

Env loading order: `.env` → `.env.development` or `.env.production` → `.env.local` (overrides).

See **[docs/API.md](docs/API.md)** for the complete endpoint reference with `curl` examples, or open **Swagger UI** at `http://localhost:3000/api/docs` (spec at `/api/openapi.yaml`).

## Stack

Express, Supabase (database + storage), local embeddings via `@xenova/transformers`, structured logs via Axiom, Prometheus metrics at `/metrics`.
