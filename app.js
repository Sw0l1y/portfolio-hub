(() => {
  const LAUNCH_DATE = new Date('2024-01-15T00:00:00Z');
  const GITHUB_USER = 'Sw0l1y';

  // ── Catalog augmentation ─────────────────────────────────────────────────

  function getKind(p) {
    if (p.status === 'abandoned') return 'DEPRECATED';
    if (p.genre === 'Editor') return 'TOOLS';
    return 'GAMES';
  }

  const projects = (window.PORTFOLIO_CATALOG || [])
    .map(p => ({ ...p, kind: getKind(p) }))
    .sort((a, b) => {
      const order = { GAMES: 0, TOOLS: 1, DEPRECATED: 2 };
      const diff = (order[a.kind] ?? 3) - (order[b.kind] ?? 3);
      return diff !== 0 ? diff : a.sortOrder - b.sortOrder;
    });

  if (!projects.length) throw new Error('Portfolio catalog is empty.');

  // ── State ────────────────────────────────────────────────────────────────

  const state = {
    page: 'works',
    detailId: null,
    filter: 'ALL',
    gitFeed: null,
    gitLoading: false,
  };

  let uptimeInterval = null;
  let detailKeyHandler = null;

  // ── Helpers ──────────────────────────────────────────────────────────────

  function esc(v) {
    return String(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function coverGradient(p) {
    const { accent, accentAlt, glow, base } = p.visualTheme;
    return [
      `radial-gradient(circle at 18% 22%, ${glow}, transparent 32%)`,
      `radial-gradient(circle at 78% 22%, ${accentAlt}22, transparent 24%)`,
      `linear-gradient(135deg, ${base} 0%, ${accent}20 58%, ${accentAlt}16 100%)`,
    ].join(', ');
  }

  function getPlayUrl(p) {
    if (p.publicStatus !== 'live') return null;
    if (p.publicPath) return p.publicPath;
    return `/games/${encodeURIComponent(p.slug)}/`;
  }

  function formatUptime() {
    const ms = Math.max(0, Date.now() - LAUNCH_DATE.getTime());
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }

  function getLatest() {
    return projects.find(p => p.featured) || projects[0];
  }

  function getFiltered() {
    return state.filter === 'ALL'
      ? projects.filter(p => p.kind !== 'DEPRECATED')
      : projects.filter(p => p.kind === state.filter);
  }

  function relativeTime(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
  }

  function eventKind(ev) {
    switch (ev.type) {
      case 'PushEvent': return 'push';
      case 'CreateEvent': return ev.payload?.ref_type === 'tag' ? 'tag' : 'create';
      case 'IssuesEvent': return 'issue';
      case 'PullRequestEvent': return 'pr';
      case 'ReleaseEvent': return 'release';
      case 'WatchEvent': return 'star';
      case 'ForkEvent': return 'fork';
      default: return ev.type.replace('Event', '').toLowerCase();
    }
  }

  function eventMsg(ev) {
    if (ev.type === 'PushEvent') {
      const commits = ev.payload?.commits || [];
      return commits[0]?.message?.split('\n')[0] || 'push';
    }
    if (ev.type === 'CreateEvent') return `created ${ev.payload?.ref || ev.payload?.ref_type || 'ref'}`;
    if (ev.type === 'ReleaseEvent') return ev.payload?.release?.tag_name || 'release';
    return '—';
  }

  // ── HTML blocks ──────────────────────────────────────────────────────────

  function topbarHtml() {
    const { page } = state;
    const onWorks = page !== 'info';
    return `
      <header class="topbar">
        <span>SWOL ／ PUBLIC ARCHIVE</span>
        <span class="topbar-status">OPERATOR: SW0L1Y · STATUS: ACTIVE</span>
        <nav class="topbar-nav">
          <span class="nav-link ${onWorks ? 'is-active' : ''}" data-nav="works">WORKS</span>
          <span class="nav-link ${page === 'info' ? 'is-active' : ''}" data-nav="info">INFO</span>
        </nav>
      </header>`;
  }

  function footerHtml(section) {
    return `
      <footer class="footer-bar">
        <span>EOF — SECTION ${String(section).padStart(3, '0')}</span>
        <span>SWOL · PUBLIC ARCHIVE · ${new Date().getFullYear()}</span>
        <span class="footer-top" data-scroll-top>↑ TOP</span>
      </footer>`;
  }

  function cardHtml(p, idx) {
    const num = String(idx + 1).padStart(2, '0');
    const dateStamp = `${p.year || '—'}${p.q ? '.' + p.q : ''}`;
    const cls = p.kind === 'DEPRECATED' ? 'card card--deprecated' : 'card';
    return `
      <div class="${cls}" data-nav-detail="${esc(p.id)}">
        <div class="card-cover" style="background:${coverGradient(p)}">
          <div class="card-cover-fig">№ ${num} · ${p.year || '—'}</div>
          <div class="crops"><span></span></div>
          <div class="card-overlay">
            <div>
              <div class="card-overlay-meta">№ ${num} · ${dateStamp} · ${p.kind}</div>
              <div class="card-overlay-title">${esc(p.title)}</div>
              <div class="card-overlay-tagline">${esc(p.shortSummary)}</div>
            </div>
            <div class="card-overlay-footer">
              <span class="chip is-active" style="pointer-events:none">▶ OPEN RECORD</span>
              <span class="card-overlay-status">${esc(p.status.toUpperCase())}</span>
            </div>
          </div>
        </div>
        <div class="card-label">
          <span>${num} · ${esc(p.title.toLowerCase())}</span>
          <span>${dateStamp}</span>
        </div>
      </div>`;
  }

  // ── Works page ───────────────────────────────────────────────────────────

  function worksHtml() {
    const latest = getLatest();
    const filtered = getFiltered();
    const allYears = projects.map(p => p.year).filter(Boolean);
    const minYear = allYears.length ? Math.min(...allYears) : 2024;
    const maxYear = allYears.length ? Math.max(...allYears) : 2026;
    const activeCount = projects.filter(p => p.kind !== 'DEPRECATED').length;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

    return `
      ${topbarHtml()}
      <div class="page">
        <section class="banner">
          <div class="side-rail side-rail--left">
            ${['A','B','C','D','E','F','G'].map(l => `<span>${l}</span>`).join('')}
          </div>
          <div class="side-rail side-rail--right">
            ${['01','02','03','04','05','06','07'].map(l => `<span>${l}</span>`).join('')}
          </div>

          <div class="banner-body">
            <div class="banner-left">
              <div>
                <div class="doc-label">DOCUMENT 001 · CLASSIFICATION: PUBLIC · LAST REVISION ${today}</div>
                <h1 class="banner-title">PROJECT<br>ARCHIVE.</h1>
                <p class="banner-desc">COMPLETE INDEX OF SHIPPED WORKS — INTERACTIVE BUILDS, TOOLS, AND TECHNICAL EXPERIMENTS. ALL ENTRIES PLAYABLE IN-BROWSER. NO INSTALL REQUIRED.</p>
              </div>

              <div class="spec-strip">
                <div class="spec-cell">
                  <div class="spec-cell-header"><span>RECORDS</span></div>
                  <div class="spec-val">${activeCount}</div>
                </div>
                <div class="spec-cell">
                  <div class="spec-cell-header"><span>SPAN</span></div>
                  <div class="spec-val">${minYear}—${String(maxYear).slice(2)}</div>
                </div>
                <div class="spec-cell">
                  <div class="spec-cell-header"><span>UPTIME</span><span><span class="live-dot"></span>LIVE</span></div>
                  <div class="spec-val spec-val--mono" id="uptime-val">${formatUptime()}</div>
                </div>
                <div class="spec-cell spec-cell--link" data-nav-detail="${esc(latest.id)}">
                  <div class="spec-cell-header"><span>LATEST</span><span><span class="live-dot"></span>LIVE</span></div>
                  <div class="spec-val spec-val--sm">${esc(latest.title)}</div>
                </div>
              </div>

              <div class="banner-actions">
                <div class="btn-group">
                  <button class="btn btn-filled" data-scroll-index>↓ ENTER ARCHIVE</button>
                  <button class="btn" data-nav="info">↗ INFO</button>
                </div>
              </div>
            </div>

            <div class="hero-plate" data-nav-detail="${esc(latest.id)}">
              <div class="hero-cover" style="background:${coverGradient(latest)}">
                <div class="hero-cover-fig">FIG. 01 — REEL</div>
                <div class="crops"><span></span></div>
                <div class="hero-cover-action">
                  <span class="live-dot"></span>${esc(latest.title)} · OPEN RECORD →
                </div>
                <div class="hero-cover-dim">1920 × 1080 · LOOP</div>
              </div>
            </div>
          </div>

          <div class="banner-footer">
            <span>↓ PROCEED TO INDEX</span>
            <span>SECTION 002 / 004</span>
            <span>EOF — BANNER</span>
          </div>
        </section>

        <section class="index-section" id="section-index">
          <div class="index-header">
            <div>
              <div class="doc-label">SECTION 002 — INDEX</div>
              <div class="index-title">ALL RECORDS</div>
              <div class="index-meta" id="index-meta">
                ${filtered.length} ENTRIES · INDEXED ${minYear}—${maxYear} · SORT ↓ NEWEST
              </div>
            </div>
            <div class="filter-row">
              ${['ALL','GAMES','TOOLS','DEPRECATED'].map(f => `
                <button class="chip ${state.filter === f ? 'is-active' : ''}" data-filter="${f}">${f}</button>
              `).join('')}
            </div>
          </div>

          <div class="card-grid" id="card-grid">
            ${filtered.length
              ? filtered.map((p, i) => cardHtml(p, i)).join('')
              : `<div class="empty-message">NO ENTRIES MATCH THIS FILTER</div>`}
          </div>
        </section>

        ${footerHtml(2)}
      </div>`;
  }

  // ── Detail page ──────────────────────────────────────────────────────────

  function detailHtml(id) {
    const p = projects.find(x => x.id === id) || projects[0];
    const idx = projects.indexOf(p);
    const prev = projects[(idx - 1 + projects.length) % projects.length];
    const next = projects[(idx + 1) % projects.length];
    const num = String(idx + 1).padStart(3, '0');
    const dateStamp = `${p.year || '—'}${p.q ? '.' + p.q : ''}`;
    const playUrl = getPlayUrl(p);
    const related = projects.filter(x => x.id !== p.id && x.kind === p.kind).slice(0, 4);

    const specRows = [
      ['CLASS', p.kind],
      ['STATUS', p.status.toUpperCase()],
      ['SHIPPED', `${p.year || '—'}${p.q ? ' · ' + p.q : ''}`],
      ['PLATFORM', p.platform],
      ['STACK', p.tech.slice(0, 2).join(' · ')],
    ];
    if (p.repoUrl) specRows.push(['REPO', `@sw0l1y/${p.slug}`]);

    return `
      ${topbarHtml()}
      <div class="page">
        <div class="record-crumb">
          <div class="record-crumb-left">
            <span class="hover-invert" data-nav="works">← INDEX</span>
            <span class="record-crumb-sep">／</span>
            <span>RECORD № ${String(idx + 1).padStart(2, '0')} ／ ${esc(p.title)}</span>
          </div>
          <div class="record-crumb-right">
            <span class="record-crumb-adj">${esc(prev.title)}</span>
            <span class="hover-invert" data-nav-detail="${esc(prev.id)}">← PREV</span>
            <span class="hover-invert" data-nav-detail="${esc(next.id)}">NEXT →</span>
            <span class="record-crumb-adj">${esc(next.title)}</span>
          </div>
        </div>

        <div class="record-header">
          <div class="doc-label">FILE ${num} · ${p.kind} · ${dateStamp}</div>
          <h2 class="record-title">${esc(p.title)}.</h2>
          <p class="record-tagline">${esc(p.shortSummary)}</p>
        </div>

        <div class="record-body">
          <div>
            <div class="doc-label">§ 1 — PLAYABLE EMBED</div>
            <div class="embed-plate" id="embed-plate">
              ${playUrl ? `
                <div class="embed-placeholder">
                  <div class="embed-placeholder-cover" style="background:${coverGradient(p)}">
                    <div class="crops"><span></span></div>
                  </div>
                  <button class="btn btn-filled embed-load-btn" data-embed-load="${esc(playUrl)}">▶ LOAD BUILD</button>
                </div>
              ` : `
                <div class="embed-placeholder">
                  <div class="embed-placeholder-cover" style="background:${coverGradient(p)};opacity:0.45">
                    <div class="crops"><span></span></div>
                  </div>
                  <div class="embed-load-btn" style="pointer-events:none;opacity:0.5;font-size:11px;letter-spacing:0.18em;text-transform:uppercase">NOT AVAILABLE</div>
                </div>
              `}
            </div>
            <div class="embed-meta">
              <span>CONTROLS · ${esc(p.controls.slice(0, 2).join(' · '))}</span>
              <span>${esc(p.status.toUpperCase())}</span>
            </div>

            <div class="record-section">
              <div class="doc-label">§ 2 — DESCRIPTION</div>
              <p class="record-desc">${esc(p.detailSummary)}</p>
            </div>

            <div class="record-section">
              <div class="doc-label">§ 3 — TECH STACK</div>
              <div class="tech-list">
                ${p.tech.map(t => `<span class="chip" style="pointer-events:none">${esc(t)}</span>`).join('')}
              </div>
            </div>
          </div>

          <aside>
            <div class="doc-label">SPECIFICATIONS</div>
            <div class="spec-table">
              ${specRows.map(([k, v], i) => `
                <div class="spec-row ${i === specRows.length - 1 ? 'spec-row--last' : ''}">
                  <span class="spec-row-key">${esc(k)}</span>
                  <span class="spec-row-val">${esc(String(v))}</span>
                </div>`).join('')}
            </div>

            <div class="record-actions">
              ${playUrl
                ? `<a class="btn btn-filled" href="${esc(playUrl)}" target="_blank" rel="noreferrer">↗ FULLSCREEN</a>`
                : `<button class="btn" disabled style="opacity:0.35;cursor:default">NOT AVAILABLE</button>`}
              ${p.repoUrl
                ? `<a class="btn" href="${esc(p.repoUrl)}" target="_blank" rel="noreferrer">↗ SOURCE / @SW0L1Y/${esc(p.slug.toUpperCase())}</a>`
                : ''}
            </div>

            <div class="key-hint">
              <div class="key-hint-label">KEYS</div>
              <div class="key-hint-row"><span><kbd>←</kbd> <kbd>→</kbd></span><span>browse records</span></div>
              <div class="key-hint-row"><span><kbd>ESC</kbd></span><span>back to index</span></div>
            </div>
          </aside>
        </div>

        ${related.length ? `
          <div class="related-section">
            <div class="doc-label">§ 4 — RELATED RECORDS</div>
            <div class="related-grid">
              ${related.map(rp => `
                <div class="card" data-nav-detail="${esc(rp.id)}">
                  <div class="card-cover card-cover--sm" style="background:${coverGradient(rp)}">
                    <div class="card-cover-fig">${rp.year || ''}${rp.q ? '.' + rp.q : ''}</div>
                    <div class="crops"><span></span></div>
                    <div class="card-overlay">
                      <div>
                        <div class="card-overlay-title" style="font-size:15px">${esc(rp.title)}</div>
                      </div>
                      <div class="card-overlay-footer">
                        <span class="chip is-active" style="pointer-events:none;font-size:9px;padding:4px 8px">▶ OPEN</span>
                      </div>
                    </div>
                  </div>
                  <div class="card-label">
                    <span>${esc(rp.title.toLowerCase())}</span>
                    <span>${rp.kind}</span>
                  </div>
                </div>`).join('')}
            </div>
          </div>
        ` : ''}

        ${footerHtml(3)}
      </div>`;
  }

  // ── Info page ────────────────────────────────────────────────────────────

  function infoHtml() {
    let feedContent;
    if (state.gitLoading) {
      feedContent = `<div class="feed-empty">— FETCHING ACTIVITY …</div>`;
    } else if (!state.gitFeed || !state.gitFeed.length) {
      feedContent = `<div class="feed-empty">— NO RECENT ACTIVITY FOUND</div>`;
    } else {
      feedContent = state.gitFeed.map(ev => `
        <div class="feed-row">
          <span class="feed-when">${esc(ev.when)}</span>
          <span class="feed-repo">${esc(ev.repo.toUpperCase())}</span>
          <span class="feed-kind">${esc(ev.kind)}</span>
          <span class="feed-msg">· ${esc(ev.msg)}</span>
        </div>`).join('');
    }

    const idRows = [
      ['HANDLE', 'SWOL'],
      ['DESIGNATION', 'OPERATOR / DEV'],
      ['DOMAIN', 'sw0l1ylab.com'],
      ['GITHUB', '@sw0l1y'],
      ['STATUS', 'ACTIVE'],
    ];

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

    return `
      ${topbarHtml()}
      <div class="page">
        <div class="record-header">
          <div class="doc-label">FILE 002 · OPERATOR PROFILE · LAST REVISION ${today}</div>
          <h2 class="record-title">OPERATOR<br>PROFILE.</h2>
        </div>

        <div class="info-body">
          <aside>
            <div class="id-plate">
              <div class="id-plate-fig">FIG. 02 — ID PHOTO · 4×5</div>
              <div class="crops"><span></span></div>
            </div>
            <div class="spec-table" style="border-top:none">
              ${idRows.map(([k, v], i) => `
                <div class="spec-row ${i === idRows.length - 1 ? 'spec-row--last' : ''}">
                  <span class="spec-row-key">${esc(k)}</span>
                  <span class="spec-row-val">${esc(v)}</span>
                </div>`).join('')}
            </div>
          </aside>

          <div>
            <div class="info-section">
              <div class="doc-label">§ 1 — DESCRIPTION</div>
              <p style="font-size:15px;line-height:1.65;margin-top:12px;max-width:640px;letter-spacing:0.02em;text-transform:uppercase">
                INDEPENDENT OPERATOR. DESIGNS AND SHIPS BROWSER-BASED INTERACTIVE BUILDS — PRIMARILY SMALL-SCOPE GAMES AND EXPERIMENTS. ALL OUTPUT PUBLISHED PUBLICLY UNDER THIS ARCHIVE.
              </p>
            </div>

            <div class="info-section">
              <div class="doc-label">§ 2 — FEED <span class="live-dot" style="margin-left:6px"></span></div>
              <div class="git-feed">${feedContent}</div>
            </div>
          </div>
        </div>

        ${footerHtml(4)}
      </div>`;
  }

  // ── Render ───────────────────────────────────────────────────────────────

  function render() {
    const app = document.getElementById('app');
    if (!app) return;

    if (uptimeInterval) { clearInterval(uptimeInterval); uptimeInterval = null; }
    if (detailKeyHandler) {
      document.removeEventListener('keydown', detailKeyHandler);
      detailKeyHandler = null;
    }

    if (state.page === 'works') {
      app.innerHTML = worksHtml();
      startUptimeTicker();
      setupGridHover();
    } else if (state.page === 'detail') {
      app.innerHTML = detailHtml(state.detailId);
      attachDetailKeyboard();
    } else if (state.page === 'info') {
      app.innerHTML = infoHtml();
      if (state.gitFeed === null && !state.gitLoading) fetchGitFeed();
    }

    window.scrollTo(0, 0);
  }

  function startUptimeTicker() {
    uptimeInterval = setInterval(() => {
      const el = document.getElementById('uptime-val');
      if (el) { el.textContent = formatUptime(); }
      else { clearInterval(uptimeInterval); uptimeInterval = null; }
    }, 1000);
  }

  function setupGridHover() {
    const grid = document.getElementById('card-grid');
    if (!grid) return;
    grid.addEventListener('mouseenter', () => grid.classList.add('is-hovering'));
    grid.addEventListener('mouseleave', () => grid.classList.remove('is-hovering'));
  }

  function attachDetailKeyboard() {
    const p = projects.find(x => x.id === state.detailId) || projects[0];
    const idx = projects.indexOf(p);
    const prevId = projects[(idx - 1 + projects.length) % projects.length].id;
    const nextId = projects[(idx + 1) % projects.length].id;

    detailKeyHandler = (e) => {
      if (e.key === 'ArrowLeft')  navigate('detail', prevId);
      if (e.key === 'ArrowRight') navigate('detail', nextId);
      if (e.key === 'Escape')     navigate('works');
    };
    document.addEventListener('keydown', detailKeyHandler);
  }

  // ── Filter partial update (no scroll) ───────────────────────────────────

  function applyFilter(f) {
    state.filter = f;
    const filtered = getFiltered();
    const allYears = projects.map(p => p.year).filter(Boolean);
    const minYear = allYears.length ? Math.min(...allYears) : 2024;
    const maxYear = allYears.length ? Math.max(...allYears) : 2026;

    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.filter === f);
    });

    const meta = document.getElementById('index-meta');
    if (meta) {
      meta.textContent = `${filtered.length} ENTRIES · INDEXED ${minYear}—${maxYear} · SORT ↓ NEWEST`;
    }

    const grid = document.getElementById('card-grid');
    if (grid) {
      grid.classList.remove('is-hovering');
      grid.innerHTML = filtered.length
        ? filtered.map((p, i) => cardHtml(p, i)).join('')
        : `<div class="empty-message">NO ENTRIES MATCH THIS FILTER</div>`;
      setupGridHover();
    }
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  function navigate(page, id = null) {
    state.page = page;
    state.detailId = id;
    render();
  }

  // ── Event delegation ─────────────────────────────────────────────────────

  document.addEventListener('click', (e) => {
    const navEl = e.target.closest('[data-nav]');
    if (navEl) { navigate(navEl.dataset.nav); return; }

    const detailEl = e.target.closest('[data-nav-detail]');
    if (detailEl) { navigate('detail', detailEl.dataset.navDetail); return; }

    const filterBtn = e.target.closest('[data-filter]');
    if (filterBtn) { applyFilter(filterBtn.dataset.filter); return; }

    const embedBtn = e.target.closest('[data-embed-load]');
    if (embedBtn) {
      const url = embedBtn.dataset.embedLoad;
      const plate = document.getElementById('embed-plate');
      const p = projects.find(x => x.id === state.detailId);
      if (plate) {
        plate.innerHTML = `
          <iframe class="embed-iframe" src="${esc(url)}" allowfullscreen></iframe>
          <button class="btn embed-stop-btn" data-embed-stop>■ STOP</button>`;
      }
      return;
    }

    const stopBtn = e.target.closest('[data-embed-stop]');
    if (stopBtn) {
      const p = projects.find(x => x.id === state.detailId);
      const playUrl = p ? getPlayUrl(p) : null;
      const plate = document.getElementById('embed-plate');
      if (plate && p && playUrl) {
        plate.innerHTML = `
          <div class="embed-placeholder">
            <div class="embed-placeholder-cover" style="background:${coverGradient(p)}">
              <div class="crops"><span></span></div>
            </div>
            <button class="btn btn-filled embed-load-btn" data-embed-load="${esc(playUrl)}">▶ LOAD BUILD</button>
          </div>`;
      }
      return;
    }

    const scrollIndex = e.target.closest('[data-scroll-index]');
    if (scrollIndex) {
      document.getElementById('section-index')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const scrollTop = e.target.closest('[data-scroll-top]');
    if (scrollTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  });

  // ── Git feed ─────────────────────────────────────────────────────────────

  async function fetchGitFeed() {
    state.gitLoading = true;
    try {
      const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/events/public`, {
        headers: { 'Accept': 'application/vnd.github+json' },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      state.gitFeed = data.slice(0, 14).map(ev => ({
        when: relativeTime(ev.created_at),
        repo: ev.repo.name.replace(`${GITHUB_USER}/`, ''),
        kind: eventKind(ev),
        msg: eventMsg(ev),
      }));
    } catch {
      state.gitFeed = [];
    } finally {
      state.gitLoading = false;
      if (state.page === 'info') {
        const feedEl = document.querySelector('.git-feed');
        if (feedEl) {
          if (!state.gitFeed || !state.gitFeed.length) {
            feedEl.innerHTML = `<div class="feed-empty">— NO RECENT ACTIVITY FOUND</div>`;
          } else {
            feedEl.innerHTML = state.gitFeed.map(ev => `
              <div class="feed-row">
                <span class="feed-when">${esc(ev.when)}</span>
                <span class="feed-repo">${esc(ev.repo.toUpperCase())}</span>
                <span class="feed-kind">${esc(ev.kind)}</span>
                <span class="feed-msg">· ${esc(ev.msg)}</span>
              </div>`).join('');
          }
        }
      }
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────────

  render();
})();
