# YouTube Reply Ops Frontend

React + Vite frontend for your existing FastAPI backend in AI_assisted_youtube_comment_reply.

## What Is Implemented

- Backend health check flow mapped to GET /
- OAuth trigger mapped to GET /auth/youtube
- Sync flow mapped to POST /youtube/sync?run_rag=true|false
- Video generation mapped to POST /rag/generate/video/{video_id}
- Comment generation mapped to POST /rag/generate/comment/{comment_id}
- Local activity/history tracking in browser storage

## Project Structure

- src/App.jsx: Shell layout and route wiring
- src/api/backendApi.js: Backend request client and endpoint mapping
- src/state/AppStateProvider.jsx: Shared state and persistence
- src/pages/DashboardPage.jsx: Health + OAuth overview
- src/pages/SyncPage.jsx: Sync execution and result display
- src/pages/GenerateVideoPage.jsx: Video-level generation execution
- src/pages/GenerateCommentPage.jsx: Comment-level generation execution
- src/pages/ActivityPage.jsx: Local action log
- src/styles.css: Responsive visual system and animations

## Run

1. Install dependencies

	npm install

2. Start dev server

	npm run dev

3. Build production bundle

	npm run build

## Dev Proxy

The app calls backend endpoints through /api and Vite proxies that to http://localhost:8000.

Configured in vite.config.js.

## Important Backend Constraints

- Current backend user_id is hardcoded to 1
- Backend does not expose read/list endpoints for videos/comments/replies
- This frontend stores recent workflow data locally for UX continuity

## OAuth Popup Callback Mode

The frontend includes a callback route at /oauth/callback that can auto-complete OAuth in popup mode.

To enable auto-completion:

1. Set GOOGLE_REDIRECT_URI to http://localhost:5173/oauth/callback
2. Register the same redirect URI in Google OAuth app configuration

If your backend still uses http://localhost:8000/auth/callback as redirect URI, popup completion is manual and the dashboard fallback button remains available.
