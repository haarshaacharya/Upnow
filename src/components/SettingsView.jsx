import React, { useState } from "react";
import { CopyIcon, CheckIcon, TerminalIcon, ShieldIcon } from "./Icons";

export function SettingsView({ githubAccount, isGithubConnected }) {
  const [copiedToken, setCopiedToken] = useState(false);
  const [token, setToken] = useState("upnow_live_89f02c4b7891ad4197");

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="vercel-page settings-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Workspace Settings</h1>
          <p className="page-subtitle">
            Manage your team, deploy tokens, continuous integration, and edge preferences.
          </p>
        </div>
      </div>

      <div className="settings-stack">
        {/* Workspace Info Card */}
        <div className="card-box settings-card">
          <div className="settings-card-header">
            <h3>General Settings</h3>
            <p className="card-sub">Your workspace identifier and plan details</p>
          </div>
          <div className="settings-fields">
            <div className="form-group">
              <label className="form-label">Workspace Name</label>
              <input
                type="text"
                className="vercel-input"
                defaultValue="Haarsh's Workspace"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Workspace Slug</label>
              <input
                type="text"
                className="vercel-input"
                defaultValue="haarsh"
                disabled
              />
              <span className="input-helper">Used in custom team URLs</span>
            </div>
          </div>
        </div>

        {/* CLI & Token Card */}
        <div className="card-box settings-card">
          <div className="settings-card-header">
            <h3>Upnow CLI & API Token</h3>
            <p className="card-sub">Deploy from your terminal or CI/CD pipelines</p>
          </div>

          <div className="token-field-row">
            <code className="token-display">{token}</code>
            <button
              type="button"
              className="vercel-btn vercel-btn-secondary"
              onClick={handleCopy}
            >
              {copiedToken ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              <span>{copiedToken ? "Copied" : "Copy Token"}</span>
            </button>
          </div>

          <div className="cli-instructions">
            <h4>Quick Terminal Deploy</h4>
            <div className="terminal-code-block">
              <code>npm i -g upnow</code>
              <code>upnow login --token {token.slice(0, 15)}...</code>
              <code>upnow deploy --prod</code>
            </div>
          </div>
        </div>

        {/* GitHub Connection */}
        <div className="card-box settings-card">
          <div className="settings-card-header">
            <h3>Git Integration</h3>
            <p className="card-sub">Continuous deployment webhook bindings</p>
          </div>
          <div className="integration-status-row">
            <div className="integration-info">
              <strong>GitHub</strong>
              <p>
                {isGithubConnected
                  ? `Connected as @${githubAccount}. Automatic deployment enabled.`
                  : "Not connected. Connect GitHub to enable automatic git pushes."}
              </p>
            </div>
            <span className={`status-pill ${isGithubConnected ? "ready" : "offline"}`}>
              {isGithubConnected ? "Active" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
