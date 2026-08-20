# DevSync — AI-Powered Developer Collaboration Platform

## FINAL RESUME BUILD
This package includes the complete MVP plus:
- GitHub repository/commit/issue/pull-request dashboard
- Optional live GitHub REST API integration
- Real-time project chat via Socket.IO
- Engineering analytics with charts
- AI project assistant with no-key demo fallback


A fast, resume-ready full-stack MVP combining project management, task tracking, team activity and an AI assistant.

## Stack
- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Axios
- Optional OpenAI-compatible AI API

## Run

### 1. Backend
```bash
cd server
npm install
copy .env.example .env
npm run dev
```

On macOS/Linux:
```bash
cp .env.example .env
```

### 2. Frontend
Open another terminal:
```bash
cd client
npm install
npm run dev
```

Open the URL shown by Vite.

## MongoDB
The backend defaults to:
`mongodb://127.0.0.1:27017/devsync`

Make sure MongoDB is running.

## AI
The project works without an AI key using a useful demo fallback. For real AI responses, add an OpenAI-compatible key in `server/.env`:
`AI_API_KEY=your_key`
`AI_MODEL=...`
`AI_BASE_URL=https://api.openai.com/v1`

Never commit `.env`.

## Optional GitHub live mode
The GitHub page works immediately with built-in demo data. To connect a real repository, set these values in `server/.env`:
`GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`.

## What to show in an interview
- JWT authentication and protected REST APIs
- MongoDB data modeling for users, projects, tasks, messages and activity
- Kanban workflow and project analytics
- Socket.IO real-time collaboration
- GitHub API integration
- AI assistant using project context
- Separation of frontend, backend and external integrations

## Dashboard v2
The dashboard now includes project health/progress, blockers, live activity, team overview, GitHub snapshot metrics and quick actions.
