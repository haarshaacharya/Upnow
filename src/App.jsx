import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [activePage, setActivePage] = useState("Overview");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Load projects from the backend database.
  async function fetchProjects() {
    try {
      const response = await fetch(`${API_URL}/projects`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load projects.");
      }

      setProjects(data.projects);
      setMessage("");
    } catch (error) {
      console.error("Fetch projects error:", error);
      setMessage(
        "Could not connect to the backend. Make sure your server is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  async function addProject(e) {
    e.preventDefault();

    const name = projectName.trim();

    if (!name) {
      setMessage("Please enter a project name.");
      return;
    }

    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) {
      setMessage(
        "Use letters, numbers, dots, hyphens or underscores in the project name."
      );
      return;
    }

    const duplicate = projects.some(
      (project) => project.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      setMessage("A project with this name already exists.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          framework: "React",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not create project.");
      }

      // Use the project returned by SQLite, including its database ID.
      setProjects((previous) => [data.project, ...previous]);
      setProjectName("");
      setShowForm(false);
      setActivePage("Projects");
      setMessage("Project created and saved successfully!");
    } catch (error) {
      console.error("Create project error:", error);
      setMessage(error.message || "Could not create project.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(id) {
    const project = projects.find((item) => item.id === id);

    if (!project) return;

    const confirmed = window.confirm(
      `Remove "${project.name}" from your Upnow workspace?`
    );

    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not delete project.");
      }

      setProjects((previous) =>
        previous.filter((item) => item.id !== id)
      );

      setMessage("Project deleted successfully.");
    } catch (error) {
      console.error("Delete project error:", error);
      setMessage(error.message || "Could not delete project.");
    } finally {
      setDeletingId(null);
    }
  }

  function openProject(project) {
    window.alert(
      `Project: ${project.name}\n` +
        `Framework: ${project.framework}\n` +
        `Status: ${project.status}\n\n` +
        "Real builds and deployments will be added in a later step."
    );
  }

  const navigation = [
    { name: "Overview", icon: "▦" },
    { name: "Projects", icon: "◇" },
    { name: "Deployments", icon: "↗" },
    { name: "Domains", icon: "◎" },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="logo"
          href="#overview"
          onClick={() => {
            setActivePage("Overview");
            setMessage("");
          }}
        >
          <img src="/upnow.jpeg" alt="Upnow logo" />

          <span className="logo-text">
            Upnow<span className="logo-dot"></span>
          </span>
        </a>

        <p className="nav-label">WORKSPACE</p>

        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(item.name);
                setMessage("");
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="avatar">H</div>

          <div className="workspace-info">
            <strong>My Workspace</strong>
            <p>Free Plan</p>
          </div>

          <span className="workspace-menu">···</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>My Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <span className="online-indicator">
              <i />
              {loading ? "Loading projects" : "Dashboard active"}
            </span>

            <div className="profile">H</div>
          </div>
        </header>

        <section className="content">
          {message && (
            <div
              className="notice"
              role="status"
              style={{ marginBottom: "20px" }}
            >
              <span>ⓘ</span>
              <span>{message}</span>

              <button
                type="button"
                className="more-btn"
                onClick={() => setMessage("")}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}

          {activePage === "Overview" && (
            <>
              <section className="welcome">
                <div className="welcome-copy">
                  <p className="eyebrow">
                    <span className="eyebrow-dot" />
                    YOUR WORKSPACE
                  </p>

                  <h1>
                    Build something
                    <br />
                    <span>great.</span>
                  </h1>

                  <p className="muted">
                    Your projects, deployments, and everything in between.
                    <br />
                    Everything you need to ship your next big idea.
                  </p>

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => {
                      setShowForm(true);
                      setActivePage("Projects");
                      setMessage("");
                    }}
                  >
                    <span>＋</span> Add New Project
                  </button>
                </div>

                <div className="hero-visual" aria-hidden="true">
                  <div className="glow glow-one" />
                  <div className="glow glow-two" />

                  <div className="hero-orbit orbit-one" />
                  <div className="hero-orbit orbit-two" />

                  <div className="hero-logo">
                    <img src="/upnow.jpeg" alt="" />
                  </div>

                  <div className="floating-card floating-card-top">
                    <span className="mini-status" />
                    Dashboard ready
                  </div>

                  <div className="floating-card floating-card-bottom">
                    <span className="code-symbol">{"</>"}</span>

                    <span>
                      <strong>Built for developers</strong>
                      <small>Simple. Fast. Yours.</small>
                    </span>
                  </div>
                </div>
              </section>

              <div className="section-title-row">
                <div>
                  <h2>Workspace overview</h2>
                  <p className="muted">
                    Here's what's happening with your projects.
                  </p>
                </div>
              </div>

              <div className="stats">
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Total Projects</span>
                    <span className="stat-icon blue-icon">◇</span>
                  </div>

                  <h3>{projects.length}</h3>
                  <p className="stat-note">Projects in your workspace</p>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Successful Deployments</span>
                    <span className="stat-icon green-icon">↗</span>
                  </div>

                  <h3>0</h3>
                  <p className="stat-note">
                    Real deployments not configured yet
                  </p>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Workspace Plan</span>
                    <span className="stat-icon purple-icon">✦</span>
                  </div>

                  <h3 className="plan-value">Free</h3>
                  <p className="stat-note">Your journey starts here</p>
                </article>
              </div>

              <ProjectsSection
                projects={projects}
                loading={loading}
                deletingId={deletingId}
                onDelete={deleteProject}
                onOpen={openProject}
              />
            </>
          )}

          {activePage === "Projects" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">YOUR WORKSPACE</p>
                  <h1>Your Projects</h1>

                  <p className="muted">
                    Create and organize your applications in one place.
                  </p>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    setShowForm((previous) => !previous);
                    setMessage("");
                  }}
                >
                  ＋ New Project
                </button>
              </div>

              {showForm && (
                <form className="project-form" onSubmit={addProject}>
                  <label htmlFor="projectName">Project name</label>

                  <p className="muted">
                    Choose a unique name for your new project.
                  </p>

                  <div className="form-row">
                    <input
                      id="projectName"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="my-awesome-project"
                      required
                      autoFocus
                      maxLength={60}
                      disabled={saving}
                    />

                    <button
                      className="primary-btn"
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? "Creating..." : "Create Project"}
                    </button>

                    <button
                      className="secondary-btn"
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setShowForm(false);
                        setProjectName("");
                        setMessage("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <ProjectsSection
                projects={projects}
                loading={loading}
                deletingId={deletingId}
                onDelete={deleteProject}
                onOpen={openProject}
              />
            </>
          )}

          {activePage === "Deployments" && (
            <div className="placeholder-page">
              <div className="placeholder-icon">↗</div>

              <p className="eyebrow">DEPLOYMENT CENTER</p>
              <h1>Your deployments</h1>

              <p className="muted">
                Your deployment history will appear here once the build
                and hosting engine is connected.
              </p>

              <div className="notice">
                <span>ⓘ</span>
                <span>
                  This dashboard is currently a frontend prototype.
                  It does not deploy real websites yet.
                </span>
              </div>

              <button
                type="button"
                className="primary-btn"
                onClick={() => setActivePage("Projects")}
              >
                View Projects →
              </button>
            </div>
          )}

          {activePage === "Domains" && (
            <div className="placeholder-page">
              <div className="placeholder-icon">◎</div>

              <p className="eyebrow">CUSTOM DOMAINS</p>
              <h1>Domains</h1>

              <p className="muted">
                Manage custom domains and connect them to your projects here.
              </p>

              <div className="notice">
                <span>ⓘ</span>
                <span>
                  Domain verification, DNS records, and SSL certificates
                  will be implemented in a later step.
                </span>
              </div>

              <button
                type="button"
                className="primary-btn"
                onClick={() => setActivePage("Projects")}
              >
                View Projects →
              </button>
            </div>
          )}

          <footer>
            Made for builders. Powered by <strong>Upnow.</strong>
            <span className="footer-version">MVP · v0.3</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

