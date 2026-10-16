const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./database");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Upnow API!",
    status: "Backend is running",
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "Upnow Backend",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// GET: Get all projects
app.get("/api/projects", (req, res) => {
  try {
    const projects = db
      .prepare("SELECT * FROM projects ORDER BY id DESC")
      .all();

    res.json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
});

// POST: Create a new project
app.post("/api/projects", (req, res) => {
  try {
    const { name, framework = "Other" } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Project name must be 100 characters or fewer",
      });
    }

    if (typeof framework !== "string" || framework.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "Framework must be a string of 50 characters or fewer",
      });
    }

    const projectName = name.trim();
    const projectFramework = framework.trim() || "Other";

    const existingProject = db
      .prepare("SELECT id FROM projects WHERE name = ? COLLATE NOCASE")
      .get(projectName);

    if (existingProject) {
      return res.status(409).json({
        success: false,
        message: "A project with this name already exists",
      });
    }

    const result = db
      .prepare(
        "INSERT INTO projects (name, framework) VALUES (?, ?)"
      )
      .run(projectName, projectFramework);

    const project = db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
});

// DELETE: Delete a project by ID
app.delete("/api/projects/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid project ID is required",
      });
    }

    const result = db
      .prepare("DELETE FROM projects WHERE id = ?")
      .run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      message: "Project deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete project",
    });
  }
});

// Handle unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Handle invalid JSON
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body",
    });
  }

  next(error);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Upnow backend running at http://localhost:${PORT}`);
});