import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import { io as socketIO } from "socket.io-client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, MessageSquare,
  Bot, Settings, Plus, LogOut, Search, Sparkles, Send, Trash2,
  Circle, Clock3, CheckCircle2, AlertCircle, Menu, X, Github, BarChart3,
  GitCommit, GitPullRequest, CircleDot, Star, GitFork
} from "lucide-react";
import "./styles.css";

const API = "https://devsync-developer-collaboration-platform.onrender.com/api";
const api = axios.create({ baseURL: API });
api.interceptors.request.use(c => {
  const t = localStorage.getItem("devsync_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

function App() {
  const [token, setToken] = useState(localStorage.getItem("devsync_token"));
  return token ? <Dashboard onLogout={() => { localStorage.clear(); setToken(null); }} /> : <Auth onLogin={t => { localStorage.setItem("devsync_token", t); setToken(t); }} />;
}

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"demo@devsync.com", password:"demo123", role:"Developer" });
  const [error, setError] = useState("");
  const submit = async e => {
    e.preventDefault(); setError("");
    try {
      const r = await api.post(`/auth/${mode === "login" ? "login" : "register"}`, form);
      onLogin(r.data.token);
    } catch (e) { setError(e.response?.data?.message || "Something went wrong"); }
  };
  return <div className="auth-page">
    <div className="auth-art"><div className="brand big"><span className="brand-mark">D</span> DevSync</div><h1>One workspace for your development team.</h1><p>Projects, tasks, collaboration and AI assistance — built for modern software teams.</p><div className="mini-card"><Sparkles size={18}/><span>AI project insights</span></div></div>
    <form className="auth-card" onSubmit={submit}>
      <div className="brand"><span className="brand-mark">D</span> DevSync</div>
      <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2><p className="muted">{mode === "login" ? "Sign in to your workspace." : "Start collaborating with your team."}</p>
      {mode === "register" && <input placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />}
      <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
      <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
      {error && <div className="error">{error}</div>}
      <button className="primary full">{mode === "login" ? "Sign in" : "Create account"}</button>
      <button type="button" className="link-btn" onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login" ? "Create an account" : "Already have an account? Sign in"}</button>
    </form>
  </div>
}

function Dashboard({ onLogout }) {
  const [page,setPage]=useState("dashboard"), [projects,setProjects]=useState([]), [tasks,setTasks]=useState([]), [users,setUsers]=useState([]), [activities,setActivities]=useState([]), [selected,setSelected]=useState(null), [mobile,setMobile]=useState(false);
  const [stats,setStats]=useState({}), [refresh,setRefresh]=useState(0);
  const load=async()=>{ try {
    const [p,t,u,a,s]=await Promise.all([api.get("/projects"),api.get("/tasks"),api.get("/users"),api.get("/activities"),api.get("/dashboard")]);
    setProjects(p.data);setTasks(t.data);setUsers(u.data);setActivities(a.data);setStats(s.data);
    if (!selected && p.data[0]) setSelected(p.data[0]);
  } catch(e){ if(e.response?.status===401) onLogout(); }};
  useEffect(()=>{load()},[refresh]);
  useEffect(()=>{const go=e=>setPage(e.detail); window.addEventListener("devsync:navigate",go); return ()=>window.removeEventListener("devsync:navigate",go)},[]);
  const nav=(x)=>{setPage(x);setMobile(false)};
  const currentTasks=selected?tasks.filter(t=>t.project?._id===selected._id):tasks;
  return <div className="app">
    <aside className={mobile?"sidebar open":"sidebar"}>
      <div className="brand"><span className="brand-mark">D</span> DevSync</div>
      <div className="workspace">WORKSPACE <span>⌄</span></div>
      <Nav icon={<LayoutDashboard/>} text="Dashboard" active={page==="dashboard"} onClick={()=>nav("dashboard")}/>
      <Nav icon={<FolderKanban/>} text="Projects" active={page==="projects"} onClick={()=>nav("projects")}/>
      <Nav icon={<CheckSquare/>} text="Tasks" active={page==="tasks"} onClick={()=>nav("tasks")}/>
      <Nav icon={<Users/>} text="Team" active={page==="team"} onClick={()=>nav("team")}/>
      <Nav icon={<MessageSquare/>} text="Chat" active={page==="chat"} onClick={()=>nav("chat")}/>
      <Nav icon={<Github/>} text="GitHub" active={page==="github"} onClick={()=>nav("github")}/>
      <Nav icon={<BarChart3/>} text="Analytics" active={page==="analytics"} onClick={()=>nav("analytics")}/>
      <Nav icon={<Bot/>} text="AI Assistant" active={page==="ai"} onClick={()=>nav("ai")}/>
      <div className="sidebar-bottom"><Nav icon={<Settings/>} text="Settings" active={false} onClick={()=>{}}/><Nav icon={<LogOut/>} text="Logout" active={false} onClick={onLogout}/></div>
    </aside>
    {mobile && <div className="overlay" onClick={()=>setMobile(false)} />}
    <main className="main">
      <header><button className="mobile-menu" onClick={()=>setMobile(true)}><Menu/></button><div className="search"><Search size={17}/><input placeholder="Search projects, tasks..." /></div><div className="header-right"><div className="status-dot"/><span>Online</span><div className="avatar">B</div></div></header>
      <div className="content">
        {page==="dashboard" && <Home stats={stats} tasks={tasks} projects={projects} activities={activities} onNew={()=>setPage("projects")} />}
        {page==="projects" && <Projects projects={projects} selected={selected} setSelected={setSelected} refresh={()=>setRefresh(x=>x+1)} users={users}/>}
        {page==="tasks" && <Tasks tasks={currentTasks.length?currentTasks:tasks} projects={projects} users={users} refresh={()=>setRefresh(x=>x+1)} />}
        {page==="team" && <Team users={users} projects={projects}/>}
        {page==="chat" && <Chat projects={projects} selected={selected}/>}
        {page==="ai" && <AI/>}
        {page==="github" && <GitHub/>}
        {page==="analytics" && <Analytics tasks={tasks} projects={projects}/>}
      </div>
    </main>
  </div>
}

