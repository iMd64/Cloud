/**
 * SEN421 Cloud Architecture and Services — Modular Navigation & Outline Engine (nav.js)
 * Standardized under the ca-html-notes skill.
 * 
 * Features:
 *  1. Far-Left Docked Collapsible Sidebar:
 *     - Positioned on the far far left (fixed to screen edge).
 *     - Closes all the way on desktop (translateX -100%) with 0px body padding shift.
 *     - Layout shift: reading container smoothly centers/expands when collapsed.
 *     - State memory in localStorage ('ca_sidebar_collapsed').
 *     - Smooth cubic-bezier transitions for both sidebar and body padding.
 *  2. Desktop Open Floating Trigger (Top-Left):
 *     - Floating pill [ ☰ MENU ] when closed, keyboard shortcut (Ctrl+B or [).
 *     - Header smoothly pads left when closed to prevent any overlap.
 *  3. Mobile Responsive Off-Canvas Drawer (< 1024px):
 *     - Slide-over drawer with blurred backdrop overlay.
 *     - Top-right hamburger trigger button.
 *     - Auto-dismisses on link navigation or outside tap.
 *  4. Centralized Course Modules Directory Hub:
 *     - Auto-detects current active module from URL/filename.
 *     - One-click navigation across Modules 1 through 7.
 *  5. Dynamic In-Page Outline (TOC) with Real-Time ScrollSpy:
 *     - Scans sections (#overview, #part-1..#part-N, #wrapup) and renders jump links.
 *     - IntersectionObserver highlights active section as the student scrolls.
 *  6. Fast Exam Cheat Box Container:
 *     - Displays high-yield formulas, reserved IP subtractions, and quick specs.
 *  7. Synchronized Dark / Light Study Mode Controller:
 *     - Seamlessly syncs with html.dark and localStorage.
 */

