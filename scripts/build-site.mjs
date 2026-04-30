#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DIST_ROOT = path.join(REPO_ROOT, "dist");
const PUBLIC_GAMES_ROOT = path.join(REPO_ROOT, "public-games");
const EXTERNAL_GAMES_ROOT = path.join(REPO_ROOT, "external-games");
const ROOT_FILES = ["index.html", "app.js", "catalog.js", "styles.css"];
const EXTERNAL_GAME_SOURCES = {
  "clicker-game": {
    sourceDir: "clicker-game",
    entryFile: "Clicker.html",
  },
  "orbital-mechanics-sim": {
    sourceDir: "orbital-mechanics-sim",
    buildDir: "dist",
  },
  "momentum-trial": {
    sourceDir: "momentum-trial",
    entryFile: "game/Game.html",
  },
  "momentum-trial-editor": {
    sourceDir: "momentum-trial",
    entryFile: "editor/Level Editor.html",
  },
};

async function main() {
  await fs.rm(DIST_ROOT, { recursive: true, force: true });
  await fs.mkdir(DIST_ROOT, { recursive: true });

  await copyRootFiles();

  const projects = await loadPortfolioCatalog();
  const gamesRoot = path.join(DIST_ROOT, "games");
  await fs.mkdir(gamesRoot, { recursive: true });

  for (const project of projects) {
    validateProject(project);

    const routeRoot = path.join(gamesRoot, project.slug);
    const sourceRouteRoot = path.join(PUBLIC_GAMES_ROOT, project.slug);
    const externalSource = getExternalSource(project.slug);
    const routeIndex = path.join(routeRoot, "index.html");

    if (project.publicStatus === "live") {
      if (await directoryHasEntries(sourceRouteRoot)) {
        await copyDirectory(sourceRouteRoot, routeRoot);
      } else if (externalSource?.buildPath && (await directoryHasEntries(externalSource.buildPath))) {
        await copyDirectory(externalSource.buildPath, routeRoot);
      } else if (externalSource?.entryPath && (await fileExists(externalSource.entryPath))) {
        await fs.mkdir(routeRoot, { recursive: true });
        await fs.copyFile(externalSource.entryPath, routeIndex);
      } else {
        await fs.mkdir(routeRoot, { recursive: true });
        await fs.writeFile(routeIndex, buildPlaceholderHtml(project, "live_missing"), "utf8");
      }
      continue;
    }

    await fs.mkdir(routeRoot, { recursive: true });
    await fs.writeFile(routeIndex, buildPlaceholderHtml(project, project.publicStatus), "utf8");
  }

  console.log(`Built portfolio site in ${DIST_ROOT}`);
}

function getExternalSource(slug) {
  const config = EXTERNAL_GAME_SOURCES[slug];
  if (!config) {
    return null;
  }

  if (config.buildDir) {
    return {
      buildPath: path.join(EXTERNAL_GAMES_ROOT, config.sourceDir, config.buildDir),
    };
  }

  return {
    entryPath: path.join(EXTERNAL_GAMES_ROOT, config.sourceDir, config.entryFile),
  };
}

async function copyRootFiles() {
  for (const filename of ROOT_FILES) {
    await fs.copyFile(path.join(REPO_ROOT, filename), path.join(DIST_ROOT, filename));
  }
}

async function loadPortfolioCatalog() {
  const catalogPath = path.join(REPO_ROOT, "catalog.js");
  const source = await fs.readFile(catalogPath, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: catalogPath });
  const projects = sandbox.window.PORTFOLIO_CATALOG;
  if (!Array.isArray(projects)) {
    throw new Error("Portfolio catalog did not expose window.PORTFOLIO_CATALOG.");
  }
  return projects;
}

function validateProject(project) {
  if (!project || typeof project !== "object") {
    throw new Error("Invalid project entry in portfolio catalog.");
  }
  if (!project.slug || !/^[a-z0-9-]+$/.test(project.slug)) {
    throw new Error(`Project "${project.title || project.id}" is missing a valid slug.`);
  }
  if (!["live", "placeholder", "local_only"].includes(project.publicStatus)) {
    throw new Error(`Project "${project.title || project.id}" is missing a valid publicStatus.`);
  }
}