function Nav({icon,text,active,onClick}) { return <button className={active?"nav active":"nav"} onClick={onClick}>{React.cloneElement(icon,{size:18})}<span>{text}</span></button> }

function Home({stats,tasks,projects,activities,onNew}) {
  const completed = tasks.filter(t => t.status === "DONE").length;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const blockers = tasks.filter(
    t => t.priority === "High" && t.status !== "DONE"
  );

  const selectedProject = projects[0];

  const taskStats = [
    {
      title: "Total Projects",
      value: stats.projects || 0,
      icon: <FolderKanban />,
      className: "purple",
      trend: "+100%",
      label: "vs last week"
    },
    {
      title: "Total Tasks",
      value: stats.tasks || 0,
      icon: <CheckSquare />,
      className: "blue",
      trend: "+33%",
      label: "vs last week"
    },
    {
      title: "Completion",
      value: `${progress}%`,
      icon: <BarChart3 />,
      className: "green",
      trend: "+12%",
      label: "vs last week"
    },
    {
      title: "Blockers",
      value: blockers.length,
      icon: <AlertCircle />,
      className: "orange",
      trend: blockers.length ? "!" : "✓",
      label: blockers.length ? "Needs attention" : "All clear"
    },
    {
      title: "Team Members",
      value: stats.users || 0,
      icon: <Users />,
      className: "pink",
      trend: "↑",
      label: "this workspace"
    }
  ];

  return (
    <>
      {/* HERO */}
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">ENGINEERING OVERVIEW</p>

          <h1>
            Good to see you, Bharat!{" "}
            <span className="wave">👋</span>
          </h1>

          <p className="hero-subtitle">
            Here's what's happening across your development workspace today.
          </p>
        </div>

        <div className="hero-actions">
          <button
            className="dashboard-secondary"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("devsync:navigate", {
                  detail: "chat"
                })
              )
            }
          >
            <MessageSquare size={17} />
            Open Chat
          </button>

          <button className="primary glow-button" onClick={onNew}>
            <Plus size={18} />
            New Project
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="color-stats">
        {taskStats.map(stat => (
          <div
            className={`color-stat-card ${stat.className}`}
            key={stat.title}
          >
            <div className="stat-top">
              <div className="color-stat-icon">
                {stat.icon}
              </div>

              <div className="sparkline">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="stat-title">
              {stat.title}
            </div>

            <div className="stat-value">
              {stat.value}
            </div>

            <div className="stat-trend">
              <b>{stat.trend}</b> {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-v3-grid">

        {/* PROJECT HEALTH */}
        <section className="dashboard-card project-health-card">

          <div className="card-heading">
            <div>
              <h3>Project Health Overview</h3>
              <p>Delivery progress</p>
            </div>

            <span className="on-track">
              <span />
              ON TRACK
            </span>
          </div>

          <div className="project-summary">

            <div className="project-avatar-large">
              {selectedProject?.name?.[0] || "D"}
            </div>

            <div className="project-summary-text">
              <h2>
                {selectedProject?.name || "DevSync Platform"}
              </h2>

              <p>
                {selectedProject?.description ||
                  "AI-powered developer collaboration platform for managing projects, tasks, team communication and development workflows."}
              </p>
            </div>

            <div className="progress-ring">
              <svg viewBox="0 0 120 120">
                <circle
                  className="ring-bg"
                  cx="60"
                  cy="60"
                  r="50"
                />

                <circle
                  className="ring-progress"
                  cx="60"
                  cy="60"
                  r="50"
                  style={{
                    strokeDasharray: `${progress * 3.14} 314`
                  }}
                />
              </svg>

              <div className="ring-content">
                <strong>{progress}%</strong>
                <span>Progress</span>
              </div>
            </div>
          </div>

          <div className="large-progress">
            <div
              className="large-progress-fill"
              style={{
                width: `${progress}%`
              }}
            />
          </div>

          <div className="progress-labels">
            <span>
              {completed} of {tasks.length} tasks completed
            </span>

            <span>
              {tasks.length - completed} remaining
            </span>
          </div>

          {/* STATUS BOXES */}
          <div className="status-grid">

            {[
              ["TODO", "purple"],
              ["IN PROGRESS", "blue"],
              ["REVIEW", "orange"],
              ["DONE", "green"]
            ].map(([status, color]) => (
              <div
                className={`status-box ${color}`}
                key={status}
              >
                <strong>
                  {
                    tasks.filter(
                      task => task.status === status
                    ).length
                  }
                </strong>

                <span>{status}</span>
              </div>
            ))}

          </div>
        </section>

        {/* ACTIVITY */}
        <section className="dashboard-card activity-card">

          <div className="card-heading">
            <div>
              <h3>Today's Activity</h3>
              <p>Latest workspace events</p>
            </div>

            <span className="live-badge">
              <span />
              LIVE
            </span>
          </div>

          <div className="activity-list">

            {activities.slice(0, 6).map((activity, index) => (

              <div
                className="timeline-item"
                key={activity._id}
                style={{
                  animationDelay: `${index * 0.08}s`
                }}
              >

                <div
                  className={`timeline-icon ${
                    index % 3 === 0
                      ? "purple-icon"
                      : index % 3 === 1
                      ? "blue-icon"
                      : "green-icon"
                  }`}
                >
                  {index % 2 === 0 ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <GitCommit size={15} />
                  )}
                </div>

                <div className="timeline-content">

                  <div>
                    <strong>
                      {activity.user?.name || "Developer"}
                    </strong>{" "}
                    <span>{activity.action}</span>
                  </div>

                  <small>
                    {new Date(
                      activity.createdAt
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </small>

                </div>

              </div>
            ))}

            {!activities.length && (
              <Empty text="Your activity will appear here." />
            )}

          </div>

          <div className="view-all">
            View all activity →
          </div>

        </section>

      </div>

      {/* SECOND ROW */}
      <div className="dashboard-v3-grid second">

        {/* TASK DISTRIBUTION */}
        <section className="dashboard-card chart-card">

          <div className="card-heading">
            <div>
              <h3>Task Distribution</h3>
              <p>Current workload</p>
            </div>
          </div>

          <div className="task-donut-wrapper">

            <div className="task-donut">
              <div className="donut-center">
                <strong>{tasks.length}</strong>
                <span>Tasks</span>
              </div>
            </div>

            <div className="donut-legend">

              {[
                ["TODO", "purple"],
                ["IN PROGRESS", "blue"],
                ["REVIEW", "orange"],
                ["DONE", "green"]
              ].map(([status, color]) => {

                const count = tasks.filter(
                  t => t.status === status
                ).length;

                const percentage = tasks.length
                  ? Math.round((count / tasks.length) * 100)
                  : 0;

                return (
                  <div
                    className="legend-row"
                    key={status}
                  >
                    <span className={`legend-dot ${color}`} />

                    <span>
                      {status}
                    </span>

                    <strong>
                      {percentage}% ({count})
                    </strong>
                  </div>
                );
              })}

            </div>

          </div>

        </section>

        {/* PRIORITY */}
        <section className="dashboard-card chart-card">

          <div className="card-heading">
            <div>
              <h3>Priority Breakdown</h3>
              <p>Task urgency</p>
            </div>
          </div>

          <div className="priority-visual">

            <div className="priority-circle">
              <div>
                🔥
              </div>
            </div>

            <div className="priority-list">

              {[
                ["High", "red"],
                ["Medium", "yellow"],
                ["Low", "green"]
              ].map(([priority, color]) => {

                const count = tasks.filter(
                  t => t.priority === priority
                ).length;

                const percentage = tasks.length
                  ? Math.round((count / tasks.length) * 100)
                  : 0;

                return (
                  <div
                    className="priority-row"
                    key={priority}
                  >
                    <span className={`priority-dot-big ${color}`} />

                    <span>{priority}</span>

                    <strong>
                      {percentage}% ({count})
                    </strong>
                  </div>
                );
              })}

            </div>

          </div>

        </section>

        {/* GITHUB */}
        <section className="dashboard-card github-card-v3">

          <div className="github-heading">
            <div>
              <Github size={24} />
            </div>

            <div>
              <h3>GitHub Snapshot</h3>
              <p>Repository activity</p>
            </div>

            <span className="github-live">
              Updated now
            </span>
          </div>

          <div className="github-v3-stats">

            <div>
              <GitCommit />
              <strong>4</strong>
              <span>Commits</span>
            </div>

            <div>
              <GitPullRequest />
              <strong>2</strong>
              <span>Pull Requests</span>
            </div>

            <div>
              <CircleDot />
              <strong>5</strong>
              <span>Issues</span>
            </div>

            <div>
              <Star />
              <strong>12</strong>
              <span>Stars</span>
            </div>

          </div>

          <button
            className="github-button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("devsync:navigate", {
                  detail: "github"
                })
              )
            }
          >
            View Repository →
          </button>

        </section>

      </div>

      {/* BOTTOM */}
      <div className="dashboard-v3-grid bottom">

        {/* PRIORITY TASKS */}
        <section className="dashboard-card">

          <div className="card-heading">
            <div>
              <h3>🔥 Priority Work</h3>
              <p>Tasks that need attention</p>
            </div>

            <span className="danger-count">
              {blockers.length} blockers
            </span>
          </div>

          {blockers.slice(0, 4).map(task => (
            <TaskRow
              key={task._id}
              task={task}
            />
          ))}

          {!blockers.length && (
            <div className="clear-state">
              <CheckCircle2 size={24} />
              <div>
                <b>No active blockers</b>
                <small>
                  Everything is moving smoothly.
                </small>
              </div>
            </div>
          )}

        </section>

        {/* QUICK ACTIONS */}
        <section className="dashboard-card quick-actions-card">

          <div className="card-heading">
            <div>
              <h3>Quick Actions</h3>
              <p>Jump into your workflow</p>
            </div>
          </div>

          <div className="quick-action-grid">

            <button onClick={() =>
              window.dispatchEvent(
                new CustomEvent("devsync:navigate", {
                  detail: "tasks"
                })
              )
            }>
              <CheckSquare />
              <span>New Task</span>
            </button>

            <button onClick={() =>
              window.dispatchEvent(
                new CustomEvent("devsync:navigate", {
                  detail: "team"
                })
              )
            }>
              <Users />
              <span>Team</span>
            </button>

            <button onClick={() =>
              window.dispatchEvent(
                new CustomEvent("devsync:navigate", {
                  detail: "tasks"
                })
              )
            }>
              <FolderKanban />
              <span>Kanban</span>
            </button>

            <button onClick={() =>
              window.dispatchEvent(
                new CustomEvent("devsync:navigate", {
                  detail: "ai"
                })
              )
            }>
              <Bot />
              <span>AI Assistant</span>
            </button>

          </div>

        </section>

      </div>
    </>
  );
}  

