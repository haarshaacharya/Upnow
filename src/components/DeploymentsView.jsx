import React, { useState } from "react";
import {
  ExternalLinkIcon,
  GitBranchIcon,
  GitCommitIcon,
  TerminalIcon,
  RefreshIcon,
} from "./Icons";

export function DeploymentsView({ projects = [], onInspectProject }) {
  const [filter, setFilter] = useState("all");

  // Generate realistic deployment entries based on current projects
  const deployments = projects.flatMap((p, idx) => [
    {
      id: `dep-${p.id}-prod`,
      project: p,
      environment: "Production",
      url: `https://${p.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.upnow.app`,
      branch: "main",
      commit: `d7a${((p.id || 1) * 231).toString(16).slice(0, 4)}`,
      commitMsg: `Production deploy: ${p.name}`,
      status: "Ready",
      duration: "32s",
      time: "2m ago",
      author: "Haarsh",
    },
    {
      id: `dep-${p.id}-prev`,
      project: p,
      environment: "Preview",
      url: `https://${p.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-git-feat.upnow.app`,
      branch: "feat/ui-v2",
      commit: `b4c${((p.id || 1) * 119).toString(16).slice(0, 4)}`,
      commitMsg: "feat: revamp dashboard with vercel aesthetics",
      status: "Ready",
      duration: "28s",
      time: "45m ago",
      author: "Haarsh",
    },
  ]);

  const filteredDeployments =
    filter === "all"
      ? deployments
      : deployments.filter(
          (d) => d.environment.toLowerCase() === filter.toLowerCase()
        );

  return (
    <div className="vercel-page deployments-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Deployments</h1>
          <p className="page-subtitle">
            Chronological history of immutable builds deployed across your environments.
          </p>
        </div>

        <div className="filter-pill-group">
          {["all", "production", "preview"].map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="deployments-table-card">
        <div className="table-header-row">
          <div className="th-col th-status">STATUS</div>
          <div className="th-col th-project">PROJECT / DOMAIN</div>
          <div className="th-col th-env">ENV</div>
          <div className="th-col th-commit">COMMIT</div>
          <div className="th-col th-duration">DURATION</div>
          <div className="th-col th-actions">ACTIONS</div>
        </div>

        <div className="table-body">
          {filteredDeployments.length > 0 ? (
            filteredDeployments.map((d) => (
              <div
                key={d.id}
                className="deployment-table-row"
                onClick={() => onInspectProject(d.project)}
              >
                <div className="td-col td-status">
                  <span className="status-dot ready" />
                  <span className="status-text">{d.status}</span>
                </div>

                <div className="td-col td-project">
                  <strong className="dep-project-name">{d.project.name}</strong>
                  <span className="dep-domain">{d.url}</span>
                </div>

                <div className="td-col td-env">
                  <span
                    className={`env-badge ${
                      d.environment === "Production" ? "prod" : "prev"
                    }`}
                  >
                    {d.environment}
                  </span>
                </div>

                <div className="td-col td-commit">
                  <div className="commit-cell">
                    <span className="branch-name">
                      <GitBranchIcon size={12} /> {d.branch}
                    </span>
                    <span className="commit-desc">{d.commitMsg}</span>
                  </div>
                </div>

                <div className="td-col td-duration">
                  <span className="duration-time">{d.duration}</span>
                  <span className="duration-ago">{d.time}</span>
                </div>

                <div className="td-col td-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="action-icon-btn"
                    onClick={() => onInspectProject(d.project)}
                    title="View build logs"
                  >
                    <TerminalIcon size={14} />
                  </button>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="action-icon-btn"
                    title="Visit deployment"
                  >
                    <ExternalLinkIcon size={14} />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-table-state">
              <p>No deployments matching "{filter}". Create a project to deploy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
