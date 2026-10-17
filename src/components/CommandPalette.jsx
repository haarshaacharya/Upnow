import React, { useState, useEffect, useRef } from "react";
import {
  SearchIcon,
  CloseIcon,
  LayersIcon,
  TerminalIcon,
  ActivityIcon,
  GlobeIcon,
  GitHubIcon,
  SettingsIcon,
  PlusIcon,
  SunIcon,
  MoonIcon,
} from "./Icons";

export function CommandPalette({
  isOpen,
  onClose,
  projects = [],
  onSelectProject,
  onNavigate,
  onNewProject,
  toggleTheme,
  theme,
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items = [
    {
      category: "Navigation",
      items: [
        {
          id: "nav-overview",
          label: "Go to Overview",
          icon: <LayersIcon size={14} />,
          action: () => onNavigate("Overview"),
        },
        {
          id: "nav-projects",
          label: "Go to Projects",
          icon: <TerminalIcon size={14} />,
          action: () => onNavigate("Projects"),
        },
        {
          id: "nav-deployments",
          label: "Go to Deployments",
          icon: <ActivityIcon size={14} />,
          action: () => onNavigate("Deployments"),
        },
        {
          id: "nav-analytics",
          label: "Go to Web Analytics",
          icon: <ActivityIcon size={14} />,
          action: () => onNavigate("Analytics"),
        },
        {
          id: "nav-github",
          label: "Go to Git Repositories",
          icon: <GitHubIcon size={14} />,
          action: () => onNavigate("GitHub"),
        },
        {
          id: "nav-domains",
          label: "Go to Custom Domains",
          icon: <GlobeIcon size={14} />,
          action: () => onNavigate("Domains"),
        },
        {
          id: "nav-settings",
          label: "Go to Workspace Settings",
          icon: <SettingsIcon size={14} />,
          action: () => onNavigate("Settings"),
        },
      ],
    },
    {
      category: "Actions",
      items: [
        {
          id: "act-new",
          label: "Create New Project...",
          icon: <PlusIcon size={14} />,
          action: () => onNewProject(),
        },
        {
          id: "act-theme",
          label: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`,
          icon: theme === "dark" ? <SunIcon size={14} /> : <MoonIcon size={14} />,
          action: () => toggleTheme(),
        },
      ],
    },
    {
      category: "Projects",
      items: projects.map((p) => ({
        id: `proj-${p.id}`,
        label: p.name,
        meta: `${p.framework || "React"} · Ready`,
        icon: <TerminalIcon size={14} />,
        action: () => onSelectProject(p),
      })),
    },
  ];

  const filteredCategories = items
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  const flatItems = filteredCategories.flatMap((c) => c.items);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (flatItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + flatItems.length) % (flatItems.length || 1)
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].action();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  let counter = 0;

  return (
    <div className="modal-backdrop command-backdrop" onClick={onClose}>
      <div
        className="vercel-command-palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="command-search-header">
          <SearchIcon size={16} className="command-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search projects..."
          />
          <kbd className="command-esc" onClick={onClose}>
            ESC
          </kbd>
        </div>

        <div className="command-results-list">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <div key={cat.category} className="command-group">
                <div className="command-group-title">{cat.category}</div>
                {cat.items.map((item) => {
                  const currentIndex = counter++;
                  const isSelected = currentIndex === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      className={`command-item ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      <span className="command-item-icon">{item.icon}</span>
                      <span className="command-item-label">{item.label}</span>
                      {item.meta && (
                        <span className="command-item-meta">{item.meta}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="command-empty">
              <span>No commands or projects match "{query}"</span>
            </div>
          )}
        </div>

        <div className="command-footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> to navigate
          </span>
          <span>
            <kbd>↵</kbd> to select
          </span>
          <span>
            <kbd>esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