function TaskRow({task}) { return <div className="task-row"><div className={"check "+task.status.toLowerCase().replace(" ","-")}>{task.status==="DONE"?<CheckCircle2 size={16}/>:<Circle size={16}/>}</div><div className="task-main"><b>{task.title}</b><small>{task.project?.name||"Project"} · {task.assignedTo?.name||"Unassigned"}</small></div><span className={"priority "+task.priority.toLowerCase()}>{task.priority}</span><span className={"pill "+task.status.toLowerCase().replace(" ","-")}>{task.status}</span></div> }

function Projects({projects,selected,setSelected,refresh,users}) {
  const [show,setShow]=useState(false), [form,setForm]=useState({name:"",description:""});
  const create=async e=>{e.preventDefault();await api.post("/projects",form);setForm({name:"",description:""});setShow(false);refresh()};
  const remove=async id=>{if(confirm("Delete this project?")){await api.delete("/projects/"+id);refresh()}};
  return <><div className="page-head"><div><p className="eyebrow">WORKSPACE</p><h1>Projects</h1><p className="muted">Plan and manage your development work.</p></div><button className="primary" onClick={()=>setShow(true)}><Plus size={18}/> New Project</button></div>
  <div className="project-grid large">{projects.map(p=><div className={"project-card clickable "+(selected?._id===p._id?"selected":"")} key={p._id} onClick={()=>setSelected(p)}><div className="project-top"><div className="project-icon">{p.name[0]}</div><button className="icon-btn" onClick={e=>{e.stopPropagation();remove(p._id)}}><Trash2 size={16}/></button></div><h3>{p.name}</h3><p>{p.description||"No description"}</p><div className="project-foot"><span>{p.members?.length||0} members</span><span>{selected?._id===p._id?"Selected":"Open"}</span></div></div>)}</div>
  {show&&<Modal title="Create new project" close={()=>setShow(false)}><form onSubmit={create}><label>Project name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><button className="primary full">Create Project</button></form></Modal>}
  </>
}



