import React, { useState } from "react";
import { ActivityIcon, GlobeIcon, ShieldIcon } from "./Icons";

export function AnalyticsView() {
  const [timeRange, setTimeRange] = useState("24h");

  const metrics = [
    { label: "Total Edge Requests", value: "2.41M", change: "+14.2%", positive: true },
    { label: "P75 Edge Latency", value: "28ms", change: "-4ms", positive: true },
    { label: "Bandwidth Served", value: "8.6 GB", change: "+1.2 GB", positive: true },
    { label: "Uptime Availability", value: "99.99%", change: "100%", positive: true },
  ];

  const regions = [
    { code: "iad1", name: "Washington, D.C. (US East)", share: "44%", latency: "18ms" },
    { code: "sfo1", name: "San Francisco (US West)", share: "28%", latency: "24ms" },
    { code: "lhr1", name: "London (Europe)", share: "16%", latency: "32ms" },
    { code: "bom1", name: "Mumbai (Asia South)", share: "12%", latency: "22ms" },
  ];

  // SVG Chart points for 24 hours
  const chartPoints = [
    12, 19, 15, 25, 22, 38, 45, 42, 58, 65, 72, 68,
    78, 85, 92, 88, 95, 110, 105, 120, 115, 128, 134, 142
  ];
  const maxVal = Math.max(...chartPoints);
  const minVal = Math.min(...chartPoints);

  const pointsString = chartPoints
    .map((val, idx) => {
      const x = (idx / (chartPoints.length - 1)) * 500;
      const y = 140 - ((val - minVal) / (maxVal - minVal)) * 110;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="vercel-page analytics-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Edge Web Analytics</h1>
          <p className="page-subtitle">
            Real-time traffic, latency, and performance across 320+ global edge locations.
          </p>
        </div>

        <div className="timerange-pill-group">
          {["24h", "7d", "30d"].map((t) => (
            <button
              key={t}
              type="button"
              className={`timerange-btn ${timeRange === t ? "active" : ""}`}
              onClick={() => setTimeRange(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Top Metric Cards */}
      <div className="vercel-stats-grid">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card">
            <span className="metric-label">{m.label}</span>
            <div className="metric-row">
              <span className="metric-number">{m.value}</span>
              <span className={`metric-change ${m.positive ? "pos" : "neg"}`}>
                {m.change}
              </span>
            </div>
            <span className="metric-subtext">Compared to previous period</span>
          </div>
        ))}
      </div>

      {/* SVG Traffic Chart Card */}
      <div className="analytics-chart-card">
        <div className="chart-card-header">
          <div>
            <h3>Edge Traffic Volume</h3>
            <p className="card-sub">Invocations per hour over the selected timeframe</p>
          </div>
          <div className="chart-legend">
            <span className="legend-dot" />
            <span>Successful 200 OK</span>
          </div>
        </div>

        <div className="svg-chart-container">
          <svg viewBox="0 0 500 150" className="analytics-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0070f3" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0070f3" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gradient Fill under path */}
            <polygon
              points={`0,140 ${pointsString} 500,140`}
              fill="url(#chartGradient)"
            />

            {/* Main Polyline */}
            <polyline
              points={pointsString}
              fill="none"
              stroke="#0070f3"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Core Web Vitals & Regional Distribution */}
      <div className="analytics-split-grid">
        <div className="split-card">
          <div className="split-card-header">
            <h3>Core Web Vitals</h3>
            <span className="vitals-badge">Optimal 100/100</span>
          </div>
          <div className="vitals-list">
            <div className="vital-item">
              <span className="vital-name">TTFB (Time to First Byte)</span>
              <strong className="vital-val good">24ms</strong>
            </div>
            <div className="vital-item">
              <span className="vital-name">FCP (First Contentful Paint)</span>
              <strong className="vital-val good">0.4s</strong>
            </div>
            <div className="vital-item">
              <span className="vital-name">LCP (Largest Contentful Paint)</span>
              <strong className="vital-val good">0.8s</strong>
            </div>
            <div className="vital-item">
              <span className="vital-name">CLS (Cumulative Layout Shift)</span>
              <strong className="vital-val good">0.00</strong>
            </div>
          </div>
        </div>

        <div className="split-card">
          <div className="split-card-header">
            <h3>Top Edge Regions</h3>
            <span className="vitals-badge">Global Routing</span>
          </div>
          <div className="regions-list">
            {regions.map((r) => (
              <div key={r.code} className="region-item">
                <div className="region-code-box">{r.code}</div>
                <div className="region-details">
                  <span className="region-name">{r.name}</span>
                  <div className="region-bar-track">
                    <div
                      className="region-bar-fill"
                      style={{ width: r.share }}
                    />
                  </div>
                </div>
                <div className="region-stats">
                  <span className="region-share">{r.share}</span>
                  <span className="region-lat">{r.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
