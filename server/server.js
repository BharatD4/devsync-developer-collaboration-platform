import express from "express";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, { cors: { origin: "*" } });
app.use(cors());
app.use(express.json());

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: "Developer" },
  avatar: { type: String, default: "" }
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  status: { type: String, enum: ["TODO", "IN PROGRESS", "REVIEW", "DONE"], default: "TODO" }
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true }
}, { timestamps: true });

const activitySchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Project = mongoose.model("Project", projectSchema);
const Task = mongoose.model("Task", taskSchema);
const Message = mongoose.model("Message", messageSchema);
const Activity = mongoose.model("Activity", activitySchema);

function sign(user) {
  return jwt.sign({ id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || "devsync_secret", { expiresIn: "7d" });
}
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET || "devsync_secret"); next(); }
  catch { return res.status(401).json({ message: "Invalid or expired token" }); }
}
async function activity(project, user, action) {
  await Activity.create({ project, user, action });
}

app.get("/api/health", (_, res) => res.json({ ok: true, service: "DevSync API" }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role = "Developer" } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required" });
    if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered" });
    const user = await User.create({ name, email, role, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: sign(user), user: { id: user._id, name, email, role } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid email or password" });
    res.json({ token: sign(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get("/api/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

app.get("/api/users", auth, async (_, res) => res.json(await User.find().select("-password").sort({ name: 1 })));

app.get("/api/projects", auth, async (req, res) => {
  const projects = await Project.find().populate("owner", "name email").populate("members", "name email").sort({ createdAt: -1 });
  res.json(projects);
});

app.post("/api/projects", auth, async (req, res) => {
  try {
    const project = await Project.create({
      name: req.body.name,
      description: req.body.description || "",
      owner: req.user.id,
      members: [req.user.id]
    });
    await activity(project._id, req.user.id, `created project "${project.name}"`);
    res.status(201).json(await Project.findById(project._id).populate("owner", "name").populate("members", "name email"));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put("/api/projects/:id", auth, async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate("owner", "name").populate("members", "name email");
  res.json(project);
});

app.delete("/api/projects/:id", auth, async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  await Task.deleteMany({ project: req.params.id });
  await Message.deleteMany({ project: req.params.id });
  res.json({ message: "Project deleted" });
});

app.get("/api/tasks", auth, async (req, res) => {
  const filter = req.query.project ? { project: req.query.project } : {};
  res.json(await Task.find(filter).populate("assignedTo", "name email").populate("project", "name").sort({ createdAt: -1 }));
});

app.post("/api/tasks", auth, async (req, res) => {
  try {
    const task = await Task.create(req.body);
    await activity(task.project, req.user.id, `created task "${task.title}"`);
    res.status(201).json(await Task.findById(task._id).populate("assignedTo", "name email").populate("project", "name"));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put("/api/tasks/:id", auth, async (req, res) => {
  const old = await Task.findById(req.params.id);
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate("assignedTo", "name email").populate("project", "name");
  if (old && req.body.status && req.body.status !== old.status)
    await activity(task.project._id, req.user.id, `moved "${task.title}" → ${req.body.status}`);
  res.json(task);
});

app.delete("/api/tasks/:id", auth, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: "Task deleted" });
});

app.get("/api/messages", auth, async (req, res) => {
  const filter = req.query.project ? { project: req.query.project } : {};
  res.json(await Message.find(filter).populate("sender", "name").sort({ createdAt: 1 }).limit(100));
});

app.post("/api/messages", auth, async (req, res) => {
  const msg = await Message.create({ project: req.body.project, sender: req.user.id, message: req.body.message });
  res.status(201).json(await Message.findById(msg._id).populate("sender", "name"));
});

app.get("/api/activities", auth, async (req, res) => {
  const filter = req.query.project ? { project: req.query.project } : {};
  res.json(await Activity.find(filter).populate("user", "name").sort({ createdAt: -1 }).limit(50));
});


app.get("/api/github/overview", auth, async (req, res) => {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  const token = process.env.GITHUB_TOKEN;

  // Works immediately without configuration using realistic demo data.
  if (!token || !owner || !repo) {
    return res.json({
      connected: false,
      repository: { name: "devsync-demo", full_name: "bharat/devsync-demo", stars: 12, forks: 3, language: "TypeScript", open_issues: 5 },
      commits: [
        { sha: "a81c2f1", message: "Implement JWT authentication", author: "Bharat" },
        { sha: "c72de91", message: "Build developer dashboard UI", author: "Rahul" },
        { sha: "f91ab43", message: "Add AI project assistant", author: "Priya" },
        { sha: "e12aa07", message: "Fix task management API", author: "Bharat" }
      ],
      issues: [
        { number: 24, title: "Implement GitHub OAuth", state: "open", labels: ["enhancement"] },
        { number: 23, title: "Improve dashboard responsiveness", state: "open", labels: ["frontend"] },
        { number: 21, title: "Add deployment pipeline", state: "open", labels: ["devops"] }
      ],
      pulls: [
        { number: 18, title: "Add AI project assistant", state: "open", author: "Priya" },
        { number: 17, title: "Fix authentication flow", state: "merged", author: "Bharat" }
      ]
    });
  }

  try {
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    const base = `https://api.github.com/repos/${owner}/${repo}`;
    const [r, c, i, p] = await Promise.all([
      fetch(base, { headers }),
      fetch(`${base}/commits?per_page=6`, { headers }),
      fetch(`${base}/issues?state=open&per_page=6`, { headers }),
      fetch(`${base}/pulls?state=all&per_page=6`, { headers })
    ]);
    if (!r.ok) throw new Error("GitHub API request failed");
    const repoData = await r.json();
    const commits = await c.json(), issues = await i.json(), pulls = await p.json();
    res.json({
      connected: true,
      repository: { name: repoData.name, full_name: repoData.full_name, stars: repoData.stargazers_count, forks: repoData.forks_count, language: repoData.language, open_issues: repoData.open_issues_count },
      commits: commits.map(x => ({ sha: x.sha.slice(0,7), message: x.commit.message.split("\n")[0], author: x.author?.login || x.commit.author?.name || "Unknown" })),
      issues: issues.filter(x => !x.pull_request).map(x => ({ number:x.number, title:x.title, state:x.state, labels:x.labels.map(l=>l.name) })),
      pulls: pulls.map(x => ({ number:x.number, title:x.title, state:x.merged_at ? "merged" : x.state, author:x.user?.login || "Unknown" }))
    });
  } catch (e) {
    res.status(502).json({ message: "Unable to fetch GitHub repository", detail: e.message });
  }
});

app.get("/api/dashboard", auth, async (req, res) => {
  const projects = await Project.countDocuments();
  const tasks = await Task.countDocuments();
  const done = await Task.countDocuments({ status: "DONE" });
  const active = await Task.countDocuments({ status: { $in: ["IN PROGRESS", "REVIEW"] } });
  const users = await User.countDocuments();
  res.json({ projects, tasks, done, active, users });
});

app.post("/api/ai/chat", auth, async (req, res) => {
  const prompt = String(req.body.prompt || "").trim();
  if (!prompt) return res.status(400).json({ message: "Prompt required" });

  const [tasks, projects, activities] = await Promise.all([
    Task.find().populate("assignedTo", "name").populate("project", "name"),
    Project.find().populate("members", "name"),
    Activity.find().populate("user", "name").sort({ createdAt: -1 }).limit(30)
  ]);

  const context = {
    projects: projects.map(p => ({ name: p.name, description: p.description, members: p.members.map(m => m.name) })),
    tasks: tasks.map(t => ({ title: t.title, project: t.project?.name, status: t.status, priority: t.priority, assignedTo: t.assignedTo?.name })),
    activities: activities.map(a => ({ action: a.action, user: a.user?.name }))
  };

  if (process.env.AI_API_KEY && process.env.AI_MODEL) {
    try {
      const r = await fetch(`${process.env.AI_BASE_URL || "https://api.openai.com/v1"}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.AI_API_KEY}` },
        body: JSON.stringify({
          model: process.env.AI_MODEL,
          messages: [
            { role: "system", content: "You are DevSync AI, a concise software project assistant. Answer using the supplied project context. Do not invent facts." },
            { role: "user", content: `Project context:\n${JSON.stringify(context)}\n\nQuestion: ${prompt}` }
          ]
        })
      });
      const data = await r.json();
      if (r.ok) return res.json({ answer: data.choices?.[0]?.message?.content || "No answer returned." });
    } catch {}
  }

  const total = tasks.length, done = tasks.filter(t => t.status === "DONE").length;
  const blockers = tasks.filter(t => t.status !== "DONE" && t.priority === "High");
  const answer = prompt.toLowerCase().includes("status") || prompt.toLowerCase().includes("summary")
    ? `DevSync currently has ${projects.length} project(s) and ${total} task(s). ${done} task(s) are completed and ${total - done} remain open. ${blockers.length ? `High-priority open work includes: ${blockers.slice(0, 3).map(t => t.title).join(", ")}.` : "There are no high-priority open tasks."}`
    : prompt.toLowerCase().includes("next") || prompt.toLowerCase().includes("block")
    ? `${blockers.length ? `Focus next on: ${blockers.slice(0, 3).map(t => t.title).join(", ")}.` : "No high-priority blockers are currently recorded."} Finish review-stage tasks before starting unrelated work.`
    : `I can analyze ${projects.length} project(s) and ${total} task(s). Try asking: "Give me a project status", "Find blockers", or "What should we work on next?"`;
  res.json({ answer, demo: true });
});

io.on("connection", socket => {
  socket.on("join-project", projectId => {
    if (projectId) socket.join(`project:${projectId}`);
  });
  socket.on("leave-project", projectId => {
    if (projectId) socket.leave(`project:${projectId}`);
  });
  socket.on("project-message", payload => {
    if (payload?.project) io.to(`project:${payload.project}`).emit("project-message", payload);
  });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/devsync")
  .then(() => {
    httpServer.listen(PORT, () => console.log(`DevSync API running on http://localhost:${PORT}`));
  })
  .catch(err => { console.error("MongoDB connection failed:", err.message); process.exit(1); });