function Tasks({tasks,projects,users,refresh}) {
  const [show,setShow]=useState(false), [form,setForm]=useState({title:"",description:"",project:projects[0]?._id||"",assignedTo:"",priority:"Medium"});
  useEffect(()=>{if(!form.project&&projects[0])setForm(f=>({...f,project:projects[0]._id}))},[projects]);
  const create=async e=>{e.preventDefault();await api.post("/tasks",{...form,assignedTo:form.assignedTo||undefined});setShow(false);setForm(f=>({...f,title:"",description:""}));refresh()};
  const move=async(t,status)=>{await api.put("/tasks/"+t._id,{status});refresh()};
  return <><div className="page-head"><div><p className="eyebrow">TRACKING</p><h1>Tasks</h1><p className="muted">Move work through your delivery pipeline.</p></div><button className="primary" onClick={()=>setShow(true)}><Plus size={18}/> New Task</button></div>
  <div className="kanban">{["TODO","IN PROGRESS","REVIEW","DONE"].map(status=><div className="column" key={status}><div className="column-head"><span>{status}</span><b>{tasks.filter(t=>t.status===status).length}</b></div>{tasks.filter(t=>t.status===status).map(t=><div className="kanban-card" key={t._id}><div className="card-line"><span className={"priority-dot "+t.priority.toLowerCase()}/><span className="priority-label">{t.priority}</span></div><h3>{t.title}</h3><p>{t.description}</p><small>{t.project?.name||"Project"}</small><div className="card-actions">{status!=="TODO"&&<button onClick={()=>move(t,status==="IN PROGRESS"?"TODO":status==="REVIEW"?"IN PROGRESS":"REVIEW")}>←</button>}{status!=="DONE"&&<button onClick={()=>move(t,status==="TODO"?"IN PROGRESS":status==="IN PROGRESS"?"REVIEW":"DONE")}>→</button>}</div></div>)}</div>)}</div>
  {show&&<Modal title="Create task" close={()=>setShow(false)}><form onSubmit={create}><label>Task title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Project<select value={form.project} onChange={e=>setForm({...form,project:e.target.value})}>{projects.map(p=><option value={p._id} key={p._id}>{p.name}</option>)}</select></label><label>Assign to<select value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})}><option value="">Unassigned</option>{users.map(u=><option key={u._id} value={u._id}>{u.name}</option>)}</select></label><label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><button className="primary full">Create Task</button></form></Modal>}
  </>
}

