# Repository Guidelines

## Project Structure & Module Organization
- `backend/` contains the FastAPI service. `main.py` exposes the API, `model.py` handles inference, and `requirements.txt` lists Python dependencies.
- `frontend/` contains the Vite + React app. Source code lives in `frontend/src/`, static assets in `frontend/public/`, and app entry files are `src/main.jsx` and `src/App.jsx`.
- Generated or runtime artifacts such as `backend/results.json` and `frontend/public/results.json` should be treated as data files, not core logic.

## Build, Test, and Development Commands
- `cd backend && pip install -r requirements.txt` installs the API dependencies.
- `cd backend && uvicorn main:app --reload` starts the FastAPI server locally.
- `cd frontend && npm install` installs the web dependencies.
- `cd frontend && npm run dev` starts the Vite dev server.
- `cd frontend && npm run build` creates the production bundle.
- `cd frontend && npm run lint` runs Oxlint over the React code.

## Coding Style & Naming Conventions
- Follow the existing style: Python uses 4-space indentation and small, explicit helper functions; React/JSX uses 2-space indentation and functional components.
- Use descriptive, feature-based names for components and files, such as `LiveDemo.jsx` or `Results.jsx`.
- Prefer `snake_case` for Python variables and functions, `camelCase` for JavaScript variables and hooks, and `PascalCase` for React components.
- Keep formatting aligned with the repository’s current lint-friendly style; run `npm run lint` before opening a PR.

## Testing Guidelines
- There is no dedicated automated test suite yet.
- Validate backend changes by starting the API and exercising `/` and `/predict` with a sample image.
- Validate frontend changes with `npm run build` and `npm run lint`; add tests alongside any new complex logic when practical.

## Commit & Pull Request Guidelines
- The Git history currently shows only an initial commit, so there is no established commit convention yet.
- Use short, imperative commit messages, such as `Add upload validation` or `Refine results panel`.
- Pull requests should summarize the change, note any backend or frontend impact, and include screenshots for UI updates.

## Security & Configuration Tips
- Do not commit large model checkpoints or secret configuration values.
- Keep local CORS and inference settings in sync with `backend/main.py` when running the app in a new environment.
