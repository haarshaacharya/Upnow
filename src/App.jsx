import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// Components
import { Header } from "./components/Header";
import { NavigationTabs } from "./components/NavigationTabs";
import { ProjectCard } from "./components/ProjectCard";
import { ProjectDetailsModal } from "./components/ProjectDetailsModal";
import { NewProjectModal } from "./components/NewProjectModal";
import { CommandPalette } from "./components/CommandPalette";
import { ToastContainer } from "./components/Toast";
import { AnalyticsView } from "./components/AnalyticsView";
import { DeploymentsView } from "./components/DeploymentsView";
import { DomainsView } from "./components/DomainsView";
import { SettingsView } from "./components/SettingsView";
import { GitHubView } from "./components/GitHubView";

// Icons
import {
  PlusIcon,
  SearchIcon,
  VercelTriangle,
  RefreshIcon,
  GitHubIcon,
  ActivityIcon,
} from "./components/Icons";

const API_URL = "http://localhost:5000/api";

const STARTER_PROJECTS = [
  {
    id: 1,
    name: "ai-prompt-studio",
    framework: "Next.js",
    status: "Ready",
    lastCommit: "feat: streaming response cache at edge",
    deployedAgo: "4m ago",
  },
  {
    id: 2,
    name: "upnow-docs",
    framework: "React",
    status: "Ready",
    lastCommit: "docs: add api reference and cli guide",
    deployedAgo: "18m ago",
  },
  {
    id: 3,
    name: "hyper-commerce",
    framework: "Vite",
    status: "Ready",
    lastCommit: "fix: stripe webhook signature verification",
    deployedAgo: "1h ago",
  },
  {
    id: 4,
    name: "portfolio-minimal",
    framework: "Static HTML",
    status: "Ready",
    lastCommit: "chore: update case study screenshots",
    deployedAgo: "3h ago",
  },
];

