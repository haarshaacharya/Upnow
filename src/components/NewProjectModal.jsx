import React, { useState } from "react";
import {
  CloseIcon,
  GitHubIcon,
  PlusIcon,
  VercelTriangle,
  ChevronDownIcon,
} from "./Icons";

export function NewProjectModal({
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  githubRepos = [],
  onImportRepo,
  isGithubConnected,
  onConnectGithub,
}) {
  const [activeTab, setActiveTab] = useState("manual");
  const [name, setName] = useState("");
  const [framework, setFramework] = useState("React");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [buildCommand, setBuildCommand] = useState("npm run build");
  const [outputDir, setOutputDir] = useState("dist");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      framework,
      buildCommand,
      outputDir,
    });
  };

  const frameworks = [
    { name: "React", icon: "⚛️", desc: "React Single Page Application" },
    { name: "Next.js", icon: "▲", desc: "The React Framework for the Web" },
    { name: "Vite", icon: "⚡", desc: "Next Generation Frontend Tooling" },
    { name: "Node.js", icon: "🟢", desc: "Serverless Node / Express backend" },
    { name: "Vue", icon: "🖖", desc: "The Progressive JavaScript Framework" },
    { name: "Static HTML", icon: "📄", desc: "HTML, CSS & Vanilla JavaScript" },
  ];

  const previewSlug = name.trim()
    ? `${name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.upnow.app`
    : "your-project.upnow.app";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="vercel-modal new-project-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <h2 className="modal-title">New Upnow Project</h2>
            <span className="env-pill">Edge Ready</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="modal-subnav">
          <button
            type="button"
            className={`subnav-btn ${activeTab === "manual" ? "active" : ""}`}
            onClick={() => setActiveTab("manual")}
          >
            <span>Create from Scratch</span>
          </button>
          <button
            type="button"
            className={`subnav-btn ${activeTab === "git" ? "active" : ""}`}
            onClick={() => setActiveTab("git")}
          >
            <GitHubIcon size={14} />
            <span>Import Git Repository</span>
          </button>
        </div>

        {activeTab === "manual" ? (
          <form onSubmit={handleSubmit} className="new-project-form">
            <div className="form-group">
              <label htmlFor="modalProjectName" className="form-label">
                Project Name
              </label>
              <input
                id="modalProjectName"
                type="text"
                className="vercel-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-portfolio-app"
                autoFocus
                required
                maxLength={60}
              />
              <div className="input-helper">
                Production URL: <span className="helper-url">https://{previewSlug}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Framework Preset</label>
              <div className="framework-grid">
                {frameworks.map((fw) => (
                  <button
                    key={fw.name}
                    type="button"
                    className={`framework-card ${
                      framework === fw.name ? "selected" : ""
                    }`}
                    onClick={() => {
                      setFramework(fw.name);
                      if (fw.name === "Next.js") setOutputDir(".next");
                      else if (fw.name === "Static HTML") setOutputDir("./");
                      else setOutputDir("dist");
                    }}
                  >
                    <span className="fw-icon">{fw.icon}</span>
                    <span className="fw-name">{fw.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="advanced-accordion">
              <button
                type="button"
                className="accordion-trigger"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span>Build & Output Settings</span>
                <ChevronDownIcon
                  size={14}
                  className={`accordion-chevron ${showAdvanced ? "open" : ""}`}
                />
              </button>

              {showAdvanced && (
                <div className="accordion-content">
                  <div className="advanced-field">
                    <label className="form-label-small">Build Command</label>
                    <input
                      type="text"
                      className="vercel-input-small"
                      value={buildCommand}
                      onChange={(e) => setBuildCommand(e.target.value)}
                    />
                  </div>
                  <div className="advanced-field">
                    <label className="form-label-small">Output Directory</label>
                    <input
                      type="text"
                      className="vercel-input-small"
                      value={outputDir}
                      onChange={(e) => setOutputDir(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="vercel-btn vercel-btn-secondary"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="vercel-btn vercel-btn-primary"
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? "Deploying..." : "Deploy to Edge"}
              </button>
            </div>
          </form>
        ) : (
          <div className="git-import-pane">
            {!isGithubConnected ? (
              <div className="empty-git-state">
                <GitHubIcon size={36} className="empty-git-icon" />
                <h3>Connect GitHub to import</h3>
                <p>
                  Link your GitHub account to import repositories and deploy with
                  continuous deployment on every push.
                </p>
                <button
                  type="button"
                  className="vercel-btn vercel-btn-primary"
                  onClick={onConnectGithub}
                >
                  <GitHubIcon size={16} />
                  <span>Connect GitHub</span>
                </button>
              </div>
            ) : githubRepos.length > 0 ? (
              <div className="git-repo-list-compact">
                {githubRepos.slice(0, 5).map((repo) => (
                  <div key={repo.id} className="repo-compact-row">
                    <div className="repo-compact-info">
                      <strong>{repo.name}</strong>
                      <span>
                        {repo.language || "Other"} · {repo.private ? "Private" : "Public"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="vercel-btn vercel-btn-secondary vercel-btn-sm"
                      onClick={() => onImportRepo(repo)}
                    >
                      Import
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-git-state">
                <p>No GitHub repositories found. Click refresh or create a repo.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
