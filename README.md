# Wearwise AI Try-On

React/Vite + Tailwind frontend with an Express API, PostgreSQL schema and YouCam-ready integration boundary.

## Run locally

1. Copy `.env.example` to `.env` and add the keys you have.
2. `npm install`
3. `npm run prefetch` creates `data/prefetched-products.json`. Without a shopping key it creates a 54-item demo catalog; with a SerpAPI key it fetches shopping results instead.
4. Optional PostgreSQL: create the database and run `npm run seed`. The demo server uses the JSON catalog and in-memory session store until `DATABASE_URL` is configured.
5. `npm run dev`, then open the Vite URL.

## Provider handoff

Set `YOUCAM_APPAREL_ENDPOINT` to the Apparel VTO endpoint supplied for your YouCam account. `server/services/VTOService.js` isolates its request payload because YouCam endpoint and payload names vary between products/plans. The local safe fallback returns the uploaded body image, marked with a `demo-` request ID, so the entire flow remains testable without credentials.
