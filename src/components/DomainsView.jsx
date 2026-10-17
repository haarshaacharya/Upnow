import React, { useState } from "react";
import {
  GlobeIcon,
  PlusIcon,
  CheckIcon,
  ShieldIcon,
  ExternalLinkIcon,
  TrashIcon,
} from "./Icons";

export function DomainsView({ projects = [] }) {
  const [domains, setDomains] = useState([
    {
      id: "dom-1",
      name: "upnow.app",
      type: "Apex Subdomain",
      assignedProject: projects[0]?.name || "portfolio",
      status: "Valid",
      ssl: "Active",
      configuredAt: "2 days ago",
    },
    {
      id: "dom-2",
      name: "harssh.dev",
      type: "Custom Apex Domain",
      assignedProject: projects[0]?.name || "portfolio",
      status: "Valid",
      ssl: "Active",
      configuredAt: "Yesterday",
    },
  ]);

  const [newDomain, setNewDomain] = useState("");
  const [selectedProject, setSelectedProject] = useState(
    projects[0]?.name || ""
  );

  const handleAddDomain = (e) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    const formatted = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "");
    setDomains((prev) => [
      {
        id: `dom-${Date.now()}`,
        name: formatted,
        type: "Custom Domain",
        assignedProject: selectedProject || "Main Project",
        status: "Valid",
        ssl: "Active",
        configuredAt: "Just now",
      },
      ...prev,
    ]);
    setNewDomain("");
  };

  const handleDeleteDomain = (id) => {
    setDomains((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="vercel-page domains-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Custom Domains</h1>
          <p className="page-subtitle">
            Configure apex domains, subdomains, and wildcard certificates with zero-downtime routing.
          </p>
        </div>
      </div>

      {/* Add Domain Card */}
      <div className="card-box add-domain-box">
        <form onSubmit={handleAddDomain} className="add-domain-form">
          <div className="domain-input-group">
            <GlobeIcon size={16} className="domain-input-icon" />
            <input
              type="text"
              className="vercel-input domain-input"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="mybrand.com or app.mybrand.com"
            />
          </div>

          {projects.length > 0 && (
            <select
              className="vercel-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  Assign to: {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="submit"
            className="vercel-btn vercel-btn-primary"
            disabled={!newDomain.trim()}
          >
            <PlusIcon size={14} />
            <span>Add Domain</span>
          </button>
        </form>
      </div>

      {/* Domains List */}
      <div className="domains-list-card">
        <div className="card-header-bar">
          <h3>Active Domains</h3>
          <span className="domains-count">{domains.length} configured</span>
        </div>

        <div className="domains-stack">
          {domains.map((domain) => (
            <div key={domain.id} className="domain-item-row">
              <div className="domain-info-col">
                <div className="domain-title-wrap">
                  <GlobeIcon size={16} className="domain-icon-blue" />
                  <strong className="domain-host">{domain.name}</strong>
                  <span className="domain-type-badge">{domain.type}</span>
                </div>
                <div className="domain-sub-meta">
                  <span>Target: <strong>{domain.assignedProject}</strong></span>
                  <span>·</span>
                  <span>Added {domain.configuredAt}</span>
                </div>
              </div>

              <div className="domain-status-col">
                <span className="valid-pill">
                  <CheckIcon size={12} /> Valid DNS
                </span>
                <span className="ssl-pill">
                  <ShieldIcon size={12} /> SSL Active
                </span>
              </div>

              <div className="domain-actions-col">
                <a
                  href={`https://${domain.name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="action-icon-btn"
                  title="Visit domain"
                >
                  <ExternalLinkIcon size={14} />
                </a>
                <button
                  type="button"
                  className="action-icon-btn danger"
                  onClick={() => handleDeleteDomain(domain.id)}
                  title="Remove domain"
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DNS Configuration Reference */}
      <div className="card-box dns-ref-box">
        <div className="dns-header">
          <h3>Standard DNS Configuration</h3>
          <p className="card-sub">
            Point your domain DNS records to Upnow Edge Anycast network:
          </p>
        </div>

        <div className="dns-table">
          <div className="dns-row dns-head">
            <span>TYPE</span>
            <span>NAME</span>
            <span>VALUE</span>
            <span>STATUS</span>
          </div>
          <div className="dns-row">
            <code>A</code>
            <code>@</code>
            <code>76.76.21.21</code>
            <span className="dns-ok">✓ Active</span>
          </div>
          <div className="dns-row">
            <code>CNAME</code>
            <code>www</code>
            <code>cname.upnow.app</code>
            <span className="dns-ok">✓ Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
