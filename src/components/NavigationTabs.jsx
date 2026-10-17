import React from "react";
import {
  LayersIcon,
  TerminalIcon,
  GlobeIcon,
  ActivityIcon,
  GitHubIcon,
  SettingsIcon,
  ShieldIcon,
} from "./Icons";

export function NavigationTabs({ activeTab, setActiveTab, counts = {} }) {
  const tabs = [
    { id: "Overview", label: "Overview", icon: <LayersIcon size={15} /> },
    {
      id: "Projects",
      label: "Projects",
      icon: <TerminalIcon size={15} />,
      count: counts.projects ?? 0,
    },
    {
      id: "Deployments",
      label: "Deployments",
      icon: <ActivityIcon size={15} />,
      count: counts.deployments ?? 0,
    },
    {
      id: "Analytics",
      label: "Analytics",
      icon: <ActivityIcon size={15} />,
    },
    {
      id: "GitHub",
      label: "Git Repos",
      icon: <GitHubIcon size={15} />,
      count: counts.repos ?? 0,
    },
    {
      id: "Domains",
      label: "Domains",
      icon: <GlobeIcon size={15} />,
      count: counts.domains ?? 0,
    },
    { id: "Settings", label: "Settings", icon: <SettingsIcon size={15} /> },
  ];

  return (
    <nav className="vercel-nav-strip">
      <div className="nav-tabs-container">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`nav-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span className={`tab-count ${isActive ? "active" : ""}`}>
                  {tab.count}
                </span>
              )}
              {isActive && <div className="tab-active-indicator" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