function buildPlaceholderHtml(project, mode) {
  const routeStatus = getRouteStatusLabel(mode);
  const message = getRouteMessage(project, mode);
  const notesLinks = [
    project.repoUrl ? `<a class="button button-secondary" href="${escapeHtml(project.repoUrl)}" target="_blank" rel="noreferrer">GitHub</a>` : "",
    project.notesUrl ? `<a class="button button-secondary" href="${escapeHtml(project.notesUrl)}" target="_blank" rel="noreferrer">Notes</a>` : "",
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(project.title)} | sw0l1ylab</title>
    <meta name="description" content="${escapeHtml(project.shortSummary)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="../../styles.css" />
    <style>
      :root {
        --signal: ${project.visualTheme.accent};
        --signal-strong: ${project.visualTheme.accentAlt};
        --signal-soft: ${project.visualTheme.glow};
      }
      .placeholder-shell {
        width: min(920px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 32px 0 72px;
      }
      .placeholder-panel {
        padding: 28px;
        display: grid;
        gap: 18px;
      }
      .placeholder-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .placeholder-summary {
        color: var(--muted);
        line-height: 1.7;
        max-width: 64ch;
      }
      .placeholder-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .placeholder-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .placeholder-controls .control-chip {
        max-width: 100%;
      }
    </style>
  </head>
  <body>
    <div class="page-noise" aria-hidden="true"></div>
    <div class="beam beam-a" aria-hidden="true"></div>
    <div class="beam beam-b" aria-hidden="true"></div>

    <main class="placeholder-shell">
      <section class="panel placeholder-panel">
        <div class="eyebrow">Public Route Placeholder</div>
        <div class="placeholder-meta">
          <span class="status-pill" data-status="${escapeHtml(project.status)}">${escapeHtml(statusLabel(project.status))}</span>
          <span class="meta-pill">${escapeHtml(project.genre)}</span>
          <span class="meta-pill">${escapeHtml(project.platform)}</span>
          <span class="meta-pill">${escapeHtml(routeStatus)}</span>
        </div>
        <div>
          <h1>${escapeHtml(project.title)}</h1>
        </div>
        <p class="placeholder-summary">${escapeHtml(project.detailSummary)}</p>
        <p class="placeholder-summary">${escapeHtml(message)}</p>

        <div class="drawer-section">
          <h4>Controls</h4>
          <div class="placeholder-controls">
            ${project.controls.map((item) => `<span class="control-chip">${escapeHtml(item)}</span>`).join("")}
          </div>
        </div>

        <div class="drawer-section">
          <h4>Tech</h4>
          <div class="stack-list">
            ${project.tech.map((item) => `<span class="stack-chip">${escapeHtml(item)}</span>`).join("")}
          </div>
        </div>

        <div class="placeholder-actions">
          <a class="button button-primary" href="/">Return to Portfolio</a>
          ${notesLinks}
        </div>
      </section>
    </main>
  </body>
</html>
`;
}

function getRouteStatusLabel(mode) {
  switch (mode) {
    case "live_missing":
      return "Build Missing";
    case "local_only":
      return "Local Only";
    default:
      return "Coming Soon";
  }
}

function getRouteMessage(project, mode) {
  switch (mode) {
    case "live_missing":
      return `This project is marked live in the portfolio, but no bundled public build was found yet for /games/${project.slug}/. Add a real build under public-games/${project.slug}/ and redeploy to replace this page.`;
    case "local_only":
      return "This project is tracked in the public portfolio, but it is still a local-only build for now. A public route will replace this page once the hosted version is ready.";
    default:
      return "This public route is reserved and ready. The hosted build has not been plugged in yet, so this placeholder stands in until the real game files are added.";
  }
}

function statusLabel(status) {
  if (status === "wip") {
    return "WIP";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function directoryHasEntries(targetPath) {
  try {
    const entries = await fs.readdir(targetPath);
    return entries.length > 0;
  } catch {
    return false;
  }
}

async function copyDirectory(sourceRoot, destinationRoot) {
  await fs.mkdir(destinationRoot, { recursive: true });
  const entries = await fs.readdir(sourceRoot, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceRoot, entry.name);
    const destinationPath = path.join(destinationRoot, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
    } else {
      await fs.copyFile(sourcePath, destinationPath);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
