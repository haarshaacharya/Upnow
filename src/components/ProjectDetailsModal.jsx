import React, { useState, useEffect, useRef } from "react";
import {
  CloseIcon,
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
  RefreshIcon,
  GitBranchIcon,
  GitCommitIcon,
  TerminalIcon,
  GlobeIcon,
  ShieldIcon,
} from "./Icons";

export function ProjectDetailsModal({
  project,
  isOpen,
  onClose,
  onRedeploy,
}) {
  const [copied, setCopied] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [activeTab, setActiveTab] = useState("logs");
  const terminalRef = useRef(null);

  const defaultLogs = [
    `[upnow-cli] Initiating edge deployment for project "${project?.name || "app"}"`,
    `[upnow-cli] Target environment: Production`,
    `[upnow-system] Analyzing project structure and package manifests...`,
    `[upnow-builder] Detected framework preset: ${project?.framework || "React + Vite"}`,
    `[upnow-builder] Node version: v20.12.0 (LTS)`,
    `[upnow-builder] Installing cached dependencies (0.8s)...`,
    `[upnow-builder] Running build script: "npm run build"`,
    `[upnow-build] vite v6.1.1 building for production...`,
    `[upnow-build] transform (48 modules)...`,
    `[upnow-build] ✓ 48 modules transformed in 420ms`,
    `[upnow-build] dist/index.html                   0.48 kB  │ gzip: 0.31 kB`,
    `[upnow-build] dist/assets/index-D7x9a.css      18.42 kB  │ gzip: 4.88 kB`,
    `[upnow-build] dist/assets/index-Bt18k.js      142.10 kB  │ gzip: 45.20 kB`,
    `[upnow-build] ✓ built in 680ms`,
    `[upnow-edge] Packaging serverless routing manifest...`,
    `[upnow-edge] Deploying immutable static bundle to Upnow Global Edge...`,
    `[upnow-edge] Validating SSL / TLS Let's Encrypt certificates...`,
    `[upnow-edge] Domain assigned: https://${(project?.name || "app").toLowerCase()}.upnow.app`,
    `[upnow-edge] Status: Deployment READY across 320+ edge regions! 🚀`,
  ];

  const [logs, setLogs] = useState(defaultLogs);

  useEffect(() => {
    if (project) {
      setLogs([
        `[upnow-cli] Initiating edge deployment for project "${project.name}"`,
        `[upnow-cli] Target environment: Production`,
        `[upnow-system] Analyzing project structure and package manifests...`,
        `[upnow-builder] Detected framework preset: ${project.framework || "React"}`,
        `[upnow-builder] Node version: v20.12.0 (LTS)`,
        `[upnow-builder] Installing cached dependencies (0.8s)...`,
        `[upnow-builder] Running build script: "npm run build"`,
        `[upnow-build] vite v6.1.1 building for production...`,
        `[upnow-build] transform (48 modules)...`,
        `[upnow-build] ✓ 48 modules transformed in 420ms`,
        `[upnow-build] dist/index.html                   0.48 kB`,
        `[upnow-build] dist/assets/index-D7x9a.css      18.42 kB`,
        `[upnow-build] dist/assets/index-Bt18k.js      142.10 kB`,
        `[upnow-build] ✓ built in 680ms`,
        `[upnow-edge] Packaging serverless routing manifest...`,
        `[upnow-edge] Deploying immutable static bundle to Upnow Global Edge...`,
        `[upnow-edge] Validating SSL / TLS Let's Encrypt certificates...`,
        `[upnow-edge] Domain assigned: https://${project.name.toLowerCase()}.upnow.app`,
        `[upnow-edge] Status: Deployment READY across 320+ edge regions! 🚀`,
      ]);
    }
  }, [project]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen || !project) return null;

  const domain = `${project.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.upnow.app`;
  const domainUrl = `https://${domain}`;

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(domainUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs.join("\n"));
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const triggerLiveRedeploy = () => {
    if (isRebuilding) return;
    setIsRebuilding(true);
    setLogs([
      `[upnow-cli] Redeployment triggered by user Haarsh...`,
      `[upnow-cli] Invalidating edge cache for ${domain}...`,
      `[upnow-builder] Pulling latest commit d7a${Math.floor(Math.random() * 9000 + 1000)}...`,
    ]);

    const steps = [
      `[upnow-builder] Setting up build environment container...`,
      `[upnow-builder] Detected framework preset: ${project.framework}`,
      `[upnow-builder] Running build command: "npm run build"`,
      `[upnow-build] vite building for production...`,
      `[upnow-build] ✓ 48 modules transformed in 390ms`,
      `[upnow-build] dist/index.html   0.48 kB`,
      `[upnow-build] dist/assets/app.js 142 kB`,
      `[upnow-edge] Distributing build to Edge CDN...`,
      `[upnow-edge] SSL certificate verified (Let's Encrypt)`,
      `[upnow-edge] Redeployment SUCCESSFUL at ${domainUrl} in 1.8s! 🎉`,
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, step]);
        if (index === steps.length - 1) {
          setIsRebuilding(false);
          if (onRedeploy) onRedeploy(project);
        }
      }, (index + 1) * 350);
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="vercel-modal deployment-inspector-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="header-status-dot-wrap">
              <span className={`status-dot ${isRebuilding ? "building" : "ready"}`} />
            </div>
            <div>
              <div className="modal-title-row">
                <h2 className="modal-title">{project.name}</h2>
                <span className="env-pill production">Production</span>
              </div>
              <a
                href={domainUrl}
                target="_blank"
                rel="noreferrer"
                className="modal-domain-link"
              >
                <span>{domain}</span>
                <ExternalLinkIcon size={12} />
              </a>
            </div>
          </div>

          <div className="modal-header-actions">
            <button
              type="button"
              className="vercel-btn vercel-btn-secondary"
              onClick={triggerLiveRedeploy}
              disabled={isRebuilding}
            >
              <RefreshIcon
                size={14}
                className={isRebuilding ? "spin-animation" : ""}
              />
              <span>{isRebuilding ? "Building..." : "Redeploy"}</span>
            </button>

            <a
              href={domainUrl}
              target="_blank"
              rel="noreferrer"
              className="vercel-btn vercel-btn-primary"
            >
              <span>Visit</span>
              <ExternalLinkIcon size={13} />
            </a>

            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>

        {/* Modal Meta Summary */}
        <div className="deployment-meta-grid">
          <div className="meta-box">
            <span className="meta-label">DOMAINS</span>
            <div className="meta-value-row">
              <span className="meta-primary">{domain}</span>
              <button
                type="button"
                className="copy-mini-btn"
                onClick={handleCopyDomain}
                title="Copy domain"
              >
                {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              </button>
            </div>
          </div>

          <div className="meta-box">
            <span className="meta-label">STATUS</span>
            <div className="meta-value-row">
              <span className="meta-primary">
                {isRebuilding ? "Building" : "Ready"}
              </span>
              <span className="meta-sub">
                {isRebuilding ? "in progress..." : "38s build time"}
              </span>
            </div>
          </div>

          <div className="meta-box">
            <span className="meta-label">BRANCH</span>
            <div className="meta-value-row">
              <GitBranchIcon size={13} className="git-icon" />
              <span className="meta-primary">main</span>
              <span className="commit-chip">
                <GitCommitIcon size={11} /> d7a91c
              </span>
            </div>
          </div>

          <div className="meta-box">
            <span className="meta-label">REGION</span>
            <div className="meta-value-row">
              <GlobeIcon size={13} />
              <span className="meta-primary">iad1</span>
              <span className="meta-sub">Washington, D.C.</span>
            </div>
          </div>
        </div>

        {/* Modal Inner Tabs */}
        <div className="modal-subnav">
          <button
            type="button"
            className={`subnav-btn ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            <TerminalIcon size={14} />
            <span>Deployment Logs</span>
          </button>
          <button
            type="button"
            className={`subnav-btn ${activeTab === "domains" ? "active" : ""}`}
            onClick={() => setActiveTab("domains")}
          >
            <GlobeIcon size={14} />
            <span>Assigned Domains</span>
          </button>
          <button
            type="button"
            className={`subnav-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <ShieldIcon size={14} />
            <span>SSL & Security</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "logs" && (
          <div className="terminal-wrapper">
            <div className="terminal-header">
              <div className="terminal-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
                <span className="terminal-title">Build & Deployment Console</span>
              </div>
              <div className="terminal-actions">
                <button
                  type="button"
                  className="terminal-copy-btn"
                  onClick={handleCopyLogs}
                >
                  {copiedLogs ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
                  <span>{copiedLogs ? "Copied" : "Copy Logs"}</span>
                </button>
              </div>
            </div>

            <div className="terminal-body" ref={terminalRef}>
              {logs.map((line, index) => {
                let lineClass = "log-line";
                if (line.includes("[upnow-cli]")) lineClass += " log-cli";
                else if (line.includes("[upnow-builder]")) lineClass += " log-builder";
                else if (line.includes("[upnow-build]")) lineClass += " log-build";
                else if (line.includes("[upnow-edge]")) lineClass += " log-edge";
                if (line.includes("READY") || line.includes("SUCCESSFUL"))
                  lineClass += " log-success";

                return (
                  <div key={index} className={lineClass}>
                    <span className="line-num">{index + 1}</span>
                    <span className="line-content">{line}</span>
                  </div>
                );
              })}
              {isRebuilding && (
                <div className="log-line log-rebuilding">
                  <span className="line-num">{logs.length + 1}</span>
                  <span className="line-content blink-cursor">▌</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "domains" && (
          <div className="modal-tab-pane">
            <div className="domain-row-item">
              <div className="domain-left">
                <GlobeIcon size={16} className="domain-globe" />
                <div>
                  <strong className="domain-addr">{domain}</strong>
                  <span className="domain-tag">Primary Production Domain</span>
                </div>
              </div>
              <div className="domain-right">
                <span className="valid-pill">
                  <CheckIcon size={12} /> Valid Configuration
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="modal-tab-pane">
            <div className="security-card">
              <div className="security-icon-box">
                <ShieldIcon size={24} />
              </div>
              <div>
                <h4>SSL / TLS Encryption</h4>
                <p>
                  Automatic SSL certificates provisioned via Let's Encrypt with
                  HTTP/2 and TLS 1.3 support.
                </p>
                <div className="security-tags">
                  <span className="sec-tag">TLS 1.3 Active</span>
                  <span className="sec-tag">DDoS Protected (Edge)</span>
                  <span className="sec-tag">HSTS Enabled</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
