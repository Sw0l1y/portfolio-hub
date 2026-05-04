(() => {
  /**
   * @typedef {"playable" | "prototype" | "wip" | "abandoned"} ProjectStatus
   * @typedef {"live" | "placeholder" | "local_only"} PublicStatus
   * @typedef {"primary" | "secondary" | "disabled"} ActionKind
   *
   * @typedef {{
   *   label: string
   *   href?: string
   *   kind: ActionKind
   *   disabled?: boolean
   *   note?: string
   * }} ProjectAction
   *
   * @typedef {{
   *   accent: string
   *   accentAlt: string
   *   glow: string
   *   base: string
   * }} VisualTheme
   *
   * @typedef {{
   *   id: string
   *   slug: string
   *   title: string
   *   status: ProjectStatus
   *   publicStatus: PublicStatus
   *   genre: string
   *   platform: string
   *   tech: string[]
   *   shortSummary: string
   *   detailSummary: string
   *   controls: string[]
   *   visualTheme: VisualTheme
   *   featured: boolean
   *   sortOrder: number
   *   year: number
   *   q: string
   *   actions: ProjectAction[]
   *   publicPath?: string
   *   repoUrl?: string
   *   notesUrl?: string
   * }} Project
   */

  /** @type {Project[]} */
  const projects = [
    {
      id: "godot-physics-sandbox",
      slug: "godot-physics-sandbox",
      title: "Physics Sandbox",
      status: "playable",
      publicStatus: "live",
      genre: "Sandbox",
      platform: "Browser · Multiplayer",
      tech: ["Godot 4", "GDScript", "WebRTC", "WebGL", "Multiplayer"],
      shortSummary: "A multiplayer 3D physics sandbox with prop spawning, grapple hooks, and live sessions over WebRTC.",
      detailSummary:
        "Physics Sandbox is the most fully-featured project in this set. It runs in the browser via a Godot 4 web export and supports live multiplayer sessions over WebRTC. Features include physics grabbing, a grapple tool, prop spawning, and a quality preset system tuned for browser performance.",
      controls: ["WASD + mouse look", "Physics grab and throw", "Grapple hook on right click", "Prop spawn from sidebar", "Multiplayer join from session UI"],
      visualTheme: {
        accent: "#a8ee72",
        accentAlt: "#ffde6e",
        glow: "rgba(168, 238, 114, 0.28)",
        base: "#0a1208",
      },
      featured: true,
      sortOrder: 0,
      year: 2026,
      q: "Q1",
      cover: "./covers/godot-physics-sandbox.svg",
      publicPath: "https://play.sw0l1ylab.com",
      repoUrl: "https://github.com/Sw0l1y/godot-physics-sandbox",
      actions: [
        { label: "Play", href: "https://play.sw0l1ylab.com", kind: "primary" },
        { label: "GitHub", href: "https://github.com/Sw0l1y/godot-physics-sandbox", kind: "secondary" },
      ],
    },
    {
      id: "momentum-trial",
      slug: "momentum-trial",
      title: "Momentum Trial",
      status: "playable",
      publicStatus: "live",
      genre: "Platformer",
      platform: "Browser",
      tech: ["Single-file HTML", "Canvas", "JSON Level Loader", "Local Save Data"],
      shortSummary: "A browser-first movement trial built around speed tech, checkpoints, and authored levels.",
      detailSummary:
        "Momentum Trial is the cleanest expression of the movement-first direction in this workspace. It focuses on acceleration, slide carry, jump forgiveness, checkpoints, imported levels, and speedrun loops without relying on art-heavy assets.",
      controls: ["Move: A / D or Arrow Keys", "Jump: Space / W / Up", "Restart run: R", "Menu and browser import prompts as needed"],
      visualTheme: {
        accent: "#7df6ef",
        accentAlt: "#ffd47d",
        glow: "rgba(125, 246, 239, 0.34)",
        base: "#091522",
      },
      featured: false,
      sortOrder: 1,
      year: 2025,
      q: "Q4",
      cover: "./covers/momentum-trial.svg",
      repoUrl: "https://github.com/Sw0l1y/momentum-trial",
      actions: [
        { label: "Play", href: "/games/momentum-trial/", kind: "primary" },
      ],
    },
    {
      id: "dash",
      slug: "dash",
      title: "Dash",
      status: "playable",
      publicStatus: "live",
      genre: "Action",
      platform: "Browser",
      tech: ["Single-file HTML", "Canvas", "Vanilla JavaScript"],
      shortSummary: "Top-down combat built around dash bursts, slash timing, and escalating arena rounds.",
      detailSummary:
        "Dash is a compact combat prototype with boss pacing, cooldown-driven mobility, and a high-contrast neon arena presentation. It reads like a concentrated systems test for movement, timing, and enemy pressure.",
      controls: ["Move: WASD or Arrow Keys", "Dash: Shift", "Attack / Slash: Space", "Start and restart from in-game prompts"],
      visualTheme: {
        accent: "#74d2ff",
        accentAlt: "#ff789f",
        glow: "rgba(116, 210, 255, 0.32)",
        base: "#07111c",
      },
      featured: false,
      sortOrder: 2,
      year: 2025,
      q: "Q3",
      cover: "./covers/dash.svg",
      repoUrl: "https://github.com/Sw0l1y/dash",
      actions: [
        { label: "Play", href: "/games/dash/", kind: "primary" },
      ],
    },
    {
      id: "dungeon-surge",
      slug: "dungeon-surge",
      title: "Dungeon Surge",
      status: "playable",
      publicStatus: "live",
      genre: "Survivor",
      platform: "Browser",
      tech: ["React", "Vite", "JSX", "Canvas", "Top-down Combat Systems"],
      shortSummary: "A top-down survival arena with weapon upgrade trees, XP curves, enemy waves, and loot drops.",
      detailSummary:
        "Dungeon Surge is a feature-complete browser roguelike. It has three weapon types — Sword, Bow, and Orbital — each with five upgrade tiers, an XP and leveling system, multiple enemy types, loot drops, crates, and a full death and upgrade screen loop.",
      controls: ["Move: WASD", "The rest is point-and-click upgrade menus and automatic combat"],
      visualTheme: {
        accent: "#a0f0ff",
        accentAlt: "#ff6600",
        glow: "rgba(160, 240, 255, 0.24)",
        base: "#112017",
      },
      featured: false,
      sortOrder: 3,
      year: 2025,
      q: "Q3",
      cover: "./covers/dungeon-surge.svg",
      repoUrl: "https://github.com/Sw0l1y/dungeon-surge",
      actions: [
        { label: "Play", href: "/games/dungeon-surge/", kind: "primary" },
      ],
    },
    {
      id: "clicker-game",
      slug: "clicker-game",
      title: "Clicker Game",
      status: "playable",
      publicStatus: "live",
      genre: "Idle",
      platform: "Browser",
      tech: ["Single-file HTML", "Vanilla JavaScript", "Save Export / Import"],
      shortSummary: "An effects-heavy incremental game with prestige systems, upgrade loops, and big visual bursts.",
      detailSummary:
        "Clicker Game is the most UI-dense project in the set. It mixes upgrade pacing, achievement tracking, prestige resets, and strong screen-space effects to make an otherwise simple input loop feel loud and alive.",
      controls: ["Mouse / touch clicking", "Sidebar and menu navigation", "Save import/export panels inside the game"],
      visualTheme: {
        accent: "#b8d6ff",
        accentAlt: "#7ca7ff",
        glow: "rgba(184, 214, 255, 0.24)",
        base: "#000000",
      },
      featured: false,
      sortOrder: 4,
      year: 2024,
      q: "Q4",
      cover: "./covers/clicker-game.svg",
      repoUrl: "https://github.com/Sw0l1y/clicker-game",
      publicPath: "/games/clicker-game/",
      actions: [
        { label: "Play", href: "/games/clicker-game/", kind: "primary" },
        { label: "Dev Notes", href: "https://github.com/Sw0l1y/clicker-game/blob/main/progress.md", kind: "secondary" },
        { label: "Files", href: "https://github.com/Sw0l1y/clicker-game", kind: "secondary" },
      ],
    },
    {
      id: "orbital-mechanics-sim",
      slug: "orbital-mechanics-sim",
      title: "Orbital Mechanics Sim",
      status: "prototype",
      publicStatus: "live",
      genre: "Simulation",
      platform: "Browser",
      tech: ["TypeScript", "Vite", "Simulation Logic", "Static Dist Build"],
      shortSummary: "A newer simulation track with TypeScript structure and a bundled browser build.",
      detailSummary:
        "Orbital Mechanics Sim represents a more structured stack than the single-file experiments. It belongs in the hub as a prototype because it shows a shift toward stronger architecture and simulation-focused thinking, even though the current project is still early.",
      controls: ["Current controls depend on the active build", "Use preview build or inspect source files"],
      visualTheme: {
        accent: "#ff916d",
        accentAlt: "#7be0dd",
        glow: "rgba(255, 145, 109, 0.24)",
        base: "#07111b",
      },
      featured: false,
      sortOrder: 5,
      year: 2025,
      q: "Q2",
      cover: "./covers/orbital-mechanics-sim.svg",
      actions: [
        { label: "Play", href: "/games/orbital-mechanics-sim/", kind: "primary" },
      ],
    },
    {
      id: "momentum-trial-editor",
      slug: "momentum-trial-editor",
      title: "Momentum Trial Editor",
      status: "playable",
      publicStatus: "live",
      genre: "Editor",
      platform: "Browser Tool",
      tech: ["Single-file HTML", "Drag and Drop Editor", ".level Export", "Level Import"],
      shortSummary: "A companion editor for building and exporting levels into the Momentum Trial runtime.",
      detailSummary:
        "This tool is a practical part of the portfolio because it shows systems thinking beyond a player loop. It supports layout authoring, export/import, zoom, tool shortcuts, and level-shaping ergonomics tied to the runner prototype.",
      controls: ["Mouse drag and drop", "Number keys 1-8 for tools", "Zoom controls and sidebar editing"],
      visualTheme: {
        accent: "#73e5f6",
        accentAlt: "#ffe693",
        glow: "rgba(115, 229, 246, 0.28)",
        base: "#08111a",
      },
      featured: false,
      sortOrder: 6,
      year: 2025,
      q: "Q4",
      cover: "./covers/momentum-trial-editor.svg",
      repoUrl: "https://github.com/Sw0l1y/momentum-trial",
      actions: [
        { label: "Open Tool", href: "/games/momentum-trial-editor/", kind: "primary" },
      ],
    },
    {
      id: "subway-surfer-draft",
      slug: "subway-surfer-3d-draft",
      title: "Subway Surfer 3D Draft",
      status: "abandoned",
      publicStatus: "placeholder",
      genre: "Runner",
      platform: "Browser",
      tech: ["Single-file HTML", "Canvas", "Vanilla JavaScript"],
      shortSummary: "A 3D runner draft with dodge lanes, HUD overlays, and rough arcade energy.",
      detailSummary:
        "This draft leans into forward motion and recognizable runner structure while keeping the implementation lightweight. It is useful as a snapshot of style experimentation and quick loop prototyping.",
      controls: ["Move lanes: A / D or Left / Right", "Jump / duck from in-game prompts", "Restart with overlay controls"],
      visualTheme: {
        accent: "#6adaff",
        accentAlt: "#ffe07b",
        glow: "rgba(106, 218, 255, 0.28)",
        base: "#0f1821",
      },
      featured: false,
      sortOrder: 7,
      year: 2024,
      q: "Q2",
      cover: "./covers/subway-surfer-3d-draft.svg",
      actions: [
        { label: "Play", href: "/Nathan games that he made/subway surfer/index.html", kind: "primary" },
        { label: "Files", href: "/Nathan games that he made/subway surfer/", kind: "secondary" },
      ],
    },
    {
      id: "traversal-lab-3d",
      slug: "traversal-lab-3d",
      title: "Traversal Lab 3D",
      status: "abandoned",
      publicStatus: "placeholder",
      genre: "Traversal",
      platform: "Browser",
      tech: ["Single-file HTML", "Canvas", "Vanilla JavaScript", "HUD Overlay"],
      shortSummary: "A free-movement sandbox built to explore spatial traversal, camera feel, and readable HUD design.",
      detailSummary:
        "Traversal Lab 3D is closer to a movement toy than a content-heavy game. Its value is in how quickly it surfaces feel questions: movement readability, scene legibility, and how the overlay supports navigation.",
      controls: ["Move and camera controls from on-screen legend", "Mouse / keyboard exploration", "Experiment-focused free movement"],
      visualTheme: {
        accent: "#7ce6d0",
        accentAlt: "#cbd9e8",
        glow: "rgba(124, 230, 208, 0.26)",
        base: "#0d141d",
      },
      featured: false,
      sortOrder: 8,
      year: 2024,
      q: "Q1",
      cover: "./covers/traversal-lab-3d.svg",
      actions: [
        { label: "Play", href: "/Nathan games that he made/free movement sandbox/index.html", kind: "primary" },
        { label: "Files", href: "/Nathan games that he made/free movement sandbox/", kind: "secondary" },
      ],
    },
  ];

  window.PORTFOLIO_CATALOG = Object.freeze(projects);
})();