function Team({users,projects}) { return <><div className="page-head"><div><p className="eyebrow">COLLABORATION</p><h1>Team</h1><p className="muted">People working across your workspace.</p></div></div><div className="team-grid">{users.map(u=><div className="team-card" key={u._id}><div className="big-avatar">{u.name?.[0]}</div><h3>{u.name}</h3><span>{u.role}</span><p>{u.email}</p><div>{projects.filter(p=>p.members?.some(m=>m._id===u._id)).length} projects</div></div>)}</div></> }

function Chat({projects,selected}) {
  const [project, setProject] = useState(selected?._id || projects[0]?._id || "");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socket] = useState(() => socketIO("https://devsync-developer-collaboration-platform.onrender.com"));
  useEffect(()=>{if(selected)setProject(selected._id)},[selected]);
  const load=async()=>{if(project){const r=await api.get("/messages?project="+project);setMessages(r.data)}}; useEffect(()=>{load(); if(project){socket.emit("join-project",project);}},[project]);
  useEffect(()=>{ const handler=(msg)=>setMessages(prev=>prev.some(x=>x._id===msg._id)?prev:[...prev,msg]); socket.on("project-message",handler); return ()=>socket.off("project-message",handler);},[socket]);
  const send=async e=>{e.preventDefault();if(!text.trim())return;const r=await api.post("/messages",{project,message:text});setText("");socket.emit("project-message",r.data);load()};
  return <><div className="page-head"><div><p className="eyebrow">TEAM CHAT</p><h1>Chat</h1><p className="muted">Project conversation and quick updates.</p></div><select className="top-select" value={project} onChange={e=>setProject(e.target.value)}>{projects.map(p=><option value={p._id} key={p._id}>{p.name}</option>)}</select></div><div className="chat panel"><div className="messages">{messages.map(m=><div className="message" key={m._id}><div className="avatar small">{m.sender?.name?.[0]}</div><div><b>{m.sender?.name}</b><small>{new Date(m.createdAt).toLocaleTimeString()}</small><p>{m.message}</p></div></div>)}{!messages.length&&<Empty text="No messages yet. Start the conversation."/>}</div><form className="chat-input" onSubmit={send}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Message your team..."/><button className="primary"><Send size={17}/></button></form></div></>
}


