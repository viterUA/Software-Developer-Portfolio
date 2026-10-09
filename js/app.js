/* =========================================================================
   app.js — site behaviour: navigation + project card rendering.
   Project DATA lives in projects.js — this file only reads it and draws it.
   ========================================================================= */

(function () {
  "use strict";

  /* -----------------------------------------------------------------------
     Small DOM helper, used below to build project cards. (The interactive
     demos in projects.js have their own copy of a similar kit, exposed at
     window.PortfolioDemoKit — see the top of that file. It has to be
     self-contained there since projects.js loads before this file does.)
     ----------------------------------------------------------------------- */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "class") node.className = attrs[key];
        else if (key === "text") node.textContent = attrs[key];
        else if (key === "style") node.style.cssText = attrs[key];  // CSP-safe, see projects.js
        else if (key.indexOf("on") === 0 && typeof attrs[key] === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
        } else {
          node.setAttribute(key, attrs[key]);
        }
      });
    }
    (children || []).forEach(function (child) {
      if (child == null) return;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  /* -----------------------------------------------------------------------
     Footer year
     ----------------------------------------------------------------------- */
  const footerYear = document.getElementById("footerYear");
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  /* -----------------------------------------------------------------------
     Navigation: hamburger + dropdowns (works for mouse, touch, keyboard)
     ----------------------------------------------------------------------- */
  const navToggle = document.getElementById("navToggle");
  const siteNav = document.getElementById("primaryNav");

  function closeMobileNav() {
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      const isOpen = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const dropdownTriggers = document.querySelectorAll(".nav-dropdown-trigger");
  dropdownTriggers.forEach(function (trigger) {
    const submenu = document.getElementById(trigger.getAttribute("aria-controls"));
    trigger.addEventListener("click", function () {
      const isOpen = submenu.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", String(isOpen));
      // Close sibling dropdowns so only one submenu is open at a time
      dropdownTriggers.forEach(function (other) {
        if (other === trigger) return;
        const otherMenu = document.getElementById(other.getAttribute("aria-controls"));
        otherMenu.classList.remove("is-open");
        other.setAttribute("aria-expanded", "false");
      });
    });
  });

  // Clicking any real link in the nav (submenu items, CV, Diploma) closes the mobile nav
  document.querySelectorAll("#primaryNav a").forEach(function (link) {
    link.addEventListener("click", closeMobileNav);
  });

  // Close menus on outside click
  document.addEventListener("click", function (evt) {
    if (!siteNav.contains(evt.target) && !navToggle.contains(evt.target)) {
      closeMobileNav();
      dropdownTriggers.forEach(function (trigger) {
        document.getElementById(trigger.getAttribute("aria-controls")).classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      });
    }
  });

  // Close everything on Escape
  document.addEventListener("keydown", function (evt) {
    if (evt.key === "Escape") {
      closeMobileNav();
      dropdownTriggers.forEach(function (trigger) {
        document.getElementById(trigger.getAttribute("aria-controls")).classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      });
    }
  });

  // Reset mobile nav state when the viewport grows past the mobile breakpoint
  window.addEventListener("resize", function () {
    if (window.innerWidth > 760) closeMobileNav();
  });

  /* -----------------------------------------------------------------------
     Project rendering
     ----------------------------------------------------------------------- */
  function techPills(tech) {
    return el("div", { class: "tech-pills" }, (tech || []).map(function (t) {
      return el("span", { class: "tech-pill", text: t });
    }));
  }

  function codeSnippetBlock(project) {
    if (!project.codeSnippet) return null;
    const code = el("code", { text: project.codeSnippet });
    if (project.codeSnippetLang) code.className = "language-" + project.codeSnippetLang;
    return el("pre", { class: "code-snippet" }, [code]);
  }

  // Demos run fully sandboxed in an opaque origin by default, so nothing in
  // them (including third-party widgets such as the B&B page's Facebook and
  // Twitter embeds) can reach this page, its storage or the visitor's data.
  // A demo opts in with `sameOrigin: true` only if it needs storage and loads
  // no third-party code — the Millionaire game hands data between its pages
  // via localStorage, which throws in an opaque origin.
  function demoIframe(project, demo) {
    const sandbox = "allow-scripts allow-forms allow-popups allow-modals" + (demo.sameOrigin ? " allow-same-origin" : "");
    return el("iframe", {
      src: demo.src,
      title: project.title + " — live demo",
      sandbox: sandbox,
      referrerpolicy: "no-referrer"
    });
  }

  /* Full-screen viewer for iframe demos — a single shared <dialog>. A fresh
     iframe is loaded on open and removed on close, so a demo's timers (e.g.
     the quiz countdown) stop as soon as the viewer is closed. */
  let demoDialog = null;
  let demoDialogTitle = null;
  let demoDialogBody = null;

  function getDemoDialog() {
    if (demoDialog) return demoDialog;
    demoDialogTitle = el("h2", { class: "demo-dialog-title", id: "demoDialogTitle" });
    demoDialogBody = el("div", { class: "demo-dialog-body" });
    const closeBtn = el("button", {
      type: "button",
      class: "demo-dialog-close",
      "aria-label": "Close full-screen demo",
      onclick: function () { demoDialog.close(); }
    }, ["Close ", el("span", { "aria-hidden": "true", text: "✕" })]);

    demoDialog = el("dialog", { class: "demo-dialog", "aria-labelledby": "demoDialogTitle" }, [
      el("div", { class: "demo-dialog-bar" }, [demoDialogTitle, closeBtn]),
      demoDialogBody
    ]);
    demoDialog.addEventListener("close", function () {
      demoDialogBody.replaceChildren();
      document.documentElement.classList.remove("has-demo-dialog");
    });
    document.body.append(demoDialog);
    return demoDialog;
  }

  function openDemoFullscreen(project, demo) {
    if (typeof HTMLDialogElement !== "function") {
      window.open(demo.src, "_blank", "noopener");
      return;
    }
    const dialog = getDemoDialog();
    demoDialogTitle.textContent = project.title;
    demoDialogBody.replaceChildren(demoIframe(project, demo));
    document.documentElement.classList.add("has-demo-dialog");
    dialog.showModal();
  }

  function demoPanel(project) {
    const demo = project.demo;
    if (!demo) return null;

    const panel = el("div", { class: "demo-panel" });
    panel.append(el("span", { class: "demo-label", text: "Live Demo" }));
    if (demo.note) panel.append(el("p", { class: "demo-note", text: demo.note }));

    // iframe demos stay closed by default and only load in the full-screen viewer.
    if (demo.type === "iframe") {
      panel.append(el("button", {
        type: "button",
        class: "btn btn-outline btn-small demo-fullscreen-btn",
        "aria-label": "Open " + project.title + " demo full screen",
        onclick: function () { openDemoFullscreen(project, demo); }
      }, ["Full screen ", el("span", { "aria-hidden": "true", text: "▭" })]));
    } else if (demo.type === "custom" && typeof demo.render === "function") {
      const mount = el("div", { class: "demo-custom" });
      panel.append(mount);
      try {
        demo.render(mount);
      } catch (err) {
        mount.append(el("p", { text: "Demo failed to load: " + err.message }));
      }
    }
    return panel;
  }

  function linkButtons(project) {
    const wrap = el("div", { class: "project-card-links" });
    const links = project.links || {};
    if (links.live) {
      wrap.append(el("a", { class: "btn btn-outline btn-small", href: links.live, target: "_blank", rel: "noopener", text: "Live ↗" }));
    }
    if (links.repo) {
      wrap.append(el("a", { class: "btn btn-outline btn-small", href: links.repo, target: "_blank", rel: "noopener", text: "Code ↗" }));
    }
    (project.images || []).forEach(function (src, i) {
      wrap.append(el("a", { class: "btn btn-outline btn-small", href: src, target: "_blank", rel: "noopener", text: (project.images.length > 1 ? "Screenshot " + (i + 1) : "Screenshot") + " ↗" }));
    });
    return wrap.childNodes.length ? wrap : null;
  }

  function renderProjectCard(project) {
    const card = el("article", {
      class: "project-card" + (project.year === "diploma" ? " diploma-card" : ""),
      "data-project-id": project.id,
      "data-type": project.type
    });

    const head = el("div", { class: "project-card-head" }, [
      el("h4", { class: "project-card-title", text: project.title }),
      el("p", { class: "project-card-course", text: project.course })
    ]);
    card.append(head);

    const body = el("div", { class: "project-card-body" });
    body.append(el("p", { class: "project-card-desc", text: project.description }));
    if (project.images && project.images.length) {
      body.append(el("img", {
        src: project.images[0],
        alt: project.title + " screenshot",
        loading: "lazy",
        class: "project-card-img"
      }));
    }
    card.append(body);

    card.append(techPills(project.tech));

    const snippet = codeSnippetBlock(project);
    const demo = demoPanel(project);
    if (project.year === "diploma") {
      // The diploma card keeps its own two-column feature layout in both views.
      if (snippet) card.append(snippet);
      if (demo) card.append(demo);
    } else if (snippet || demo) {
      // Code + demo sit in an "extras" block: always shown in grid view,
      // folded behind the "Show …" button in list view (see styles.css).
      const extrasId = project.id + "-extras";
      const what = snippet && demo ? "code & demo" : (snippet ? "code" : "demo");
      const moreBtn = el("button", {
        type: "button",
        class: "project-card-more",
        "aria-expanded": "false",
        "aria-controls": extrasId,
        text: "Show " + what
      });
      moreBtn.addEventListener("click", function () {
        const expanded = card.classList.toggle("is-expanded");
        moreBtn.setAttribute("aria-expanded", String(expanded));
        moreBtn.textContent = (expanded ? "Hide " : "Show ") + what;
      });
      card.append(moreBtn, el("div", { class: "project-card-extras", id: extrasId }, [snippet, demo]));
    }

    const linksEl = linkButtons(project);
    if (linksEl) card.append(linksEl);

    return card;
  }

  function renderAll() {
    if (typeof PROJECTS === "undefined") return;

    const grids = document.querySelectorAll(".project-grid");
    grids.forEach(function (grid) {
      const year = grid.getAttribute("data-year");
      const semester = grid.getAttribute("data-semester");

      const matches = PROJECTS.filter(function (p) {
        const yearStr = String(p.year);
        if (yearStr !== year) return false;
        if (semester && String(p.semester) !== semester) return false;
        return true;
      });

      if (!matches.length) {
        grid.append(el("p", { class: "project-grid-empty", text: "No projects added for this section yet." }));
        return;
      }

      matches.forEach(function (project) {
        grid.append(renderProjectCard(project));
      });
    });
  }

  /* -----------------------------------------------------------------------
     Project filter / search — text search + top-tech chips, filtered live
     across every .project-grid on the page.
     ----------------------------------------------------------------------- */
  function initProjectFilter() {
    if (typeof PROJECTS === "undefined") return;

    const searchInput = document.getElementById("projectSearch");
    const chipsWrap = document.getElementById("filterChips");
    const countEl = document.getElementById("filterCount");
    if (!searchInput || !chipsWrap || !countEl) return;

    const projectsById = {};
    const techFrequency = {};
    PROJECTS.forEach(function (p) {
      projectsById[p.id] = p;
      (p.tech || []).forEach(function (t) { techFrequency[t] = (techFrequency[t] || 0) + 1; });
    });

    const topTech = Object.keys(techFrequency)
      .filter(function (t) { return techFrequency[t] > 1; })
      .sort(function (a, b) { return techFrequency[b] - techFrequency[a] || a.localeCompare(b); })
      .slice(0, 10);

    const activeChips = new Set();

    topTech.forEach(function (tech) {
      const chip = el("button", { type: "button", class: "filter-chip", text: tech });
      chip.addEventListener("click", function () {
        if (activeChips.has(tech)) { activeChips.delete(tech); chip.classList.remove("is-active"); }
        else { activeChips.add(tech); chip.classList.add("is-active"); }
        applyFilter();
      });
      chipsWrap.append(chip);
    });

    const allCards = Array.prototype.slice.call(document.querySelectorAll(".project-card"));
    const totalCount = allCards.length;

    function cardMatches(project, query) {
      if (activeChips.size && !(project.tech || []).some(function (t) { return activeChips.has(t); })) return false;
      if (!query) return true;
      const haystack = (project.title + " " + project.course + " " + project.description + " " + (project.tech || []).join(" ")).toLowerCase();
      return haystack.indexOf(query) !== -1;
    }

    function applyFilter() {
      const query = searchInput.value.trim().toLowerCase();
      let visibleCount = 0;
      const gridCounts = new Map();

      allCards.forEach(function (card) {
        const project = projectsById[card.getAttribute("data-project-id")];
        const grid = card.closest(".project-grid");
        const isMatch = project ? cardMatches(project, query) : true;
        card.classList.toggle("is-hidden", !isMatch);
        if (isMatch) visibleCount++;
        if (grid) gridCounts.set(grid, (gridCounts.get(grid) || 0) + (isMatch ? 1 : 0));
      });

      gridCounts.forEach(function (count, grid) {
        let emptyMsg = grid.querySelector(".project-grid-empty.is-filtered");
        if (count === 0) {
          if (!emptyMsg) {
            emptyMsg = el("p", { class: "project-grid-empty is-filtered", text: "No projects here match your filters." });
            grid.append(emptyMsg);
          }
        } else if (emptyMsg) {
          emptyMsg.remove();
        }
      });

      const hasFilter = Boolean(query) || activeChips.size > 0;
      countEl.textContent = hasFilter
        ? "Showing " + visibleCount + " of " + totalCount + " projects"
        : totalCount + " projects across 3 years + diploma";
    }

    searchInput.addEventListener("input", applyFilter);
    applyFilter();
  }

  /* -----------------------------------------------------------------------
     Grid / List layout toggle for the project sections. The choice is kept
     in localStorage so a returning visitor gets the layout they picked.
     ----------------------------------------------------------------------- */
  function initViewToggle() {
    const buttons = document.querySelectorAll(".view-toggle-btn");
    const filterBar = document.getElementById("projectFilterBar");
    if (!buttons.length) return;
    const STORAGE_KEY = "portfolio-project-view";

    // The first card visible under the sticky bars — used to keep the reader's
    // place when switching layout changes the height of everything above it.
    function anchorCard() {
      const barBottom = filterBar ? filterBar.getBoundingClientRect().bottom : 0;
      return Array.prototype.find.call(document.querySelectorAll(".project-card:not(.is-hidden)"), function (card) {
        return card.getBoundingClientRect().bottom > barBottom;
      });
    }

    function setView(view, keepPlace) {
      const anchor = keepPlace ? anchorCard() : null;
      const topBefore = anchor ? anchor.getBoundingClientRect().top : 0;
      document.documentElement.setAttribute("data-project-view", view);
      buttons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(btn.getAttribute("data-view") === view));
      });
      if (anchor) window.scrollBy({ top: anchor.getBoundingClientRect().top - topBefore, behavior: "instant" });
    }

    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* storage blocked — default to grid */ }
    setView(saved === "list" ? "list" : "grid", false);

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const view = btn.getAttribute("data-view");
        setView(view, true);
        try { localStorage.setItem(STORAGE_KEY, view); } catch (e) { /* not persisted, still switches */ }
      });
    });
  }

  /* -----------------------------------------------------------------------
     Scroll-spy: highlight the nav item for the section currently in view
     ----------------------------------------------------------------------- */
  function initScrollSpy() {
    if (typeof IntersectionObserver === "undefined") return;
    const sections = document.querySelectorAll(".page-section[id]");
    if (!sections.length) return;

    function navElementFor(id) {
      return document.querySelector('.nav-link[href="#' + id + '"]') ||
        document.querySelector('.nav-link[data-section="' + id + '"]');
    }

    const navLinks = document.querySelectorAll(".nav-link");

    function setActive(id) {
      navLinks.forEach(function (link) { link.classList.remove("is-active"); });
      const active = navElementFor(id);
      if (active) active.classList.add("is-active");
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* -----------------------------------------------------------------------
     Reveal project cards as they scroll into view (skipped entirely for
     users who asked for reduced motion — see prefers-reduced-motion below).
     ----------------------------------------------------------------------- */
  function initScrollReveal() {
    const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") return;

    const cards = document.querySelectorAll(".project-card");
    cards.forEach(function (card) { card.classList.add("reveal-init"); });

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("reveal-init");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

    cards.forEach(function (card) { observer.observe(card); });
  }

  /* -----------------------------------------------------------------------
     Back-to-top button
     ----------------------------------------------------------------------- */
  function initBackToTop() {
    const btn = document.getElementById("backToTop");
    if (!btn) return;
    window.addEventListener("scroll", function () {
      btn.classList.toggle("is-visible", window.scrollY > 600);
    });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  }

  renderAll();
  initProjectFilter();
  initViewToggle();
  initScrollSpy();
  initScrollReveal();
  initBackToTop();
})();