(function () {
  'use strict';

  // Prevent duplicate execution
  if (document.getElementById('ca-nav-root')) return;

  // Course Modules Configuration
  const CA_MODULES = [
    {
      num: 'M1-2',
      badge: 'M1 & 2',
      title: 'Cloud Computing & Virtual Hardware',
      sub: 'Modules 1 & 2 · 53 Slides',
      file: 'sen421_module_1_2_exam_study_notes.html'
    },
    {
      num: 'M3',
      badge: 'M3',
      title: 'Migration to the Cloud',
      sub: 'Module 3 · 37 Slides',
      file: 'sen421_module_3_exam_study_notes.html'
    },
    {
      num: 'M4',
      badge: 'M4',
      title: 'Cloud Networking',
      sub: 'Module 4 · 34 Slides',
      file: 'sen421_module_4_exam_study_notes.html'
    },
    {
      num: 'M5',
      badge: 'M5',
      title: 'Cloud Connectivity & Troubleshooting',
      sub: 'Module 5 · 42 Slides',
      file: 'sen421_module_5_exam_study_notes.html'
    },
    {
      num: 'M6',
      badge: 'M6',
      title: 'Securing Cloud Resources',
      sub: 'Module 6 · 38 Slides',
      file: 'sen421_module_6_exam_study_notes.html'
    },
    {
      num: 'M7',
      badge: 'M7',
      title: 'Identity and Access Management',
      sub: 'Module 7 · 37 Slides',
      file: 'sen421_module_7_exam_study_notes.html'
    }
  ];

  // Helper: detect current active module
  function getCurrentModuleIndex() {
    const path = window.location.pathname.toLowerCase();
    // Portal / Index Detection
    if (path.endsWith('/index.html') || path.endsWith('/') || path.includes('index') || path.endsWith('/ca')) {
      return -1;
    }

    for (let i = 0; i < CA_MODULES.length; i++) {
      if (path.includes(CA_MODULES[i].file.toLowerCase())) {
        return i;
      }
    }
    // Fallback checks (supporting both module and week naming)
    if (path.includes('module_1') || path.includes('module_1_2') || path.includes('week_1') || path.includes('week_1_2')) return 0;
    if (path.includes('module_3') || path.includes('week_3')) return 1;
    if (path.includes('module_4') || path.includes('week_4')) return 2;
    if (path.includes('module_5') || path.includes('week_5')) return 3;
    if (path.includes('module_6') || path.includes('week_6')) return 4;
    if (path.includes('module_7') || path.includes('week_7')) return 5;
    return -1; // Default to portal index
  }

  const activeModuleIdx = getCurrentModuleIndex();
  const isPortal = activeModuleIdx === -1;
  const currentModuleObj = isPortal
    ? { badge: 'PORTAL', slides: '241 Slides', title: 'Master Study Portal', file: 'index.html', sub: 'Course Syllabus & Hub' }
    : CA_MODULES[activeModuleIdx];

  // State: is desktop sidebar collapsed
  const isDesktop = () => window.innerWidth >= 1024;
  let isCollapsed = localStorage.getItem('ca_sidebar_collapsed') === 'true';

  // Inject CSS Styles for Sidebar & Layout
  const styleEl = document.createElement('style');
  styleEl.id = 'ca-nav-styles';
  styleEl.textContent = `
    :root {
      --ca-sidebar-w: 280px;
    }

    body {
      transition: padding-left 0.28s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    /* Desktop layout shifting */
    @media (min-width: 1024px) {
      body.ca-sidebar-open {
        padding-left: var(--ca-sidebar-w) !important;
      }
      body.ca-sidebar-closed {
        padding-left: 0 !important;
      }
      body.ca-sidebar-closed header.sticky {
        padding-left: 92px !important;
        transition: padding-left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      }
      body.ca-sidebar-open header.sticky {
        padding-left: 0 !important;
        transition: padding-left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      }
      /* Expand main content container when aside is removed */
      main {
        width: 100% !important;
      }
    }

    /* Fixed Left Sidebar Container (Docked on Far Left) */
    #ca-sidebar {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 60;
      width: var(--ca-sidebar-w);
      background-color: #fcfbf7;
      border-right: 1px solid #cbd5e1;
      box-shadow: 4px 0 24px -4px rgba(15, 23, 42, 0.08);
      display: flex;
      flex-direction: column;
      transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease, border-color 0.2s ease;
      overflow: hidden;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .dark #ca-sidebar {
      background-color: #090d16;
      border-right-color: #1e293b;
      box-shadow: 4px 0 24px -4px rgba(0, 0, 0, 0.5);
    }

    /* Mobile off-canvas (< 1024px) */
    @media (max-width: 1023px) {
      #ca-sidebar {
        width: min(320px, 86vw) !important;
        transform: translateX(-100%);
        box-shadow: 8px 0 32px rgba(0,0,0,0.25);
      }
      #ca-sidebar.mobile-open {
        transform: translateX(0);
      }
    }

    /* Desktop states (>= 1024px) */
    @media (min-width: 1024px) {
      #ca-sidebar.desktop-open {
        transform: translateX(0);
      }
      #ca-sidebar.desktop-closed {
        transform: translateX(-100%);
      }
    }

    /* Desktop Open Trigger (Floating on Top-Left) */
    #ca-desktop-trigger {
      position: fixed;
      top: 10px;
      left: 14px;
      z-index: 55;
      background-color: #ffffff;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
      cursor: pointer;
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-weight: 700;
      font-size: 0.75rem;
      letter-spacing: 0.02em;
      transition: opacity 0.22s ease, transform 0.22s ease, background-color 0.15s ease;
    }
    .dark #ca-desktop-trigger {
      background-color: #0f172a;
      color: #f8fafc;
      border-color: #334155;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
    }
    #ca-desktop-trigger:hover {
      background-color: #f1f5f9;
    }
    .dark #ca-desktop-trigger:hover {
      background-color: #1e293b;
    }
    @media (max-width: 1023px) {
      #ca-desktop-trigger {
        display: none !important;
      }
    }
    @media (min-width: 1024px) {
      body.ca-sidebar-open #ca-desktop-trigger {
        opacity: 0;
        pointer-events: none;
        transform: translateX(-16px);
      }
      body.ca-sidebar-closed #ca-desktop-trigger {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(0);
      }
    }

    /* Mobile Menu Trigger (Top-Right Hamburger) */
    #ca-mobile-trigger {
      position: fixed;
      top: 10px;
      right: 12px;
      z-index: 70;
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background-color: #ffffff;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .dark #ca-mobile-trigger {
      background-color: #0f172a;
      color: #f8fafc;
      border-color: #334155;
    }
    @media (min-width: 1024px) {
      #ca-mobile-trigger {
        display: none !important;
      }
    }
    @media (max-width: 1023px) {
      header.sticky {
        padding-right: 56px !important;
      }
    }

    /* Mobile Backdrop Overlay */
    #ca-backdrop {
      position: fixed;
      inset: 0;
      z-index: 59;
      background-color: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(3px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
    #ca-backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }

    /* Scroll Area Styling */
    .ca-nav-scroll::-webkit-scrollbar {
      width: 6px;
    }
    .ca-nav-scroll::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    .dark .ca-nav-scroll::-webkit-scrollbar-thumb {
      background: #334155;
    }

    /* In-Page Outline Jump Links Active State */
    .ca-toc-link.active {
      background-color: rgba(51, 65, 85, 0.12);
      color: #0f172a;
      font-weight: 700;
      border-left: 3px solid #334155;
    }
    .dark .ca-toc-link.active {
      background-color: rgba(56, 189, 248, 0.12);
      color: #38bdf8;
      border-left-color: #38bdf8;
    }
  `;
  document.head.appendChild(styleEl);

  // Build the Navigation DOM
  const rootDiv = document.createElement('div');
  rootDiv.id = 'ca-nav-root';

  rootDiv.innerHTML = `
    <!-- Mobile Backdrop -->
    <div id="ca-backdrop"></div>

    <!-- Desktop Open Trigger -->
    <button id="ca-desktop-trigger" title="Open Sidebar [Ctrl+B]">
      <span class="font-mono text-xs">☰</span>
      <span>OUTLINE</span>
    </button>

    <!-- Mobile Menu Trigger -->
    <button id="ca-mobile-trigger" title="Toggle Navigation Drawer">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    </button>

    <!-- Fixed Far-Left Sidebar -->
    <aside id="ca-sidebar" class="${isCollapsed ? 'desktop-closed' : 'desktop-open'}" aria-label="Course Navigation">
      <!-- Sidebar Header -->
      <div class="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
        <div class="flex items-center gap-2 min-w-0">
          <span class="px-2 py-0.5 rounded bg-slate-700 text-white font-mono text-xs font-bold tracking-wider">SEN421</span>
          <div class="min-w-0">
            <div class="font-display font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">Cloud Architecture</div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">IAU · Dr. Hazm Talab</div>
          </div>
        </div>
        <button id="ca-close-btn" class="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition shrink-0" title="Collapse Sidebar [Ctrl+B]">
          <span class="text-xs font-bold">◀</span>
        </button>
      </div>

      <!-- Navigation Tabs / Switcher -->
      <div class="flex border-b border-slate-200 dark:border-slate-800 text-xs font-display font-semibold shrink-0">
        <button id="ca-tab-outline" class="flex-1 py-2 text-center border-b-2 border-slate-700 dark:border-sky-400 text-slate-900 dark:text-white transition">
          📑 Outline
        </button>
        <button id="ca-tab-modules" class="flex-1 py-2 text-center border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition">
          📁 Modules (${CA_MODULES.length})
        </button>
      </div>

      <!-- Scrollable Content Area -->
      <div class="ca-nav-scroll flex-1 overflow-y-auto p-3 space-y-4">

        <!-- TAB 1: ACTIVE MODULE OUTLINE (TOC) -->
        <div id="ca-view-outline" class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">${currentModuleObj.badge} Topics</span>
            <span class="font-mono text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800">${currentModuleObj.slides}</span>
          </div>
          <ul id="ca-toc-list" class="space-y-1 text-xs">
            <!-- Populated dynamically via DOM scan -->
          </ul>

          <!-- Cheat Box Mount Point -->
          <div id="ca-cheat-mount" class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        <!-- TAB 2: COURSE MODULES DIRECTORY -->
        <div id="ca-view-modules" class="space-y-1.5 hidden">
          <div class="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">Course Modules Hub</div>
          <a href="index.html" class="block p-2 rounded-lg border transition ${
            isPortal
              ? 'bg-slate-200/90 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold'
              : 'bg-white dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
          }">
            <div class="flex items-center justify-between gap-1 mb-0.5">
              <span class="font-mono text-[11px] px-1.5 py-0.2 rounded ${
                isPortal ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }">PORTAL</span>
              <span class="font-mono text-[10px] text-slate-400">All Modules</span>
            </div>
            <div class="text-xs truncate font-display font-bold">🏠 Master Study Portal</div>
            <div class="text-[10px] text-slate-400 truncate">Course Syllabus &amp; Overview</div>
          </a>

          ${CA_MODULES.map((m, idx) => {
            const isActive = idx === activeModuleIdx;
            return `
              <a href="${m.file}" class="block p-2 rounded-lg border transition ${
                isActive
                  ? 'bg-slate-200/90 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }">
                <div class="flex items-center justify-between gap-1 mb-0.5">
                  <span class="font-mono text-[11px] px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }">${m.badge}</span>
                  <span class="font-mono text-[10px] text-slate-400">${m.slides}</span>
                </div>
                <div class="text-xs truncate font-display">${m.title}</div>
                <div class="text-[10px] text-slate-400 truncate">${m.sub}</div>
              </a>
            `;
          }).join('')}
        </div>

      </div>

      <!-- Sidebar Footer -->
      <div class="p-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
        <button id="ca-side-theme-toggle" class="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-medium transition" title="Toggle Light/Dark Theme (or press T)">
          <span>🌗 Mode</span>
        </button>
        <span class="font-mono text-[10px] text-slate-400">Ctrl+B</span>
      </div>
    </aside>
  `;

  document.body.appendChild(rootDiv);

  // Update body class based on stored desktop collapse state
  if (isDesktop()) {
    if (isCollapsed) {
      document.body.classList.add('ca-sidebar-closed');
      document.body.classList.remove('ca-sidebar-open');
    } else {
      document.body.classList.add('ca-sidebar-open');
      document.body.classList.remove('ca-sidebar-closed');
    }
  }

  // DOM Elements
  const sidebar = document.getElementById('ca-sidebar');
  const backdrop = document.getElementById('ca-backdrop');
  const desktopTrigger = document.getElementById('ca-desktop-trigger');
  const mobileTrigger = document.getElementById('ca-mobile-trigger');
  const closeBtn = document.getElementById('ca-close-btn');
  const sideThemeToggle = document.getElementById('ca-side-theme-toggle');

  const tabOutline = document.getElementById('ca-tab-outline');
  const tabModules = document.getElementById('ca-tab-modules') || document.getElementById('ca-tab-weeks');
  const viewOutline = document.getElementById('ca-view-outline');
  const viewModules = document.getElementById('ca-view-modules') || document.getElementById('ca-view-weeks');
  const tocList = document.getElementById('ca-toc-list');
  const cheatMount = document.getElementById('ca-cheat-mount');

  // Tab Switching
  tabOutline.addEventListener('click', () => {
    tabOutline.className = 'flex-1 py-2 text-center border-b-2 border-slate-700 dark:border-sky-400 text-slate-900 dark:text-white transition';
    if (tabModules) tabModules.className = 'flex-1 py-2 text-center border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition';
    viewOutline.classList.remove('hidden');
    if (viewModules) viewModules.classList.add('hidden');
  });

  if (tabModules) {
    tabModules.addEventListener('click', () => {
      tabModules.className = 'flex-1 py-2 text-center border-b-2 border-slate-700 dark:border-sky-400 text-slate-900 dark:text-white transition';
      tabOutline.className = 'flex-1 py-2 text-center border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition';
      if (viewModules) viewModules.classList.remove('hidden');
      viewOutline.classList.add('hidden');
    });
  }

  // Toggle Sidebar Function
  function toggleSidebar(forceState) {
    if (isDesktop()) {
      if (typeof forceState === 'boolean') {
        isCollapsed = !forceState;
      } else {
        isCollapsed = !isCollapsed;
      }
      localStorage.setItem('ca_sidebar_collapsed', isCollapsed);

      if (isCollapsed) {
        sidebar.classList.add('desktop-closed');
        sidebar.classList.remove('desktop-open');
        document.body.classList.add('ca-sidebar-closed');
        document.body.classList.remove('ca-sidebar-open');
      } else {
        sidebar.classList.add('desktop-open');
        sidebar.classList.remove('desktop-closed');
        document.body.classList.add('ca-sidebar-open');
        document.body.classList.remove('ca-sidebar-closed');
      }
    } else {
      // Mobile Drawer Toggle
      const isOpen = sidebar.classList.contains('mobile-open');
      const nextOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
      if (nextOpen) {
        sidebar.classList.add('mobile-open');
        backdrop.classList.add('open');
      } else {
        sidebar.classList.remove('mobile-open');
        backdrop.classList.remove('open');
      }
    }
  }

  // Event Listeners
  desktopTrigger.addEventListener('click', () => toggleSidebar(true));
  closeBtn.addEventListener('click', () => toggleSidebar(false));
  mobileTrigger.addEventListener('click', () => toggleSidebar());
  backdrop.addEventListener('click', () => toggleSidebar(false));

  // ========================================================
  // 7. UNIVERSAL THEME CONTROLLER & PERSISTENCE (ca_theme)
  // ========================================================
  function updateThemeUI(isDark) {
    const btns = [
      document.getElementById('themeToggle'),
      document.getElementById('ca-side-theme-toggle')
    ];
    btns.forEach((btn) => {
      if (!btn) return;
      btn.innerHTML = isDark ? '☀️ Light' : '🌙 Dark';
      btn.title = isDark
        ? 'Switch to Paper Light Study Mode (or press T)'
        : 'Switch to Dark Study Mode (or press T)';
    });
  }

  function setCaTheme(isDark) {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('ca_theme', isDark ? 'dark' : 'light');
    } catch (_) {}
    updateThemeUI(isDark);
  }

  window.toggleCaTheme = function () {
    const isDark = !document.documentElement.classList.contains('dark');
    setCaTheme(isDark);
    return isDark;
  };

  // Synchronize initial UI state with the current active theme
  updateThemeUI(document.documentElement.classList.contains('dark'));

  // Attach to top header theme toggle button
  const headerThemeToggle = document.getElementById('themeToggle');
  if (headerThemeToggle) {
    headerThemeToggle.onclick = function (e) {
      if (e) e.preventDefault();
      window.toggleCaTheme();
    };
  }

  // Attach to sidebar drawer theme button
  if (sideThemeToggle) {
    sideThemeToggle.addEventListener('click', (e) => {
      if (e) e.preventDefault();
      window.toggleCaTheme();
    });
  }

  // Cross-tab real-time theme synchronization
  window.addEventListener('storage', (e) => {
    if (e.key === 'ca_theme') {
      const isDark = e.newValue === 'dark';
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      updateThemeUI(isDark);
    }
  });

  // Keyboard Shortcuts: Ctrl+B or [ for sidebar, Escape to close, T for theme
  window.addEventListener('keydown', (e) => {
    // Avoid triggering when user is typing in inputs or textareas
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    if ((e.ctrlKey && (e.key === 'b' || e.key === 'B')) || e.key === '[') {
      e.preventDefault();
      toggleSidebar();
    } else if (e.key === 'Escape') {
      toggleSidebar(false);
    } else if (e.key === 't' || e.key === 'T') {
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        window.toggleCaTheme();
      }
    }
  });

  // Extract In-Page Outline (TOC) and Cheat Box
  function extractPageOutline() {
    // 1. Scan for sections with IDs (#overview, #part-1..#part-N, #wrapup)
    const sections = Array.from(document.querySelectorAll('section[id], article[id]'));
    if (!sections.length) return;

    tocList.innerHTML = '';

    sections.forEach((sec) => {
      const id = sec.id;
      if (!id) return;

      // Title extraction
      let title = '';
      const h2 = sec.querySelector('h2');
      const h3 = sec.querySelector('h3');
      const partBadge = sec.querySelector('span[class*="PART"]');

      if (id === 'overview' || id === 'part-0') {
        title = '0. Course Title & Plan';
      } else if (h2) {
        title = h2.textContent.trim().replace(/^SEN421[^:]*:\s*/i, '');
        if (partBadge && !title.toUpperCase().startsWith('PART')) {
          const partText = partBadge.textContent.trim();
          title = `${partText}: ${title}`;
        }
      } else if (h3) {
        title = h3.textContent.trim();
      } else {
        title = id.replace(/-/g, ' ');
      }

      // Slide range extraction if present
      let slideRange = '';
      const rangeEl = sec.querySelector('span.text-slate-500, span.text-slate-400');
      if (rangeEl && rangeEl.textContent.includes('Slide')) {
        const match = rangeEl.textContent.match(/Slides?\s+[\d/–\s-]+/i);
        if (match) slideRange = match[0].replace(/Slides?\s+/i, '');
      }

      const li = document.createElement('li');
      li.innerHTML = `
        <a href="#${id}" class="ca-toc-link flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300" data-target="${id}">
          <span class="truncate pr-1">${title}</span>
          ${slideRange ? `<span class="font-mono text-[10px] text-slate-400 shrink-0">${slideRange}</span>` : ''}
        </a>
      `;

      // Close mobile drawer when an in-page link is clicked
      li.querySelector('a').addEventListener('click', () => {
        if (!isDesktop()) toggleSidebar(false);
      });

      tocList.appendChild(li);
    });

    // 2. Clone Cheat Box if present in the page
    const cheatSource = document.querySelector('aside .mt-4.pt-3, div.study-card .mt-4.pt-3');
    if (cheatSource && cheatMount) {
      const cloned = cheatSource.cloneNode(true);
      cloned.className = 'text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 p-2 rounded-lg bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800';
      cheatMount.appendChild(cloned);
    }

    // 3. Setup ScrollSpy via IntersectionObserver
    setupScrollSpy(sections);
  }

  function setupScrollSpy(sections) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            document.querySelectorAll('.ca-toc-link').forEach((link) => {
              if (link.getAttribute('data-target') === id) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
        });
      },
      {
        rootMargin: '-20% 0px -70% 0px'
      }
    );

    sections.forEach((sec) => observer.observe(sec));
  }

  // Hide any existing static in-grid asides to prevent duplication
  function cleanupExistingAsides() {
    const oldAsides = document.querySelectorAll('aside:not(#ca-sidebar)');
    oldAsides.forEach((aside) => {
      aside.style.setProperty('display', 'none', 'important');
    });
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      cleanupExistingAsides();
      extractPageOutline();
    });
  } else {
    cleanupExistingAsides();
    extractPageOutline();
  }

  // Handle window resizing
  window.addEventListener('resize', () => {
    if (isDesktop()) {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('open');
      if (isCollapsed) {
        sidebar.classList.add('desktop-closed');
        sidebar.classList.remove('desktop-open');
        document.body.classList.add('ca-sidebar-closed');
        document.body.classList.remove('ca-sidebar-open');
      } else {
        sidebar.classList.add('desktop-open');
        sidebar.classList.remove('desktop-closed');
        document.body.classList.add('ca-sidebar-open');
        document.body.classList.remove('ca-sidebar-closed');
      }
    } else {
      document.body.classList.remove('ca-sidebar-open');
      document.body.classList.remove('ca-sidebar-closed');
    }
  });

})();
