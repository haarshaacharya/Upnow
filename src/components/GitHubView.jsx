import React, { useState } from "react";
import {
  GitHubIcon,
  SearchIcon,
  RefreshIcon,
  ExternalLinkIcon,
  CheckIcon,
} from "./Icons";

export function GitHubView({
  githubRepos = [],
  githubAccount = "",
  isGithubConnected = false,
  githubLoading = false,
  importingRepoId = null,
  projects = [],
  onRefresh,
  onImport,
  onConnect,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRepos = githubRepos.filter((repo) =>
    (repo.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.language || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="vercel-page github-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Git Repositories</h1>
          <p className="page-subtitle">
            Import repositories from GitHub to configure continuous edge deployments.
          </p>
        </div>

        <div className="header-actions-group">
          {isGithubConnected ? (
            <button
              type="button"
              className="vercel-btn vercel-btn-secondary"
              onClick={onRefresh}
              disabled={githubLoading}
            >
              <RefreshIcon
                size={14}
                className={githubLoading ? "spin-animation" : ""}
              />
              <span>{githubLoading ? "Syncing..." : "Sync Repos"}</span>
            </button>
          ) : (
            <button
              type="button"
              className="vercel-btn vercel-btn-primary"
              onClick={onConnect}
            >
              <GitHubIcon size={16} />
              <span>Connect GitHub</span>
            </button>
          )}
        </div>
      </div>

      {isGithubConnected ? (
        <>
          {/* Account Banner */}
          <div className="github-account-banner">
            <div className="account-info-left">
              <div className="github-account-avatar">
                <GitHubIcon size={20} />
              </div>
              <div>
                <strong>Connected Account: @{githubAccount}</strong>
                <p>Synced with GitHub OAuth App · {githubRepos.length} repositories available</p>
              </div>
            </div>
            <button
              type="button"
              className="vercel-btn vercel-btn-secondary vercel-btn-sm"
              onClick={onConnect}
            >
              Reconnect
            </button>
          </div>

          {/* Search bar */}
          <div className="repo-search-bar">
            <SearchIcon size={15} className="search-icon" />
            <input
              type="text"
              className="vercel-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories by name or language..."
            />
          </div>

          {/* Repositories List */}
          <div className="github-repo-grid">
            {filteredRepos.length > 0 ? (
              filteredRepos.map((repo) => {
                const isImported = projects.some(
                  (p) => p.name.toLowerCase() === repo.name.toLowerCase()
                );
                const isImporting = importingRepoId === repo.id;

                return (
                  <div key={repo.id} className="github-repo-card">
                    <div className="repo-card-top">
                      <div className="repo-name-box">
                        <GitHubIcon size={16} />
                        <h3 className="repo-name-text">{repo.name}</h3>
                      </div>
                      <span className="repo-privacy-tag">
                        {repo.private ? "Private" : "Public"}
                      </span>
                    </div>

                    <p className="repo-desc">
                      {repo.description || "No description provided."}
                    </p>

                    <div className="repo-card-bottom">
                      <div className="repo-lang-row">
                        <span className="lang-dot" />
                        <span className="lang-name">
                          {repo.language || "Web Project"}
                        </span>
                        {repo.defaultBranch && (
                          <span className="branch-hint">· {repo.defaultBranch}</span>
                        )}
                      </div>

                      <div className="repo-card-actions">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="action-icon-btn"
                          title="Open on GitHub"
                        >
                          <ExternalLinkIcon size={14} />
                        </a>

                        <button
                          type="button"
                          className={`vercel-btn vercel-btn-sm ${
                            isImported
                              ? "vercel-btn-secondary"
                              : "vercel-btn-primary"
                          }`}
                          disabled={isImported || isImporting}
                          onClick={() => onImport(repo)}
                        >
                          {isImporting ? (
                            <span>Importing...</span>
                          ) : isImported ? (
                            <>
                              <CheckIcon size={12} />
                              <span>Imported</span>
                            </>
                          ) : (
                            <span>Import</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-repos-state">
                <p>No repositories match "{searchQuery}"</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="empty-git-connect-card">
          <GitHubIcon size={48} className="huge-git-icon" />
          <h2>Connect with GitHub</h2>
          <p>
            Deploy your code straight from GitHub. Every time you push a commit,
            Upnow will automatically build and distribute an edge preview.
          </p>
          <button
            type="button"
            className="vercel-btn vercel-btn-primary vercel-btn-lg"
            onClick={onConnect}
          >
            <GitHubIcon size={18} />
            <span>Connect GitHub Account</span>
          </button>
        </div>
      )}
    </div>
  );
}
