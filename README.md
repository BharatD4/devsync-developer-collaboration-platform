<div align="center">

# 🚀 DevSync

### AI-Powered Developer Collaboration Platform

A modern full-stack workspace for managing projects, Kanban tasks, team activity, GitHub development workflows, real-time communication and engineering insights.

<p>
  <a href="https://devsync-developer-collaboration-platform-aeoqmrc2s.vercel.app/">🌐 Live Demo</a> •
  <a href="https://github.com/BharatD4/devsync-developer-collaboration-platform">💻 GitHub Repository</a>
</p>

</div>

---

## ✨ Product Preview

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="DevSync Dashboard" width="100%" />
</p>

> **Live application:** https://devsync-developer-collaboration-platform-aeoqmrc2s.vercel.app/

---

## 🎯 What is DevSync?

DevSync is a full-stack developer collaboration platform designed to bring common software-development workflows into one workspace. It combines project management, task tracking, team activity, GitHub insights, real-time chat, analytics and an AI project assistant in a single dashboard.

The project was built as a practical Software Development Engineer portfolio project, with a separated React frontend and Node.js/Express backend architecture.

## 🚀 Key Features

- 📊 **Engineering Dashboard** — project health, progress, blockers, team overview and recent activity.
- 📁 **Project Management** — organize development workspaces and project progress.
- ✅ **Kanban Task Management** — move work through Todo, In Progress, Review and Done states.
- 👥 **Team Workspace** — view developers and workspace participation.
- 💬 **Real-Time Chat** — collaborative project communication powered by Socket.IO.
- 🐙 **GitHub Dashboard** — repository metrics, commits, issues and pull requests with optional live GitHub REST API mode.
- 📈 **Engineering Analytics** — completion metrics, task distribution and priority insights.
- 🤖 **AI Project Assistant** — project-aware assistance with a demo fallback when an AI API key is not configured.
- 🔐 **JWT Authentication** — protected authentication flow and API access.
- 🗄️ **MongoDB Persistence** — backend data storage using MongoDB and Mongoose.
- ☁️ **Cloud Deployment** — frontend deployed on Vercel and backend deployed on Render.

---

## 🖥️ Screenshots

### Dashboard

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="DevSync Dashboard" width="100%" />
</p>

### GitHub Workspace

<p align="center">
  <img src="docs/screenshots/github.png" alt="DevSync GitHub dashboard" width="100%" />
</p>

### Engineering Analytics

<p align="center">
  <img src="docs/screenshots/analytics.png" alt="DevSync Analytics" width="100%" />
</p>

### Team Workspace

<p align="center">
  <img src="docs/screenshots/team.png" alt="DevSync Team workspace" width="100%" />
</p>

---

## 🧩 Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, CSS, Axios, Recharts, Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT |
| Real-time | Socket.IO |
| Development Integration | GitHub REST API |
| AI | OpenAI-compatible API with demo fallback |
| Deployment | Vercel + Render |

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │       DevSync       │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
        ┌───────▼────────┐           ┌────────▼───────┐
        │ React + Vite    │           │ Node + Express │
        │    Frontend     │           │     Backend    │
        └───────┬────────┘           └───────┬────────┘
                │                             │
             Vercel                       Render
                                              │
                           ┌──────────────────┼──────────────────┐
                           │                  │                  │
                       MongoDB           Socket.IO          GitHub API
```

---

## ⚙️ Local Development

### 1. Clone the repository

```bash
git clone https://github.com/BharatD4/devsync-developer-collaboration-platform.git
cd devsync-developer-collaboration-platform
```

### 2. Start the backend

```bash
cd server
npm install
```

Create `server/.env` from `.env.example` and configure your local MongoDB and JWT secret.

```bash
npm run dev
```

### 3. Start the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

---

## 🔐 Environment Variables

The backend supports the following configuration:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# Optional GitHub live mode
GITHUB_TOKEN=your_github_token
GITHUB_REPO_OWNER=your_github_username
GITHUB_REPO_NAME=your_repository

# Optional AI configuration
AI_API_KEY=your_ai_key
AI_MODEL=your_model
AI_BASE_URL=https://api.openai.com/v1
```

> Never commit real secrets or `.env` files. Use environment variables in deployment platforms.

---

## ☁️ Deployment

### Frontend

The React/Vite frontend is deployed on **Vercel**.

🌐 **Live:** https://devsync-developer-collaboration-platform-aeoqmrc2s.vercel.app/

### Backend

The Node.js/Express API is deployed on **Render**.

🔗 **API:** https://devsync-developer-collaboration-platform.onrender.com

---

## 📌 Future Improvements

- GitHub OAuth authentication
- Persistent team invitations and member management
- GitHub webhooks for automatic development-event synchronization
- Advanced role-based access control
- Production AI provider integration
- Notifications and activity subscriptions

---

## 👨‍💻 Author

**Bharat Dewangan**

- GitHub: https://github.com/BharatD4
- Project: https://github.com/BharatD4/devsync-developer-collaboration-platform
- Live Demo: https://devsync-developer-collaboration-platform-aeoqmrc2s.vercel.app/

---

<div align="center">

### ⭐ If you find DevSync useful, consider starring the repository.

</div>