function ProjectsSection({
  projects,
  loading,
  deletingId,
  onDelete,
  onOpen,
}) {
  return (
    <section className="projects-section">
      <div className="section-heading">
        <div>
          <h2>Your Projects</h2>
          <p className="muted">Manage your applications.</p>
        </div>

        <span className="count">
          {projects.length}{" "}
          {projects.length === 1 ? "project" : "projects"}
        </span>
      </div>

      <div className="project-list">
        {loading && (
          <div className="empty">
            <h3>Loading projects...</h3>
            <p>Fetching your projects from the Upnow database.</p>
          </div>
        )}

        {!loading &&
          projects.map((project) => (
            <article className="project-row" key={project.id}>
              <div className="project-icon">▲</div>

              <div className="project-info">
                <strong>{project.name}</strong>
                <span>{project.framework} · Created in workspace</span>
              </div>

              <span className="status">
                <i /> {project.status}
              </span>

              <button
                className="more-btn"
                type="button"
                onClick={() => onOpen(project)}
                aria-label={`Open ${project.name}`}
                title="Project details"
              >
                ↗
              </button>

              <button
                className="more-btn delete-btn"
                type="button"
                onClick={() => onDelete(project.id)}
                disabled={deletingId === project.id}
                aria-label={`Remove ${project.name}`}
                title="Remove project"
              >
                {deletingId === project.id ? "…" : "×"}
              </button>
            </article>
          ))}

        {!loading && projects.length === 0 && (
          <div className="empty">
            <div className="empty-icon">◇</div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default App;