function App() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState("Overview");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("upnow_theme") || "dark";
  });

  // Projects State
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("All");

  // GitHub State
  const [githubRepos, setGithubRepos] = useState([]);
  const [githubAccount, setGithubAccount] = useState("");
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [importingRepoId, setImportingRepoId] = useState(null);

  // Modals & Drawers
  const [inspectProject, setInspectProject] = useState(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);

  // Toast Notification System
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((title, message, type = "info") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync theme changes with body class
  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
    localStorage.setItem("upnow_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Keyboard shortcut for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check URL query parameters for GitHub OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("github") === "connected") {
      const login = params.get("login") || "GitHub user";
      addToast(
        "GitHub Connected",
        `Successfully authenticated as @${login}`,
        "success"
      );
      // Clean query params
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchGithubConnection();
    }
  }, [addToast]);

  // Fetch Projects from backend
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/projects`, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      if (res.ok && data.success) {
        setServerOnline(true);
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects);
        } else {
          // If server has no projects yet, supply high-end starter set
          setProjects(STARTER_PROJECTS);
        }
      } else {
        throw new Error(data.message || "Failed to load projects");
      }
    } catch {
      // Backend offline or timeout -> Fallback to starter projects seamlessly
      setServerOnline(false);
      setProjects(STARTER_PROJECTS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch GitHub Connection Status
  const fetchGithubConnection = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/github/connection`, {
        signal: AbortSignal.timeout(3000),
      });
      const data = await res.json();
      if (res.ok && data.success && data.connected) {
        setIsGithubConnected(true);
        setGithubAccount(data.connection.github_username);
      } else {
        setIsGithubConnected(false);
      }
    } catch {
      setIsGithubConnected(false);
    }
  }, []);

  // Fetch GitHub Repositories
  const fetchGithubRepos = useCallback(async () => {
    setGithubLoading(true);
    try {
      const res = await fetch(`${API_URL}/github/repos`, {
        signal: AbortSignal.timeout(6000),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGithubRepos(data.repositories || []);
        setGithubAccount(data.account || "");
        setIsGithubConnected(true);
      } else {
        throw new Error(data.message || "Could not fetch repos");
      }
    } catch {
      // Provide mock repos if GitHub is not linked or backend offline
      setGithubRepos([
        {
          id: 101,
          name: "next-saas-starter",
          fullName: "haarsh/next-saas-starter",
          description: "Full-stack SaaS template with Next.js 15, Auth, and Edge Config.",
          language: "TypeScript",
          private: false,
          defaultBranch: "main",
          url: "https://github.com",
        },
        {
          id: 102,
          name: "react-flow-builder",
          fullName: "haarsh/react-flow-builder",
          description: "Interactive node graph diagram editor with SVG renderers.",
          language: "JavaScript",
          private: false,
          defaultBranch: "main",
          url: "https://github.com",
        },
        {
          id: 103,
          name: "edge-inference-api",
          fullName: "haarsh/edge-inference-api",
          description: "Ultra-fast LLM inference router running on global edge network.",
          language: "Python",
          private: true,
          defaultBranch: "main",
          url: "https://github.com",
        },
      ]);
    } finally {
      setGithubLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchGithubConnection();
  }, [fetchProjects, fetchGithubConnection]);

  // Connect GitHub trigger
  const handleConnectGithub = () => {
    window.location.href = `${API_URL}/github`;
  };

  // Add / Create New Project
  const handleCreateProject = async (projectData) => {
    setIsSavingProject(true);
    try {
      let created = null;

      if (serverOnline) {
        const response = await fetch(`${API_URL}/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: projectData.name,
            framework: projectData.framework,
          }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          created = data.project;
        } else {
          throw new Error(data.message || "Could not save project to database.");
        }
      }

      if (!created) {
        created = {
          id: Date.now(),
          name: projectData.name,
          framework: projectData.framework || "React",
          status: "Ready",
          lastCommit: "Initial deployment from workspace",
          deployedAgo: "Just now",
        };
      }

      setProjects((prev) => [created, ...prev]);
      setIsNewProjectOpen(false);
      addToast(
        "Project Deployed",
        `"${created.name}" is now live on the Upnow Edge Network.`,
        "success"
      );
      // Auto-open inspection modal for the newly deployed project
      setInspectProject(created);
    } catch (err) {
      addToast("Deployment Failed", err.message, "error");
    } finally {
      setIsSavingProject(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async (id) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;

    if (!window.confirm(`Delete project "${target.name}"? This will unassign its domain.`)) {
      return;
    }

    try {
      if (serverOnline) {
        await fetch(`${API_URL}/projects/${id}`, { method: "DELETE" });
      }
      setProjects((prev) => prev.filter((p) => p.id !== id));
      addToast("Project Removed", `"${target.name}" was successfully deleted.`, "info");
    } catch (err) {
      addToast("Error", err.message, "error");
    }
  };

  // Redeploy Project simulation
  const handleRedeployProject = (project) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? { ...p, status: "Ready", deployedAgo: "Just now" }
          : p
      )
    );
    addToast(
      "Redeployment Complete",
      `"${project.name}" rebuilt and propagated to 320+ edge regions.`,
      "success"
    );
  };

  // Import Repo from GitHub
  const handleImportRepo = async (repo) => {
    setImportingRepoId(repo.id);
    addToast("Importing Repository", `Downloading files for "${repo.name}" from GitHub...`, "info");

    try {
      if (serverOnline) {
        const importRes = await fetch(`${API_URL}/github/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoId: repo.id }),
        });
        const importData = await importRes.json();
        if (!importRes.ok || !importData.success) {
          throw new Error(importData.message || "Failed to import code");
        }
      }

      const newProj = {
        id: Date.now(),
        name: repo.name,
        framework: repo.language || "React",
        status: "Ready",
        lastCommit: `Imported from GitHub: ${repo.fullName}`,
        deployedAgo: "Just now",
      };

      setProjects((prev) => [newProj, ...prev]);
      setIsNewProjectOpen(false);
      addToast(
        "Import Succeeded",
        `Repository "${repo.name}" imported and deployed to Upnow.`,
        "success"
      );
    } catch (err) {
      addToast("Import Error", err.message, "error");
    } finally {
      setImportingRepoId(null);
    }
  };

  // Filter projects by search and framework
  const filteredProjects = projects.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFw =
      selectedFramework === "All" ||
      (p.framework || "").toLowerCase().includes(selectedFramework.toLowerCase());
    return matchesQuery && matchesFw;
  });

  const frameworksList = ["All", "React", "Next.js", "Vite", "Node.js"];

  return (
    <div className="vercel-app">
      {/* Toast Notification Stack */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Vercel Top Header */}
      <Header
        activeWorkspace="Haarsh's Workspace"
        githubAccount={githubAccount}
        isGithubConnected={isGithubConnected}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onConnectGithub={handleConnectGithub}
      />

      {/* Horizontal Tab Strip */}
      <NavigationTabs
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === "GitHub" && githubRepos.length === 0) {
            fetchGithubRepos();
          }
        }}
        counts={{
          projects: projects.length,
          deployments: projects.length * 2,
          repos: githubRepos.length,
          domains: 2,
        }}
      />

      {/* Main Page Content */}
      <main className="vercel-main-content">
        {/* OVERVIEW TAB */}
        {activeTab === "Overview" && (
          <div className="vercel-page overview-page">
            {/* Vercel Hero Welcome Banner */}
            <section className="overview-hero-banner">
              <div className="hero-glow-bg" />
              <div className="hero-content">
                <div className="hero-tag">
                  <span className="hero-tag-dot" />
                  UPNOW EDGE CLOUD
                </div>
                <h1 className="hero-headline">
                  Develop. Preview. Ship.
                </h1>
                <p className="hero-sub">
                  Deploy instantly with automated SSL, global Anycast routing, and high-performance continuous builds.
                </p>
                <div className="hero-actions">
                  <button
                    type="button"
                    className="vercel-btn vercel-btn-primary vercel-btn-lg"
                    onClick={() => setIsNewProjectOpen(true)}
                  >
                    <PlusIcon size={16} />
                    <span>Add New Project</span>
                  </button>
                  <button
                    type="button"
                    className="vercel-btn vercel-btn-secondary vercel-btn-lg"
                    onClick={() => setActiveTab("Analytics")}
                  >
                    <ActivityIcon size={16} />
                    <span>View Analytics</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Quick Metrics */}
            <div className="vercel-stats-grid">
              <div className="metric-card">
                <span className="metric-label">TOTAL PROJECTS</span>
                <div className="metric-row">
                  <span className="metric-number">{projects.length}</span>
                  <span className="metric-change pos">+100%</span>
                </div>
                <span className="metric-subtext">Active in workspace</span>
              </div>

              <div className="metric-card">
                <span className="metric-label">GLOBAL EDGE UPTIME</span>
                <div className="metric-row">
                  <span className="metric-number">99.99%</span>
                  <span className="metric-change pos">Healthy</span>
                </div>
                <span className="metric-subtext">Across 320+ edge regions</span>
              </div>

              <div className="metric-card">
                <span className="metric-label">P75 RESPONSE TIME</span>
                <div className="metric-row">
                  <span className="metric-number">28ms</span>
                  <span className="metric-change pos">Fast</span>
                </div>
                <span className="metric-subtext">Anycast routing enabled</span>
              </div>

              <div className="metric-card">
                <span className="metric-label">WORKSPACE PLAN</span>
                <div className="metric-row">
                  <span className="metric-number">Hobby</span>
                  <span className="metric-change pos">Free</span>
                </div>
                <span className="metric-subtext">100 GB Edge Bandwidth</span>
              </div>
            </div>

            {/* Projects Toolbar */}
            <div className="projects-filter-toolbar">
              <div className="search-input-wrapper">
                <SearchIcon size={15} className="search-input-icon" />
                <input
                  type="text"
                  className="vercel-input"
                  placeholder="Search projects by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="framework-filter-pills">
                {frameworksList.map((fw) => (
                  <button
                    key={fw}
                    type="button"
                    className={`fw-pill-btn ${
                      selectedFramework === fw ? "active" : ""
                    }`}
                    onClick={() => setSelectedFramework(fw)}
                  >
                    {fw}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="vercel-btn vercel-btn-primary"
                onClick={() => setIsNewProjectOpen(true)}
              >
                <PlusIcon size={14} />
                <span>New Project</span>
              </button>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length > 0 ? (
              <div className="projects-grid">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onInspect={(p) => setInspectProject(p)}
                    onDelete={handleDeleteProject}
                    onRedeploy={handleRedeployProject}
                    onCopyDomain={(url) =>
                      addToast("Domain Copied", url, "info")
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="empty-projects-card">
                <div className="empty-icon-wrap">
                  <VercelTriangle size={24} />
                </div>
                <h3>No projects match your search</h3>
                <p>Create a project or try clearing your search query.</p>
                <button
                  type="button"
                  className="vercel-btn vercel-btn-primary"
                  onClick={() => setIsNewProjectOpen(true)}
                >
                  <PlusIcon size={14} />
                  <span>Create Project</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === "Projects" && (
          <div className="vercel-page projects-page">
            <div className="page-header-row">
              <div>
                <h1 className="page-title">Projects</h1>
                <p className="page-subtitle">
                  Configure, monitor, and deploy all web applications inside your workspace.
                </p>
              </div>
              <button
                type="button"
                className="vercel-btn vercel-btn-primary"
                onClick={() => setIsNewProjectOpen(true)}
              >
                <PlusIcon size={14} />
                <span>New Project</span>
              </button>
            </div>

            <div className="projects-filter-toolbar">
              <div className="search-input-wrapper">
                <SearchIcon size={15} className="search-input-icon" />
                <input
                  type="text"
                  className="vercel-input"
                  placeholder="Filter projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="framework-filter-pills">
                {frameworksList.map((fw) => (
                  <button
                    key={fw}
                    type="button"
                    className={`fw-pill-btn ${
                      selectedFramework === fw ? "active" : ""
                    }`}
                    onClick={() => setSelectedFramework(fw)}
                  >
                    {fw}
                  </button>
                ))}
              </div>
            </div>

            <div className="projects-grid">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onInspect={(p) => setInspectProject(p)}
                  onDelete={handleDeleteProject}
                  onRedeploy={handleRedeployProject}
                  onCopyDomain={(url) =>
                    addToast("Domain Copied", url, "info")
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* DEPLOYMENTS TAB */}
        {activeTab === "Deployments" && (
          <DeploymentsView
            projects={projects}
            onInspectProject={(p) => setInspectProject(p)}
          />
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "Analytics" && <AnalyticsView />}

        {/* GIT REPOSITORIES TAB */}
        {activeTab === "GitHub" && (
          <GitHubView
            githubRepos={githubRepos}
            githubAccount={githubAccount}
            isGithubConnected={isGithubConnected}
            githubLoading={githubLoading}
            importingRepoId={importingRepoId}
            projects={projects}
            onRefresh={fetchGithubRepos}
            onImport={handleImportRepo}
            onConnect={handleConnectGithub}
          />
        )}

        {/* DOMAINS TAB */}
        {activeTab === "Domains" && <DomainsView projects={projects} />}

        {/* SETTINGS TAB */}
        {activeTab === "Settings" && (
          <SettingsView
            githubAccount={githubAccount}
            isGithubConnected={isGithubConnected}
          />
        )}
      </main>

      {/* Global Deployment Inspector Modal */}
      <ProjectDetailsModal
        project={inspectProject}
        isOpen={Boolean(inspectProject)}
        onClose={() => setInspectProject(null)}
        onRedeploy={handleRedeployProject}
      />

      {/* New Project Creator Modal */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onSubmit={handleCreateProject}
        isSaving={isSavingProject}
        githubRepos={githubRepos}
        onImportRepo={handleImportRepo}
        isGithubConnected={isGithubConnected}
        onConnectGithub={handleConnectGithub}
      />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        projects={projects}
        onSelectProject={(p) => setInspectProject(p)}
        onNavigate={(tab) => setActiveTab(tab)}
        onNewProject={() => {
          setIsCommandPaletteOpen(false);
          setIsNewProjectOpen(true);
        }}
        toggleTheme={toggleTheme}
        theme={theme}
      />

      {/* Vercel Footer */}
      <footer className="vercel-footer">
        <div className="footer-content">
          <div className="footer-left">
            <VercelTriangle size={14} />
            <span className="footer-brand">Upnow</span>
            <span>· Edge Cloud Platform v1.0</span>
          </div>
          <div className="footer-links">
            <a href="#docs" onClick={(e) => { e.preventDefault(); setActiveTab("Overview"); }}>Documentation</a>
            <a href="#changelog" onClick={(e) => { e.preventDefault(); setActiveTab("Deployments"); }}>Changelog</a>
            <a href="#support" onClick={(e) => { e.preventDefault(); addToast("Help", "Upnow 24/7 developer edge support active.", "info"); }}>Support</a>
            <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
