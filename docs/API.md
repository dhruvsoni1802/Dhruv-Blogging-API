# Blogging API Reference

Complete reference for the Blogging REST API, with `curl` examples for every endpoint.

**Base URL (local):** `http://localhost:3000`

**Base URL (production):** `https://dhruv-blogging-api-production.up.railway.app`

**Interactive docs:** [Swagger UI (local)](http://localhost:3000/api/docs) · [Swagger UI (prod)](https://dhruv-blogging-api-production.up.railway.app/api/docs) · **OpenAPI spec:** `/api/openapi.yaml`

---

## Table of contents

1. [Conventions](#conventions)
2. [Authentication](#authentication)
3. [Health & metrics](#health--metrics)
4. [Categories](#categories)
5. [Blogs](#blogs)
6. [Search](#search)
7. [Admin — API keys](#admin--api-keys)
8. [Errors & rate limits](#errors--rate-limits)

---

## Conventions

| Item | Value |
|------|-------|
| Content type (JSON) | `Content-Type: application/json` |
| Auth header | `X-API-Key: <key>` |
| JWT auth (optional) | `Authorization: Bearer <supabase-jwt>` — only when `SUPABASE_JWT_SECRET` is set |
| Request tracing | Optional `X-Request-Id` header; echoed back in the response |
| IDs | UUIDs for blogs and API keys |
| Categories | `tech`, `projects`, `github-activity`, `sports`, `random` |

### Block format

Posts are ordered **blocks** — either paragraphs or media references:

```json
[
  { "type": "paragraph", "text": "Hello world." },
  {
    "type": "media",
    "url": "https://…",
    "mimeType": "image/png",
    "alt": "optional",
    "caption": "optional"
  }
]
```

Allowed upload MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `video/mp4`, `video/webm` (max 10 MB).

---

## Authentication

Three key types:

| Key | Header | Used for |
|-----|--------|----------|
| **Admin key** | `X-API-Key: <ADMIN_API_KEY>` | `/api/admin/*` only — mint, list, revoke, cleanup keys |
| **Write key** | `X-API-Key: blk_…` | Create/update/delete blogs, upload media, reindex |
| **Metrics key** | `X-API-Key: <METRICS_API_KEY>` | `/metrics` in production (or whenever `METRICS_API_KEY` is set) |

Public endpoints (no key required): health, categories, reading published blogs, semantic search.

With a valid write key or JWT, you can also read **unpublished** posts and include them in search.

### Mint a write key (admin)

```bash
curl -X POST http://localhost:3000/api/admin/keys \
  -H "X-API-Key: your-admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{"label": "claude-session"}'
```

Optional body field `expiresInHours` (1–168, default 24):

```bash
curl -X POST http://localhost:3000/api/admin/keys \
  -H "X-API-Key: your-admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{"label": "weekend-editing", "expiresInHours": 24}'
```

**Response `201`:**

```json
{
  "key": "blk_…",
  "id": "uuid",
  "label": "claude-session",
  "keyPrefix": "blk_abc1",
  "expiresAt": "2026-06-20T15:00:00.000Z",
  "expiresInHours": 24,
  "message": "Store this key now — it will not be shown again."
}
```

Use the returned `key` as `X-API-Key` on all write requests below.

---

## Health & metrics

### Health check

No auth required.

```bash
curl http://localhost:3000/api/health
```

**Response `200`:**

```json
{
  "status": "ok",
  "timestamp": "2026-06-20T14:00:00.000Z"
}
```

### Prometheus metrics

```bash
curl http://localhost:3000/metrics
```

In **production**, or whenever `METRICS_API_KEY` is set:

```bash
curl http://localhost:3000/metrics \
  -H "X-API-Key: your-metrics-api-key"
```

Returns Prometheus text format (`Content-Type: text/plain`).

---

## Categories

### List categories

No auth required.

```bash
curl http://localhost:3000/api/categories
```

**Response `200`:**

```json
{
  "categories": [
    {
      "slug": "tech",
      "label": "Tech",
      "description": "Technology, programming, and engineering"
    }
  ]
}
```

---

## Blogs

### List blogs

No auth required. Defaults to **published only**.

```bash
curl "http://localhost:3000/api/blogs"
```

Query parameters:

| Param | Default | Description |
|-------|---------|-------------|
| `category` | — | Filter by category slug |
| `published` | `true` | `true` or `false` |
| `limit` | `50` | Max posts to return |
| `offset` | `0` | Pagination offset |

Examples:

```bash
# Tech posts only
curl "http://localhost:3000/api/blogs?category=tech"

# Include drafts (still public list — use write key on single-post routes to read draft content)
curl "http://localhost:3000/api/blogs?published=false"

# Paginate
curl "http://localhost:3000/api/blogs?limit=10&offset=10"
```

**Response `200`:**

```json
{
  "blogs": [
    {
      "id": "uuid",
      "title": "My first post",
      "slug": "my-first-post",
      "excerpt": "Hello world.",
      "category": "tech",
      "published": true,
      "created_at": "2026-06-20T12:00:00.000Z",
      "updated_at": "2026-06-20T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

### Get blog by slug

No auth required for published posts. Pass a write key to fetch unpublished drafts.

```bash
curl http://localhost:3000/api/blogs/slug/my-first-post
```

With auth (draft access):

```bash
curl http://localhost:3000/api/blogs/slug/my-draft \
  -H "X-API-Key: blk_your-minted-key"
```

**Response `200`:** `{ "blog": { …, "blocks": [ … ] } }`

### Get blog by ID

```bash
curl http://localhost:3000/api/blogs/550e8400-e29b-41d4-a716-446655440000
```

With auth for unpublished:

```bash
curl http://localhost:3000/api/blogs/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: blk_your-minted-key"
```

### Upload media

Write key required. Returns a public URL to embed in a media block.

```bash
curl -X POST http://localhost:3000/api/blogs/media \
  -H "X-API-Key: blk_your-minted-key" \
  -F "file=@photo.png"
```

**Response `201`:**

```json
{
  "media": {
    "path": "1718899200000-abc123.png",
    "url": "https://….supabase.co/storage/v1/object/public/blog-media/…",
    "mimeType": "image/png",
    "originalName": "photo.png"
  }
}
```

### Create blog

Write key required.

```bash
curl -X POST http://localhost:3000/api/blogs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: blk_your-minted-key" \
  -d '{
    "title": "My first post",
    "category": "tech",
    "published": true,
    "blocks": [
      { "type": "paragraph", "text": "Hello world." },
      {
        "type": "media",
        "url": "https://your-project.supabase.co/storage/v1/object/public/blog-media/photo.png",
        "mimeType": "image/png",
        "alt": "A screenshot"
      }
    ]
  }'
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | yes | Post title |
| `category` | yes | Category slug |
| `blocks` | yes | At least one block |
| `published` | no | Default `false` |
| `excerpt` | no | Auto-generated from blocks if omitted |
| `slug` | no | Auto-generated from title if omitted |

**Response `201`:** `{ "blog": { … } }`

### Update blog

Write key required. Send only fields to change.

```bash
curl -X PUT http://localhost:3000/api/blogs/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: blk_your-minted-key" \
  -d '{
    "title": "Updated title",
    "published": true,
    "blocks": [
      { "type": "paragraph", "text": "Updated content." }
    ]
  }'
```

**Response `200`:** `{ "blog": { … } }`

### Delete blog

Write key required.

```bash
curl -X DELETE http://localhost:3000/api/blogs/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: blk_your-minted-key"
```

**Response `204`:** empty body

### Reindex single blog

Rebuilds the semantic search embedding for one post. Write key required.

```bash
curl -X POST http://localhost:3000/api/blogs/550e8400-e29b-41d4-a716-446655440000/reindex \
  -H "X-API-Key: blk_your-minted-key"
```

**Response `200`:**

```json
{
  "message": "Blog indexed successfully",
  "blogId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Reindex all blogs

Write key required. Rebuilds embeddings for up to 1000 posts.

```bash
curl -X POST http://localhost:3000/api/blogs/reindex-all \
  -H "X-API-Key: blk_your-minted-key"
```

**Response `200`:**

```json
{
  "indexed": 12,
  "failed": 0
}
```

---

## Search

### Hybrid search

Combines **dense retrieval** (BGE embeddings + pgvector), **sparse retrieval** (PostgreSQL full-text / BM25-style ranking), **Reciprocal Rank Fusion**, and an optional **cross-encoder reranker** (`ms-marco-MiniLM`).

No auth required for published posts. Pass a write key and `include_unpublished=true` to search drafts.

```bash
curl "http://localhost:3000/api/search?q=distributed+systems"
```

Query parameters:

| Param | Default | Description |
|-------|---------|-------------|
| `q` | — | **Required.** Search query |
| `category` | — | Filter by category slug |
| `limit` | `20` | Max results returned |
| `include_unpublished` | `false` | `true` only works with a valid write key |

Examples:

```bash
# Tech posts only
curl "http://localhost:3000/api/search?q=mapreduce&category=tech&limit=5"

# Include drafts (write key required)
curl "http://localhost:3000/api/search?q=draft+notes&include_unpublished=true" \
  -H "X-API-Key: blk_your-minted-key"
```

**Response `200`:**

```json
{
  "query": "distributed systems",
  "count": 2,
  "results": [
    {
      "id": "uuid",
      "title": "MapReduce at Google",
      "slug": "mapreduce-at-google",
      "excerpt": "…",
      "category": "tech",
      "published": true,
      "created_at": "2026-06-01T00:00:00.000Z",
      "similarity": 0.72
    }
  ]
}
```

---

## Admin — API keys

All routes require the long-lived **admin key** (`ADMIN_API_KEY`), not a minted write key.

### Mint write key

See [Mint a write key](#mint-a-write-key-admin) above.

### List keys

```bash
curl http://localhost:3000/api/admin/keys \
  -H "X-API-Key: your-admin-api-key"
```

**Response `200`:**

```json
{
  "keys": [
    {
      "id": "uuid",
      "label": "claude-session",
      "keyPrefix": "blk_abc1",
      "expiresAt": "2026-06-20T15:00:00.000Z",
      "createdAt": "2026-06-20T14:00:00.000Z",
      "revokedAt": null,
      "lastUsedAt": "2026-06-20T14:30:00.000Z",
      "status": "active"
    }
  ]
}
```

`status` is one of: `active`, `expired`, `revoked`.

### Revoke key

Soft-revokes a key immediately (row stays until cleanup). Use the key's `id` from mint or list.

```bash
curl -X DELETE http://localhost:3000/api/admin/keys/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: your-admin-api-key"
```

**Response `200`:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "label": "claude-session",
  "revokedAt": "2026-06-20T14:45:00.000Z",
  "message": "API key revoked"
}
```

### Cleanup expired keys

Hard-deletes all rows where `expires_at` is in the past.

```bash
curl -X POST http://localhost:3000/api/admin/keys/cleanup \
  -H "X-API-Key: your-admin-api-key"
```

**Response `200`:**

```json
{
  "deletedCount": 3,
  "message": "Removed 3 expired API key(s)"
}
```

---

## Errors & rate limits

### Error format

All errors return JSON:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "title is required",
  "code": "BAD_REQUEST"
}
```

Common status codes: `400`, `401`, `404`, `409`, `429`, `500`.

### Rate limits

| Scope | Limit |
|-------|-------|
| All `/api/*` routes | 250 requests / minute |
| Write endpoints (POST/PUT/DELETE blogs, media, admin keys) | 50 / minute |
| Search | 40 / minute |

When exceeded, response is `429`:

```json
{
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded"
}
```

Rate-limit headers (`RateLimit-*`) are included per the standard headers draft.
