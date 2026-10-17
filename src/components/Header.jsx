import React, { useState, useRef, useEffect } from "react";
import {
  VercelTriangle,
  GitHubIcon,
  SearchIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  BellIcon,
} from "./Icons";

export function Header({
  activeWorkspace = "Haarsh's Workspace",
  githubAccount = "",
  isGithubConnected = false,
  theme = "dark",
  toggleTheme,
  onOpenCommandPalette,
  onConnectGithub,
}) {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setWorkspaceMenuOpen(false);
        setUserMenuOpen(false);
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="vercel-header" ref={dropdownRef}>
      <div className="vercel-header-left">
        <a href="#overview" className="vercel-brand" aria-label="Upnow Home">
          <div className="brand-icon-box">
            <VercelTriangle size={20} className="brand-triangle" />
          </div>
          <span className="brand-name">UPNOW</span>
        </a>

        <span className="header-divider">/</span>

        <div className="workspace-switcher-wrapper">
          <button
            type="button"
            className="workspace-switcher-btn"
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
          >
            <div className="workspace-avatar-small">H</div>
            <span className="workspace-name">{activeWorkspace}</span>
            <span className="workspace-badge">Hobby</span>
            <ChevronDownIcon size={12} className="dropdown-caret" />
          </button>

          {workspaceMenuOpen && (
            <div className="dropdown-menu workspace-dropdown">
              <div className="dropdown-header">
                <span className="dropdown-label">Personal Account</span>
              </div>
              <div className="dropdown-item active">
                <div className="workspace-avatar-small">H</div>
                <div className="dropdown-item-details">
                  <span className="item-title">Haarsh's Workspace</span>
                  <span className="item-sub">Hobby · Free</span>
                </div>
                <span className="check-mark">✓</span>
              </div>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item clickable"
                onClick={() => {
                  alert("Team workspaces are available on the Upnow Pro plan.");
                  setWorkspaceMenuOpen(false);
                }}
              >
                <span className="plus-symbol">+</span>
                <span>Create a Team</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="vercel-header-center">
        <button
          type="button"
          className="vercel-search-trigger"
          onClick={onOpenCommandPalette}
          title="Search or jump to... (Ctrl+K)"
        >
          <SearchIcon size={14} className="search-icon" />
          <span className="search-placeholder">Find projects, domains, commands...</span>
          <kbd className="search-shortcut">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="vercel-header-right">
        {/* GitHub Connection Badge */}
        {isGithubConnected ? (
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="header-pill-badge github-connected"
            title={`Connected as @${githubAccount}`}
          >
            <GitHubIcon size={14} />
            <span className="live-dot" />
            <span className="pill-text">@{githubAccount || "connected"}</span>
          </a>
        ) : (
          <button
            type="button"
            className="header-pill-badge github-connect-btn"
            onClick={onConnectGithub}
            title="Connect your GitHub account"
          >
            <GitHubIcon size={14} />
            <span className="pill-text">Connect GitHub</span>
          </button>
        )}

        <button
          type="button"
          className="header-icon-btn"
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          aria-label="Notifications"
          title="Notifications"
        >
          <BellIcon size={16} />
          <span className="notif-badge-dot" />
        </button>

        {notificationsOpen && (
          <div className="dropdown-menu notif-dropdown">
            <div className="dropdown-header">
              <span className="dropdown-label">Notifications</span>
              <span className="unread-count">1 new</span>
            </div>
            <div className="notif-item">
              <span className="notif-indicator ready" />
              <div className="notif-text">
                <p>Welcome to Upnow Vercel Edition!</p>
                <small>Deploy faster with high-performance edge network.</small>
              </div>
            </div>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          type="button"
          className="header-icon-btn theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </button>

        {/* User Avatar */}
        <div className="user-profile-wrap">
          <button
            type="button"
            className="user-avatar-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="User account menu"
          >
            <span className="user-initial">H</span>
          </button>

          {userMenuOpen && (
            <div className="dropdown-menu profile-dropdown">
              <div className="dropdown-header">
                <strong>haarsh@upnow.dev</strong>
                <span className="item-sub">Personal Account</span>
              </div>
              <div className="dropdown-divider" />
              <a
                href="#settings"
                className="dropdown-item clickable"
                onClick={() => setUserMenuOpen(false)}
              >
                Workspace Settings
              </a>
              <a
                href="#domains"
                className="dropdown-item clickable"
                onClick={() => setUserMenuOpen(false)}
              >
                Custom Domains
              </a>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item clickable danger"
                onClick={() => {
                  alert("Logged out of Upnow session.");
                  setUserMenuOpen(false);
                }}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
