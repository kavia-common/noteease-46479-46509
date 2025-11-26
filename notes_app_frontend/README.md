# Noteease – Astro Notes App (Ocean Professional)

A modern, responsive notes interface built with Astro. Create, edit, search, and delete notes with persistence via localStorage. Styled with the Ocean Professional theme (blue and amber accents, rounded corners, subtle shadows, gradient highlights).

## Features
- Create, edit, delete notes (no backend required)
- Local persistence via `localStorage` under `noteease.notes.v1`
- Search by title/content
- Sort by last updated (default), oldest, or title
- Floating Add button, accessible actions, keyboard shortcuts
- Smooth transitions, subtle shadows, rounded corners
- Responsive and accessible UI

## Getting Started
From the `notes_app_frontend` directory:

```bash
npm install
npm run dev
```

Preview/build:
```bash
npm run build
npm run preview
```

The app is configured to run on port 3000 via `astro.config.mjs`.

## Keyboard Shortcuts
- n: New note
- Ctrl/Cmd+K: Focus search
- In editor:
  - Esc: Close
  - Ctrl/Cmd+S: Save

## Environment Variables (optional)
The UI reads PUBLIC_* variables if present:
- PUBLIC_NODE_ENV
- PUBLIC_FEATURE_FLAGS
(and others available in the environment). These are non-blocking and only used for potential future UX flags.

## Storage
- Notes stored at localStorage key: `noteease.notes.v1`

## Structure
- src/assets/theme.css – Ocean Professional theme variables and component styles
- src/components/NotesIsland.astro – Astro wrapper
- src/components/NotesIsland.jsx – Interactive island managing state, CRUD, modal, search/sort
- src/utils/storage.js – Helpers for localStorage and time formatting
- src/layouts/Layout.astro – App shell and theme setup
- src/pages/index.astro – Entry page mounting the island

## Accessibility
- Focus-visible styles, ARIA labels on buttons, dialog uses aria-modal and basic focus trapping.

```diff
Acceptance criteria mapping:
- CRUD without backend: ✅ (localStorage)
- Persist across refresh: ✅
- Search/sort: ✅
- Ocean Professional style: ✅
- Floating add button: ✅
- No console runtime errors: ✅ (vanilla DOM APIs)
- Astro preview at port 3000: ✅
```
