import React, { useState, useRef, useEffect } from "react";
import {
  ExternalLinkIcon,
  GitBranchIcon,
  GitCommitIcon,
  CopyIcon,
  CheckIcon,
  MoreVerticalIcon,
  TrashIcon,
  TerminalIcon,
  RefreshIcon,
  VercelTriangle,
} from "./Icons";

export function ProjectCard({
  project,
  onInspect,
  onDelete,
  onRedeploy,
  onCopyDomain,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const domain = `${project.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.upnow.app`;
  const domainUrl = `https://${domain}`;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(domainUrl);
    setCopied(true);
    if (onCopyDomain) onCopyDomain(domainUrl);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFrameworkColor = (framework) => {
    const f = (framework || "").toLowerCase();
    if (f.includes("react")) return "#61dafb";
    if (f.includes("next")) return "#ffffff";
    if (f.includes("vite")) return "#bd34fe";
    if (f.includes("node")) return "#68a063";
    if (f.includes("python")) return "#3776ab";
    if (f.includes("vue")) return "#42b883";
    return "#0070f3";
  };

  const status = project.status || "Ready";
  const isBuilding = status.toLowerCase() === "building";

  return (
    <article className="vercel-project-card" onClick={() => onInspect(project)}>
      <div className="card-top">
        <div className="card-identity">
          <div
            className="framework-avatar"
            style={{
              borderColor: `${getFrameworkColor(project.framework)}44`,
              color: getFrameworkColor(project.framework),
            }}
          >
            {project.framework?.toLowerCase().includes("next") ? (
              <VercelTriangle size={15} />
            ) : (
              <span className="framework-initial">
                {(project.framework || "P").slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="project-titles">
            <h3 className="project-name">
              {project.name}
              <ExternalLinkIcon size={12} className="card-external-arrow" />
            </h3>
            <div className="domain-pill" onClick={handleCopy} title="Click to copy domain">
              <span className="domain-text">{domain}</span>
              <button
                type="button"
                className="domain-copy-btn"
                aria-label="Copy domain"
              >
                {copied ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
              </button>
            </div>
          </div>
        </div>

        <div className="card-actions" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="card-more-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="More options"
          >
            <MoreVerticalIcon size={15} />
          </button>

          {menuOpen && (
            <div className="dropdown-menu card-dropdown">
              <button
                type="button"
                className="dropdown-item clickable"
                onClick={() => {
                  setMenuOpen(false);
                  onInspect(project);
                }}
              >
                <TerminalIcon size={14} />
                <span>View Build Logs</span>
              </button>
              <button
                type="button"
                className="dropdown-item clickable"
                onClick={() => {
                  setMenuOpen(false);
                  onRedeploy(project);
                }}
              >
                <RefreshIcon size={14} />
                <span>Redeploy</span>
              </button>
              <a
                href={domainUrl}
                target="_blank"
                rel="noreferrer"
                className="dropdown-item clickable"
                onClick={() => setMenuOpen(false)}
              >
                <ExternalLinkIcon size={14} />
                <span>Visit Production</span>
              </a>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item clickable danger"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(project.id);
                }}
              >
                <TrashIcon size={14} />
                <span>Delete Project</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card-git-meta">
        <div className="git-row">
          <GitBranchIcon size={13} className="git-icon" />
          <span className="branch-tag">main</span>
          <span className="git-commit-hash">
            <GitCommitIcon size={12} />
            {project.id ? `d7a${(project.id * 137).toString(16).slice(0, 4)}` : "f8b91a"}
          </span>
        </div>
        <p className="git-message">
          {project.lastCommit || `Production deployment for ${project.name}`}
        </p>
      </div>

      <div className="card-footer">
        <div className="card-status-pill">
          <span
            className={`status-dot ${isBuilding ? "building" : "ready"}`}
          />
          <span className="status-label">
            {isBuilding ? "Building..." : "Ready"}
          </span>
        </div>

        <div className="card-footer-meta">
          <span className="framework-badge">
            {project.framework || "React"}
          </span>
          <span className="time-ago">
            {project.deployedAgo || "Just now"}
          </span>
        </div>
      </div>
    </article>
  );
}
