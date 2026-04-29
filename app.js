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
  const statusDeck = document.getElementById("status-deck");
  const spotlight = document.getElementById("spotlight");
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
  const openFeaturedDrawer = document.getElementById("open-featured-drawer");

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

  function isProjectVisible(project) {
    return getVisibleProjects().some((candidate) => candidate.id === project.id);
  }

  function getLocalPrimaryAction(project) {
    return project.actions.find((action) => action.kind === "primary" && !action.disabled) || null;
  }

  function getPublicRoute(project) {
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
    switch (project.publicStatus) {
      case "live":
        return "Live on the public site now.";
      case "local_only":
        return "Tracked here, but still local-only until a public build exists.";
      default:
        return "Reserved public route with a branded placeholder until the build is staged.";
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

  function getLaunchStateTitle(project) {
    switch (project.publicStatus) {
      case "live":
        return "Public Route Live";
      case "local_only":
        return "Local Build Only";
      default:
        return "Placeholder Route";
    }
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

  function setTheme(project) {
    root.style.setProperty("--signal", project.visualTheme.accent);
    root.style.setProperty("--signal-strong", project.visualTheme.accentAlt);
    root.style.setProperty("--signal-soft", project.visualTheme.glow);
  }

  function projectCoverStyle(project) {
    const { accent, accentAlt, glow, base } = project.visualTheme;
    return [
      `radial-gradient(circle at 20% 26%, ${glow}, transparent 32%)`,
      `radial-gradient(circle at 76% 24%, ${accentAlt}22, transparent 24%)`,
      `linear-gradient(135deg, ${base} 0%, ${accent}22 55%, ${accentAlt}18 100%)`,
    ].join(", ");
  }

  function renderStatusDeck() {
    const hostedCount = projects.filter((project) => project.publicStatus === "live").length;
    const placeholderCount = projects.filter((project) => project.publicStatus === "placeholder").length;
    const localOnlyCount = projects.filter((project) => project.publicStatus === "local_only").length;
    const browserCount = projects.filter((project) => project.platform.includes("Browser")).length;

    statusDeck.innerHTML = `
      <article class="status-card">
        <span>Tracked projects</span>
        <strong>${projects.length}</strong>
        <span>Curated entries with stable slugs and public route planning.</span>
      </article>
      <article class="status-card">
        <span>Hosted now</span>
        <strong>${hostedCount}</strong>
        <span>Projects with a real public build under the main domain.</span>
      </article>
      <article class="status-card">
        <span>Queued routes</span>
        <strong>${placeholderCount}</strong>
        <span>Projects with public placeholder routes ready for future staging.</span>
      </article>
      <article class="status-card">
        <span>Local-only entries</span>
        <strong>${localOnlyCount}</strong>
        <span>${browserCount} browser-focused projects are tracked here overall.</span>
      </article>
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

  function renderSpotlight() {
    const project = getSelectedProject();
    const projectIsVisible = isProjectVisible(project);
    const publicActions = getPublicActions(project);

    setTheme(project);

    spotlight.innerHTML = `
      <div class="eyebrow">Selected Dossier</div>
      <div class="spotlight-cover" style="background:${projectCoverStyle(project)}"></div>
      <div class="spotlight-body">
        <div class="spotlight-meta">
          <span class="status-pill" data-status="${project.status}">${statusLabel(project.status)}</span>
          <span class="meta-pill">${escapeHtml(project.genre)}</span>
          <span class="meta-pill">${escapeHtml(project.platform)}</span>
          <span class="meta-pill" data-public-status="${project.publicStatus}">${getPublicStatusLabel(project.publicStatus)}</span>
          ${project.featured ? '<span class="meta-pill">Featured</span>' : ""}
          ${projectIsVisible ? "" : '<span class="meta-pill">Outside current filter</span>'}
        </div>

        <div class="spotlight-title-row">
          <div>
            <h3>${escapeHtml(project.title)}</h3>
            <p class="spotlight-summary">${escapeHtml(project.detailSummary)}</p>
          </div>
          <button class="drawer-close" id="open-drawer-button" type="button" aria-label="Open full project details">
            +
          </button>
        </div>

        <div class="stat-blocks">
          <div class="stat-block">
            <span>Launch state</span>
            <strong>${escapeHtml(getLaunchStateTitle(project))}</strong>
          </div>
          <div class="stat-block">
            <span>Public route</span>
            <strong>${escapeHtml(getPublicRoute(project))}</strong>
          </div>
          <div class="stat-block">
            <span>Control set</span>
            <strong>${escapeHtml(project.controls[0])}</strong>
          </div>
        </div>

        <div class="drawer-section">
          <h4>Public availability</h4>
          <p class="drawer-summary">${escapeHtml(getPublicStatusSummary(project))}</p>
        </div>

        <div class="drawer-section">
          <h4>Tech stack</h4>
          <div class="stack-list">
            ${project.tech.map((item) => `<span class="stack-chip">${escapeHtml(item)}</span>`).join("")}
          </div>
        </div>

        <div class="drawer-section">
          <h4>Control snapshot</h4>
          <div class="control-list">
            ${project.controls.map((item) => `<span class="control-chip">${escapeHtml(item)}</span>`).join("")}
          </div>
        </div>

        <div class="drawer-section">
          <h4>Launch actions</h4>
          <div class="action-row">
            ${renderActionRow(publicActions)}
          </div>
        </div>
      </div>
    `;

    spotlight.querySelector("#open-drawer-button")?.addEventListener("click", openDrawer);
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
          <p>Reset the rail to restore the full catalog. Your selected project stays pinned in the dossier until you choose another.</p>
          <button class="button button-primary" id="empty-reset" type="button">Reset Filters</button>
        </article>
      `;

      grid.querySelector("#empty-reset")?.addEventListener("click", resetFilters);
      return;
    }

    grid.innerHTML = visibleProjects
      .map((project) => {
        const publicActions = getPublicActions(project);

        return `
          <article class="project-card ${project.id === selectedProject.id ? "is-selected" : ""}" role="listitem">
            <div class="project-card-header">
              <button class="card-select" type="button" data-project-select="${escapeHtml(project.id)}">
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
              ${renderActionRow(publicActions, 2)}
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

    drawer.innerHTML = `
      <div class="drawer-header">
        <div>
          <div class="eyebrow">Project Dossier</div>
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
          <h4>Public route</h4>
          <p class="drawer-summary">${escapeHtml(getPublicRoute(project))} — ${escapeHtml(getPublicStatusSummary(project))}</p>
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
      </div>
    `;

    drawer.querySelector("#close-drawer")?.addEventListener("click", closeDrawer);
  }

  function renderAll() {
    renderStatusDeck();
    renderFilters();
    renderSpotlight();
    renderProjects();
    renderDrawer();
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

  function selectProject(projectId) {
    state.selectedProjectId = projectId;
    renderAll();
  }

  function openDrawer() {
    state.drawerOpen = true;
    drawerShell.hidden = false;
    document.body.classList.add("drawer-open");
    renderDrawer();
    window.requestAnimationFrame(() => drawer.focus());
  }

  function closeDrawer() {
    state.drawerOpen = false;
    drawerShell.hidden = true;
    document.body.classList.remove("drawer-open");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderProjects();
    renderSpotlight();
    if (state.drawerOpen) {
      renderDrawer();
    }
  });

  clearFiltersButton.addEventListener("click", resetFilters);
  openFeaturedDrawer.addEventListener("click", openDrawer);
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

    const selectionTarget = event.target.closest("[data-project-select]");
    if (selectionTarget) {
      const projectId = selectionTarget.getAttribute("data-project-select");
      if (projectId) {
        selectProject(projectId);
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.drawerOpen) {
      closeDrawer();
    }
  });

  renderAll();
})();
