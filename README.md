# Wearwise AI Try-On

Wearwise is a full-stack virtual outfit try-on experience. Users upload a body photo, either try a specific garment or describe an occasion, then receive YouCam Apparel VTO renders. Occasion discovery uses a persisted SerpAPI-sourced catalog, gender-aware ranking, and Gemini-powered chat refinements.

## Stack

- React, Vite, Tailwind CSS
- Node.js and Express
- PostgreSQL
- YouCam Apparel VTO and Skin AI integration boundary
- SerpAPI Google Images for a pre-fetched garment catalog
- Gemini for stylist chat refinements

## What persists

PostgreSQL is required at runtime. The API stores users (anonymous guest tokens), uploads, cached skin profiles, sessions, occasion/gender choices, the shared product catalog, frozen per-session product snapshots, YouCam result URLs/request IDs, and chat messages. The app does **not** use an in-memory history fallback.

`server/uploads/` is local development storage and is deliberately ignored by Git. Configure object storage before deploying to a non-persistent host.

## Setup

1. Copy `.env.example` to `.env` and provide the required keys.
2. Create a PostgreSQL database and set `DATABASE_URL`.
3. Install packages:

   ```bash
   npm install
   ```

4. Build the catalog from SerpAPI. This is the only step that spends SerpAPI credits; it is not called for ordinary user requests.

   ```bash
   npm run prefetch
   ```

5. Apply the schema and seed the catalog:

   ```bash
   npm run seed
   ```

6. Start the frontend and API:

   ```bash
   npm run dev
   ```

The frontend runs on Vite’s displayed URL and proxies `/api` to the Express server on port `8787`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `YOUCAM_API_KEY` | Yes | Apparel VTO API key |
| `YOUCAM_API_BASE_URL` | Yes | Your YouCam API base URL |
| `SHOPPING_SEARCH_API_KEY` | Yes for prefetch | SerpAPI key for catalog building |
| `LLM_API_KEY` or `GEMINI_API_KEY` | Yes for chat | Gemini API key |
| `GEMINI_MODEL` | No | Defaults to `gemini-3.6-flash` |
| `PORT` | No | Express port; defaults to `8787` |

Never commit `.env`; it is excluded through `.gitignore`.

## Database

The canonical, idempotent schema is [schema.sql](schema.sql). It includes safe migrations and indexes. You can apply it independently with:

```bash
psql "$DATABASE_URL" -f schema.sql
```

The seed command applies the same schema automatically before importing `data/prefetched-products.json`.

## Production notes

- Replace local upload storage with S3, Cloudflare R2, or another object store before deployment.
- Do not expose provider keys to the Vite frontend.
- Catalog rows are shared (`session_id IS NULL`); selected rows are snapshotted per session so historical results stay stable.
- YouCam only accepts suitable JPEG/PNG source garments. The server converts Shopping WebP thumbnails to JPEG before upload.
