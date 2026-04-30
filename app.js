(() => {
  /** @type {typeof window.PORTFOLIO_CATALOG} */
  const projects = [...(window.PORTFOLIO_CATALOG || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  if (!projects.length) {
    throw new Error("Portfolio catalog is empty.");
  }

  const state = {
    selectedProjectId: (projects.find((project) => project.featured) || projects[0]).id,
    search: "",
    selectedStatuses: new Set(),
    selectedGenres: new Set(),
    selectedPlatforms: new Set(),
    drawerOpen: false,
  };

  const root = document.documentElement;
  const catalogSummary = document.getElementById("catalog-summary");
  const grid = document.getElementById("project-grid");
  const resultSummary = document.getElementById("result-summary");
  const searchInput = document.getElementById("search-input");
  const statusFilters = document.getElementById("status-filters");
  const genreFilters = document.getElementById("genre-filters");
  const platformFilters = document.getElementById("platform-filters");
  const clearFiltersButton = document.getElementById("clear-filters");
  const drawerShell = document.getElementById("drawer-shell");
  const drawerBackdrop = document.getElementById("drawer-backdrop");
  const drawer = document.getElementById("project-drawer");

  const filterConfig = [
    { key: "status", values: uniqueValues("status"), mount: statusFilters, set: state.selectedStatuses },
    { key: "genre", values: uniqueValues("genre"), mount: genreFilters, set: state.selectedGenres },
    { key: "platform", values: uniqueValues("platform"), mount: platformFilters, set: state.selectedPlatforms },
  ];

  function uniqueValues(key) {
    return [...new Set(projects.map((project) => project[key]))].sort((left, right) =>
      String(left).localeCompare(String(right))
    );
  }

  function getProjectById(projectId) {
    return projects.find((project) => project.id === projectId) || projects[0];
  }

  function getSelectedProject() {
    return getProjectById(state.selectedProjectId);
  }

  function getVisibleProjects() {
    const query = state.search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesQuery =
        !query ||
        `${project.title} ${project.shortSummary} ${project.detailSummary}`.toLowerCase().includes(query);

      const matchesStatus = !state.selectedStatuses.size || state.selectedStatuses.has(project.status);
      const matchesGenre = !state.selectedGenres.size || state.selectedGenres.has(project.genre);
      const matchesPlatform = !state.selectedPlatforms.size || state.selectedPlatforms.has(project.platform);

      return matchesQuery && matchesStatus && matchesGenre && matchesPlatform;
    });
  }

  function getLocalPrimaryAction(project) {
    return project.actions.find((action) => action.kind === "primary" && !action.disabled) || null;
  }

  function getPublicRoute(project) {
    if (project.publicPath) {
      return project.publicPath;
    }

    return `/games/${encodeURIComponent(project.slug)}/`;
  }

  function getPublicStatusLabel(publicStatus) {
    switch (publicStatus) {
      case "live":
        return "Hosted";
      case "local_only":
        return "Local Only";
      default:
        return "Coming Soon";
    }
  }

  function getPublicStatusSummary(project) {
    if (project.status === "abandoned") {
      return "This project is no longer in active development.";
    }
    switch (project.publicStatus) {
      case "live":
        return "Live on the public site now.";
      case "local_only":
        return "Tracked here, but still local-only until a public build exists.";
      default:
        return "Reserved public route until the build is staged.";
    }
  }

  function getPrimaryActionLabel(project) {
    const localPrimaryAction = getLocalPrimaryAction(project);

    if (project.publicStatus === "live" && localPrimaryAction) {
      return localPrimaryAction.label;
    }

    if (project.publicStatus === "local_only") {
      return "Local Build";
    }

    if (project.status === "abandoned") {
      return "Shelved";
    }

    return "Coming Soon";
  }

  function getPublicActions(project) {
    const actions = [
      {
        label: getPrimaryActionLabel(project),
        href: getPublicRoute(project),
        kind: "primary",
      },
    ];

    if (project.repoUrl) {
      actions.push({ label: "GitHub", href: project.repoUrl, kind: "secondary" });
    }

    if (project.notesUrl) {
      actions.push({ label: "Notes", href: project.notesUrl, kind: "secondary" });
    }

    return actions;
  }

  function statusLabel(status) {
    if (status === "wip") {
      return "WIP";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function encodeHref(href) {
    return href ? encodeURI(href) : "";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function setTheme(project) {
    root.style.setProperty("--signal", project.visualTheme.accent);
    root.style.setProperty("--signal-strong", project.visualTheme.accentAlt);
    root.style.setProperty("--signal-soft", project.visualTheme.glow);
  }

  function projectCoverStyle(project) {
    const { accent, accentAlt, glow, base } = project.visualTheme;
    return [
      `radial-gradient(circle at 18% 22%, ${glow}, transparent 32%)`,
      `radial-gradient(circle at 78% 22%, ${accentAlt}22, transparent 24%)`,
      `linear-gradient(135deg, ${base} 0%, ${accent}20 58%, ${accentAlt}16 100%)`,
    ].join(", ");
  }

  function renderCatalogSummary() {
    const hostedCount = projects.filter((project) => project.publicStatus === "live").length;
    const placeholderCount = projects.filter((project) => project.publicStatus === "placeholder").length;
    const localOnlyCount = projects.filter((project) => project.publicStatus === "local_only").length;

    catalogSummary.innerHTML = `
      <span class="summary-pill"><strong>${projects.length}</strong> tracked</span>
      <span class="summary-pill"><strong>${hostedCount}</strong> live</span>
      <span class="summary-pill"><strong>${placeholderCount}</strong> queued</span>
      <span class="summary-pill"><strong>${localOnlyCount}</strong> local-only</span>
    `;
  }

  function renderAction(action, extraClass = "") {
    const classes = ["button", extraClass || ""].filter(Boolean).join(" ");

    if (action.disabled || !action.href) {
      return `<button class="${classes} button-disabled" type="button" disabled title="${escapeHtml(
        action.note || "Unavailable"
      )}">${escapeHtml(action.label)}</button>`;
    }

    const actionStyle = action.kind === "primary" ? "button-primary" : "button-ghost";
    return `<a class="${classes} ${actionStyle}" href="${encodeHref(
      action.href
    )}" target="_blank" rel="noreferrer">${escapeHtml(action.label)}</a>`;
  }

  function renderActionRow(actions, secondaryLimit = actions.length) {
    const primaryAction = actions.find((action) => action.kind === "primary") || null;
    const secondaryActions = actions.filter((action) => action.kind !== "primary").slice(0, secondaryLimit);
    return `${primaryAction ? renderAction(primaryAction) : ""}${secondaryActions
      .map((action) => renderAction(action, "button-secondary"))
      .join("")}`;
  }

  function renderFilters() {
    filterConfig.forEach(({ key, values, mount, set }) => {
      mount.innerHTML = values
        .map(
          (value) => `
            <button
              class="chip"
              type="button"
              data-filter-key="${key}"
              data-filter-value="${escapeHtml(String(value))}"
              aria-pressed="${set.has(value) ? "true" : "false"}"
            >
              ${escapeHtml(String(value))}
            </button>
          `
        )
        .join("");
    });
  }

  function renderProjects() {
    const visibleProjects = getVisibleProjects();
    const selectedProject = getSelectedProject();

    resultSummary.textContent = `${visibleProjects.length} visible of ${projects.length} tracked`;

    if (!visibleProjects.length) {
      grid.innerHTML = `
        <article class="empty-state">
          <div class="eyebrow">No Matches</div>
          <h3>The current filter route returned zero projects.</h3>
          <p>Reset the filters to restore the full catalog. Your selected project stays ready in the details drawer.</p>
          <button class="button button-primary" id="empty-reset" type="button">Reset Filters</button>
        </article>
      `;

      grid.querySelector("#empty-reset")?.addEventListener("click", resetFilters);
      return;
    }

    grid.innerHTML = visibleProjects
      .map((project) => {
        const publicActions = getPublicActions(project);
        const primaryAction = publicActions.find((action) => action.kind === "primary") || null;

        return `
          <article class="project-card ${project.id === selectedProject.id ? "is-selected" : ""}" role="listitem">
            <div class="project-card-header">
              <button class="card-select" type="button" data-project-open="${escapeHtml(project.id)}">
                <div class="project-cover" style="background:${projectCoverStyle(project)}"></div>
                <div class="card-meta">
                  <span class="status-pill" data-status="${project.status}">${statusLabel(project.status)}</span>
                  <span class="meta-pill">${escapeHtml(project.genre)}</span>
                  <span class="meta-pill">${escapeHtml(project.platform)}</span>
                  <span class="meta-pill" data-public-status="${project.publicStatus}">${getPublicStatusLabel(project.publicStatus)}</span>
                </div>
                <h3 class="project-card-title">${escapeHtml(project.title)}</h3>
              </button>
              <p>${escapeHtml(project.shortSummary)}</p>
            </div>

            <div class="card-actions">
              ${primaryAction ? renderAction(primaryAction) : ""}
              <button class="button button-secondary" type="button" data-project-open="${escapeHtml(project.id)}">
                Details
              </button>
            </div>

            <div class="card-footnote">${escapeHtml(project.tech.slice(0, 2).join(" • "))}</div>
          </article>
        `;
      })
      .join("");
  }

  function renderDrawer() {
    const project = getSelectedProject();
    const publicActions = getPublicActions(project);

    setTheme(project);

    drawer.innerHTML = `
      <div class="drawer-header">
        <div>
          <div class="eyebrow">Project Details</div>
          <h3 id="drawer-title">${escapeHtml(project.title)}</h3>
        </div>
        <button class="drawer-close" id="close-drawer" type="button" aria-label="Close project details">
          ×
        </button>
      </div>

      <div class="drawer-cover" style="background:${projectCoverStyle(project)}"></div>

      <div class="drawer-body">
        <div class="drawer-meta">
          <span class="status-pill" data-status="${project.status}">${statusLabel(project.status)}</span>
          <span class="meta-pill">${escapeHtml(project.genre)}</span>
          <span class="meta-pill">${escapeHtml(project.platform)}</span>
          <span class="meta-pill" data-public-status="${project.publicStatus}">${getPublicStatusLabel(project.publicStatus)}</span>
        </div>

        <div class="drawer-section">
          <h4>Summary</h4>
          <p class="drawer-summary">${escapeHtml(project.detailSummary)}</p>
        </div>

        <div class="drawer-section">
          <h4>Controls</h4>
          <div class="drawer-control-list">
            ${project.controls
              .map((control) => `<div class="drawer-control-item">${escapeHtml(control)}</div>`)
              .join("")}
          </div>
        </div>

        <div class="drawer-section">
          <h4>Tech</h4>
          <div class="stack-list">
            ${project.tech.map((item) => `<span class="stack-chip">${escapeHtml(item)}</span>`).join("")}
          </div>
        </div>

        <div class="drawer-section">
          <h4>Actions</h4>
          <div class="drawer-actions">${renderActionRow(publicActions)}</div>
        </div>

        <div class="drawer-section">
          <h4>Route</h4>
          <p class="drawer-summary">${escapeHtml(getPublicRoute(project))} — ${escapeHtml(getPublicStatusSummary(project))}</p>
        </div>
      </div>
    `;

    drawer.querySelector("#close-drawer")?.addEventListener("click", closeDrawer);
  }

  function renderAll() {
    renderCatalogSummary();
    renderFilters();
    renderProjects();
    if (state.drawerOpen) {
      renderDrawer();
    }
  }

  function toggleFilter(group, value) {
    if (group.has(value)) {
      group.delete(value);
    } else {
      group.add(value);
    }

    renderAll();
  }

  function resetFilters() {
    state.search = "";
    state.selectedStatuses.clear();
    state.selectedGenres.clear();
    state.selectedPlatforms.clear();
    searchInput.value = "";
    renderAll();
  }

  function openDrawer() {
    state.drawerOpen = true;
    drawerShell.hidden = false;
    document.body.classList.add("drawer-open");
    renderDrawer();
    window.requestAnimationFrame(() => drawer.focus());
  }

  function openProject(projectId) {
    state.selectedProjectId = projectId;
    renderProjects();
    openDrawer();
  }

  function closeDrawer() {
    state.drawerOpen = false;
    drawerShell.hidden = true;
    document.body.classList.remove("drawer-open");
  }

  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderProjects();
    if (state.drawerOpen) {
      renderDrawer();
    }
  });

  clearFiltersButton.addEventListener("click", resetFilters);
  drawerBackdrop.addEventListener("click", closeDrawer);

  document.addEventListener("click", (event) => {
    const filterTarget = event.target.closest("[data-filter-key]");
    if (filterTarget) {
      const key = filterTarget.getAttribute("data-filter-key");
      const value = filterTarget.getAttribute("data-filter-value");

      if (key === "status" && value) {
        toggleFilter(state.selectedStatuses, value);
      }

      if (key === "genre" && value) {
        toggleFilter(state.selectedGenres, value);
      }

      if (key === "platform" && value) {
        toggleFilter(state.selectedPlatforms, value);
      }

      return;
    }

    const projectTarget = event.target.closest("[data-project-open]");
    if (projectTarget) {
      const projectId = projectTarget.getAttribute("data-project-open");
      if (projectId) {
        openProject(projectId);
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.drawerOpen) {
      closeDrawer();
    }
  });

  setTheme(getSelectedProject());
  renderAll();
})();
