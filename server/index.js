
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const db = require("./database");

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = "http://localhost:5173";
const CALLBACK_URL =
  process.env.GITHUB_CALLBACK_URL ||
  "http://localhost:5000/api/github/callback";

const oauthStates = new Map();

const IMPORTS_DIR = path.resolve(__dirname, "imported-repos");
const MAX_ARCHIVE_BYTES = 50 * 1024 * 1024;
const MAX_EXTRACTED_BYTES = 200 * 1024 * 1024;
const MAX_FILES = 10000;

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json({ limit: "1mb" }));

// ==============================
// ENCRYPTION HELPERS
// ==============================

function getEncryptionKey() {
  const value = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;

  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(
      "GITHUB_TOKEN_ENCRYPTION_KEY must be 64 hexadecimal characters"
    );
  }

  return Buffer.from(value, "hex");
}

function encryptToken(token) {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  return [
    iv.toString("hex"),
    cipher.getAuthTag().toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

function decryptToken(encryptedValue) {
  const parts = encryptedValue.split(":");

  if (parts.length !== 3) {
    throw new Error("Stored GitHub token has an invalid format");
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;

  if (
    !/^[0-9a-f]{24}$/i.test(ivHex) ||
    !/^[0-9a-f]{32}$/i.test(authTagHex) ||
    !/^(?:[0-9a-f]{2})+$/i.test(ciphertextHex)
  ) {
    throw new Error("Stored GitHub token has an invalid format");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

// ==============================
// GITHUB HELPERS
// ==============================

function getLatestGitHubConnection() {
  return db.prepare(`
    SELECT
      github_user_id,
      github_username,
      access_token_encrypted
    FROM github_connections
    ORDER BY updated_at DESC, id DESC
    LIMIT 1
  `).get();
}

function githubHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// ==============================
// OAUTH STATE CLEANUP
// ==============================

setInterval(() => {
  const now = Date.now();

  for (const [state, createdAt] of oauthStates.entries()) {
    if (now - createdAt > 10 * 60 * 1000) {
      oauthStates.delete(state);
    }
  }
}, 60 * 1000).unref();

// ==============================
// HOME AND HEALTH
// ==============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Upnow API!",
    status: "Backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "Upnow Backend",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// ==============================
// START GITHUB OAUTH
// ==============================

app.get("/api/github", (req, res) => {
  if (
    !process.env.GITHUB_CLIENT_ID ||
    !process.env.GITHUB_CLIENT_SECRET
  ) {
    return res.status(500).json({
      success: false,
      message: "GitHub OAuth credentials are not configured",
    });
  }

  try {
    getEncryptionKey();
  } catch {
    return res.status(500).json({
      success: false,
      message: "GitHub token encryption key is missing or invalid",
    });
  }

  const state = crypto.randomBytes(32).toString("hex");
  oauthStates.set(state, Date.now());

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: "read:user user:email repo",
    state,
  });

  res.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
});

// ==============================
// GITHUB OAUTH CALLBACK
// ==============================

app.get("/api/github/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(
      "GitHub authorization was cancelled or denied. Return to Upnow and try again."
    );
  }

  if (
    typeof code !== "string" ||
    typeof state !== "string" ||
    !oauthStates.has(state)
  ) {
    return res.status(400).send(
      "Invalid or expired OAuth state. Please start again from Upnow."
    );
  }

  const createdAt = oauthStates.get(state);
  oauthStates.delete(state);

  if (Date.now() - createdAt > 10 * 60 * 1000) {
    return res.status(400).send(
      "OAuth request expired. Please start again from Upnow."
    );
  }

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: CALLBACK_URL,
      },
      {
        headers: { Accept: "application/json" },
        timeout: 15000,
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      console.error(
        "GitHub token exchange failed:",
        tokenResponse.data.error || "No access token returned"
      );

      return res.status(400).send(
        "GitHub authorization failed. Please reconnect your account."
      );
    }

    const userResponse = await axios.get(
      "https://api.github.com/user",
      {
        headers: githubHeaders(accessToken),
        timeout: 15000,
      }
    );

    const githubUser = userResponse.data;
    const encryptedToken = encryptToken(accessToken);

    db.prepare(`
      INSERT INTO github_connections
        (github_user_id, github_username, access_token_encrypted)
      VALUES (?, ?, ?)
      ON CONFLICT(github_user_id) DO UPDATE SET
        github_username = excluded.github_username,
        access_token_encrypted = excluded.access_token_encrypted,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      githubUser.id,
      githubUser.login,
      encryptedToken
    );

    console.log(
      `GitHub connected for: ${githubUser.login}`
    );

    return res.redirect(
      `${FRONTEND_URL}/?github=connected&login=${encodeURIComponent(
        githubUser.login
      )}`
    );
  } catch (err) {
    console.error(
      "GitHub OAuth error:",
      err.response?.status || err.message
    );

    return res.status(502).send(
      "GitHub connection failed. Please return to Upnow and try again."
    );
  }
});

// ==============================
// CHECK GITHUB CONNECTION
// ==============================

app.get("/api/github/connection", (req, res) => {
  try {
    const connection = db.prepare(`
      SELECT github_username, created_at, updated_at
      FROM github_connections
      ORDER BY updated_at DESC, id DESC
      LIMIT 1
    `).get();

    res.json({
      success: true,
      connected: Boolean(connection),
      connection: connection || null,
    });
  } catch (err) {
    console.error("GitHub connection lookup failed:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to check GitHub connection",
    });
  }
});

// ==============================
// LIST GITHUB REPOSITORIES
// ==============================

app.get("/api/github/repos", async (req, res) => {
  try {
    const connection = getLatestGitHubConnection();

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "GitHub is not connected. Connect GitHub first.",
      });
    }

    const accessToken = decryptToken(
      connection.access_token_encrypted
    );

    const response = await axios.get(
      "https://api.github.com/user/repos",
      {
        params: {
          sort: "updated",
          per_page: 100,
          affiliation: "owner,collaborator,organization_member",
        },
        headers: githubHeaders(accessToken),
        timeout: 20000,
      }
    );

    const repositories = response.data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      defaultBranch: repo.default_branch,
      url: repo.html_url,
      cloneUrl: repo.clone_url,
      updatedAt: repo.updated_at,
      language: repo.language,
    }));

    res.json({
      success: true,
      account: connection.github_username,
      count: repositories.length,
      repositories,
    });
  } catch (err) {
    console.error(
      "GitHub repositories error:",
      err.response?.status || err.message
    );

    if (err.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: "GitHub authorization expired. Reconnect GitHub.",
      });
    }

    if (err.response?.status === 403) {
      return res.status(403).json({
        success: false,
        message: "GitHub API access is restricted or rate-limited.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch GitHub repositories",
    });
  }
});

// ==============================
// IMPORT GITHUB REPOSITORY SOURCE
// ==============================

app.post("/api/github/import", async (req, res) => {
  let destination = null;

  try {
    const repoId = Number(req.body?.repoId);

    if (!Number.isSafeInteger(repoId) || repoId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid GitHub repository ID is required.",
      });
    }

    const connection = getLatestGitHubConnection();

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connect GitHub first.",
      });
    }

    const accessToken = decryptToken(
      connection.access_token_encrypted
    );

    // Verify access using the GitHub API. Never trust a client-supplied URL.
    const repoResponse = await axios.get(
      `https://api.github.com/repositories/${repoId}`,
      {
        headers: githubHeaders(accessToken),
        timeout: 20000,
      }
    );

    const repo = repoResponse.data;

    if (
      !repo.owner?.login ||
      !repo.name ||
      !repo.default_branch
    ) {
      return res.status(400).json({
        success: false,
        message: "Repository metadata is incomplete.",
      });
    }

    const safeName = repo.name.replace(/[^a-zA-Z0-9._-]/g, "-");

    destination = path.resolve(
      IMPORTS_DIR,
      `${repo.id}-${safeName}`
    );

    if (
      !destination.startsWith(IMPORTS_DIR + path.sep)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository destination.",
      });
    }

    // Download source archive from GitHub.
    const archiveResponse = await axios.get(
      `https://api.github.com/repos/${encodeURIComponent(
        repo.owner.login
      )}/${encodeURIComponent(repo.name)}/zipball/${encodeURIComponent(
        repo.default_branch
      )}`,
      {
        responseType: "arraybuffer",
        headers: githubHeaders(accessToken),
        timeout: 60000,
        maxContentLength: MAX_ARCHIVE_BYTES,
        maxBodyLength: MAX_ARCHIVE_BYTES,
      }
    );

    const zip = new AdmZip(Buffer.from(archiveResponse.data));
    const entries = zip.getEntries();

    if (entries.length > MAX_FILES) {
      return res.status(413).json({
        success: false,
        message: "Repository contains too many files.",
      });
    }

    if (entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Repository archive is empty.",
      });
    }

    // Validate every archive path before writing any file.
    for (const entry of entries) {
      const entryName = entry.entryName.replace(/\\/g, "/");
      const parts = entryName.split("/");
      const fileType = (entry.header.attr >>> 16) & 0o170000;

      if (
        entryName.startsWith("/") ||
        /^[a-zA-Z]:/.test(entryName) ||
        parts.some((part) => part === "..") ||
        fileType === 0o120000
      ) {
        return res.status(400).json({
          success: false,
          message: "Archive contains an unsafe path or symbolic link.",
        });
      }
    }

    const firstFile = entries.find((entry) => !entry.isDirectory);

    if (!firstFile) {
      return res.status(400).json({
        success: false,
        message: "Repository archive contains no files.",
      });
    }

    const wrapper = firstFile.entryName.split("/")[0] + "/";
    const files = [];
    let totalBytes = 0;

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const entryName = entry.entryName.replace(/\\/g, "/");

      if (!entryName.startsWith(wrapper)) continue;

      const relativePath = entryName.slice(wrapper.length);

      if (!relativePath) continue;

      const outputPath = path.resolve(destination, relativePath);

      if (!outputPath.startsWith(destination + path.sep)) {
        return res.status(400).json({
          success: false,
          message: "Archive contains an invalid file path.",
        });
      }

      totalBytes += entry.header.size;

      if (totalBytes > MAX_EXTRACTED_BYTES) {
        return res.status(413).json({
          success: false,
          message: "Repository exceeds the 200 MB extracted size limit.",
        });
      }

      files.push({
        entry,
        outputPath,
      });
    }

    // Don't overwrite an existing imported repository.
    if (fs.existsSync(destination)) {
      return res.status(409).json({
        success: false,
        message: "This repository has already been imported on this server.",
        path: destination,
      });
    }

    fs.mkdirSync(destination, { recursive: true });

    try {
      for (const file of files) {
        fs.mkdirSync(path.dirname(file.outputPath), {
          recursive: true,
        });

        fs.writeFileSync(
          file.outputPath,
          file.entry.getData(),
          { flag: "wx" }
        );
      }
    } catch (writeError) {
      // Remove an incomplete import so it can be retried.
      fs.rmSync(destination, {
        recursive: true,
        force: true,
      });

      throw writeError;
    }

    res.status(200).json({
      success: true,
      message: "Repository source code imported successfully.",
      repository: repo.full_name,
      path: destination,
      fileCount: files.length,
    });
  } catch (err) {
    console.error(
      "GitHub import error:",
      err.response?.status || err.message
    );

    if (err.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: "GitHub authorization expired. Reconnect GitHub.",
      });
    }

    if (err.response?.status === 403) {
      return res.status(403).json({
        success: false,
        message: "GitHub API access is restricted or rate-limited.",
      });
    }

    if (err.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Repository not found or not accessible.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Could not import repository source code.",
    });
  }
});

// ==============================
// GET ALL PROJECTS
// ==============================

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

// ==============================
// CREATE PROJECT
// ==============================

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

    if (
      typeof framework !== "string" ||
      framework.trim().length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Framework must be a string of 50 characters or fewer",
      });
    }

    const projectName = name.trim();
    const projectFramework = framework.trim() || "Other";

    const existingProject = db
      .prepare(
        "SELECT id FROM projects WHERE name = ? COLLATE NOCASE"
      )
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

// ==============================
// DELETE PROJECT
// ==============================

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

// ==============================
// UNKNOWN API ROUTES
// ==============================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// ==============================
// INVALID JSON HANDLER
// ==============================

app.use((error, req, res, next) => {
  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    "body" in error
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body",
    });
  }

  next(error);
});

// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {
  console.log(`Upnow backend running at http://localhost:${PORT}`);
});
