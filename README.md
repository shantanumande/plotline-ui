# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Running against the backend

The hosted preview uses demo data (mock mode is the default when `VITE_USE_MOCKS` is unset). To use the real API locally:

1. In the backend repo: `uv sync`, then `uv run python -m plotline.api`. It listens on `127.0.0.1:8000` (`API_HOST` / `API_PORT` in the backend `.env` change that).
2. Allow the frontend origin: set `CORS_ORIGINS=http://localhost:8080` (or your Vite port) in the backend `.env`. The default `*` also works.
3. Here: `cp .env.example .env`, then `npm install && npm run dev`.
4. Plain-English search needs the backend in `LLM_MODE=replay` or `live`. With `LLM_MODE=off` the Ask tab is disabled automatically.

The footer "Demo data" switch overrides the env setting per browser.