function AI() {
  const [messages,setMessages]=useState([{role:"ai",text:"Hi! I'm DevSync AI. Ask me about project status, blockers, tasks, or what your team should work on next."}]),[input,setInput]=useState(""),[loading,setLoading]=useState(false);
  const ask=async prompt=>{const p=prompt||input;if(!p.trim())return;setMessages(m=>[...m,{role:"user",text:p}]);setInput("");setLoading(true);try{const r=await api.post("/ai/chat",{prompt:p});setMessages(m=>[...m,{role:"ai",text:r.data.answer}])}catch{setMessages(m=>[...m,{role:"ai",text:"Unable to reach the AI service."}])}finally{setLoading(false)}};
  return <><div className="page-head"><div><p className="eyebrow">INTELLIGENCE</p><h1>AI Assistant</h1><p className="muted">Get project-aware insights from your workspace.</p></div><div className="ai-badge"><Sparkles size={16}/> AI powered</div></div><div className="ai-layout"><div className="ai-chat panel">{messages.map((m,i)=><div className={"ai-msg "+m.role} key={i}><div className="ai-icon">{m.role==="ai"?<Bot size={17}/>:<span>B</span>}</div><div><p>{m.text}</p></div></div>)}{loading&&<div className="ai-msg ai"><div className="ai-icon"><Bot size={17}/></div><p>Thinking…</p></div>}<form className="ai-input" onSubmit={e=>{e.preventDefault();ask()}}><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about your project..."/><button className="primary"><Send size={17}/></button></form></div><div className="ai-prompts panel"><h3>Quick actions</h3><button onClick={()=>ask("Give me a project status summary.")}><Sparkles/> Project status</button><button onClick={()=>ask("Find high priority blockers.")}><AlertCircle/> Find blockers</button><button onClick={()=>ask("What should we work on next?")}><CheckSquare/> Next steps</button></div></div></>
}


function GitHub() {
  const [data,setData]=useState(null), [loading,setLoading]=useState(true), [error,setError]=useState("");
  useEffect(()=>{api.get("/github/overview").then(r=>setData(r.data)).catch(e=>setError(e.response?.data?.message||"GitHub unavailable")).finally(()=>setLoading(false))},[]);
  if(loading) return <div className="empty">Loading GitHub workspace…</div>;
  if(error) return <div className="panel error-box">{error}</div>;
  return <><div className="page-head"><div><p className="eyebrow">CODE COLLABORATION</p><h1>GitHub</h1><p className="muted">Repository activity connected to your development workflow.</p></div><div className="github-connected"><span/> {data.connected?"Connected":"Demo repository"}</div></div>
    <div className="github-hero panel"><div><div className="repo-title"><Github/> {data.repository.full_name}</div><p className="muted">Primary development repository</p></div><div className="repo-stats"><span><Star/> {data.repository.stars}</span><span><GitFork/> {data.repository.forks}</span><span><CircleDot/> {data.repository.open_issues} issues</span><b>{data.repository.language||"Code"}</b></div></div>
    <div className="github-grid">
      <section className="panel"><div className="panel-head"><h3><GitCommit/> Recent Commits</h3></div>{data.commits.map(c=><div className="gh-row" key={c.sha}><div className="commit-icon"><GitCommit/></div><div><b>{c.message}</b><small>{c.author} · {c.sha}</small></div></div>)}</section>
      <section className="panel"><div className="panel-head"><h3><CircleDot/> Open Issues</h3></div>{data.issues.map(i=><div className="gh-row" key={i.number}><div className="issue-icon">#{i.number}</div><div><b>{i.title}</b><small>{i.labels.join(" · ")||"open issue"}</small></div></div>)}</section>
    </div>
    <section className="panel"><div className="panel-head"><h3><GitPullRequest/> Pull Requests</h3></div>{data.pulls.map(p=><div className="gh-row" key={p.number}><div className={"pr-state "+p.state}>{p.state==="merged"?"✓":"→"}</div><div><b>#{p.number} {p.title}</b><small>{p.author} · {p.state}</small></div></div>)}</section>
  </>
}

function Analytics({tasks,projects}) {
  const statuses=["TODO","IN PROGRESS","REVIEW","DONE"];
  const data=statuses.map(s=>({name:s,value:tasks.filter(t=>t.status===s).length}));
  const priority=["Low","Medium","High"].map(p=>({name:p,value:tasks.filter(t=>t.priority===p).length}));
  const total=tasks.length||1, completed=tasks.filter(t=>t.status==="DONE").length;
  return <><div className="page-head"><div><p className="eyebrow">ENGINEERING INSIGHTS</p><h1>Analytics</h1><p className="muted">Understand delivery progress across your workspace.</p></div><div className="completion">{Math.round(completed/total*100)}% completed</div></div>
    <div className="stats"><div className="stat"><div className="stat-icon"><CheckCircle2/></div><div><span>Completion</span><strong>{Math.round(completed/total*100)}%</strong></div></div><div className="stat"><div className="stat-icon"><CheckSquare/></div><div><span>Open Work</span><strong>{tasks.length-completed}</strong></div></div><div className="stat"><div className="stat-icon"><FolderKanban/></div><div><span>Projects</span><strong>{projects.length}</strong></div></div><div className="stat"><div className="stat-icon"><AlertCircle/></div><div><span>High Priority</span><strong>{tasks.filter(t=>t.priority==="High"&&t.status!=="DONE").length}</strong></div></div></div>
    <div className="analytics-grid"><section className="panel chart"><div className="panel-head"><h3>Task Distribution</h3></div><ResponsiveContainer width="100%" height={280}><BarChart data={data}><XAxis dataKey="name" tick={{fill:"#7b8698",fontSize:10}}/><YAxis allowDecimals={false} tick={{fill:"#7b8698",fontSize:10}}/><Tooltip contentStyle={{background:"#11161f",border:"1px solid #2a3340",color:"#fff"}}/><Bar dataKey="value" fill="#7865ff" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></section>
    <section className="panel chart"><div className="panel-head"><h3>Priority Mix</h3></div><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={priority} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={55}>{priority.map((_,i)=><Cell key={i} fill={["#43cda3","#e5c25e","#ff6687"][i]}/>)}</Pie><Tooltip contentStyle={{background:"#11161f",border:"1px solid #2a3340",color:"#fff"}}/></PieChart></ResponsiveContainer></section></div>
  </>
}

function Modal({title,close,children}){return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={close}><X/></button></div>{children}</div></div>}
function Empty({text}){return <div className="empty">{text}</div>}

createRoot(document.getElementById("root")).render(<App/>);