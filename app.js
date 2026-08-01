// ============================================================
// AI & Developer Dashboard — data-driven render + search/filter
// Data source: tools.json (single source of truth, no hardcoded HTML)
// ============================================================

const state = {
  data: null,
  query: "",
  pricing: "all", // 'all' | 'paid' | 'free'
};

async function loadData() {
  const res = await fetch("tools.json");
  if (!res.ok) throw new Error("Failed to load tools.json");
  return res.json();
}

function favicon(url) {
  try {
    const host = new URL(url).hostname;
    // DuckDuckGo's icon service: reliably returns 200 with a sensible
    // fallback icon instead of 404ing on domains it doesn't recognize
    // (unlike Google's newer faviconV2 backend).
    return `https://icons.duckduckgo.com/ip3/${host}.ico`;
  } catch {
    return "";
  }
}

function initialsAvatar(name) {
  const letter = (name.trim()[0] || "?").toUpperCase();
  // deterministic color per letter, so the same tool always gets the same color
  const hue = (letter.charCodeAt(0) * 37) % 360;
  return `<span class="tool-icon tool-icon--fallback" style="background:hsl(${hue} 55% 30%)">${letter}</span>`;
}

function matchesFilters(tool) {
  const q = state.query.trim().toLowerCase();
  const matchesQuery = !q || tool.name.toLowerCase().includes(q);
  const matchesPricing =
    state.pricing === "all" || tool.pricing === state.pricing;
  return matchesQuery && matchesPricing;
}

function toolCard(tool) {
  const badge = tool.pricing === "paid" ? "paid" : "free";
  const fallback = initialsAvatar(tool.name).replace(/"/g, "&quot;");
  return `
    <a class="tool" href="${tool.url}" target="_blank" rel="noopener noreferrer" data-id="${tool.id}">
      <img
        class="tool-icon"
        src="${favicon(tool.url)}"
        alt=""
        loading="lazy"
        width="20"
        height="20"
        onerror="this.outerHTML='${fallback}'"
      >
      <span class="tool-name">${tool.name}</span>
      <span class="tool-badge tool-badge--${badge}">${badge}</span>
    </a>`;
}

function renderNav(categories) {
  const nav = document.getElementById("category-nav");
  nav.innerHTML = categories
    .map(
      (c) =>
        `<a href="#cat-${slug(c.name)}" class="nav-chip">${c.icon} ${c.name}</a>`,
    )
    .join("");
}

function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function renderSections(categories) {
  const root = document.getElementById("sections-root");
  const emptyState = document.getElementById("empty-state");
  let visibleTotal = 0;
  let html = "";

  categories.forEach((cat) => {
    const visibleTools = cat.tools.filter(matchesFilters);
    if (visibleTools.length === 0) return;
    visibleTotal += visibleTools.length;

    const paid = visibleTools.filter((t) => t.pricing === "paid");
    const free = visibleTools.filter((t) => t.pricing === "free");

    html += `<section id="cat-${slug(cat.name)}">
      <h2>${cat.icon} ${cat.name}</h2>
      ${paid.length ? `<div class="tools"><p>Paid Tools</p>${paid.map(toolCard).join("")}</div>` : ""}
      ${free.length ? `<div class="tools"><p>Free Tools</p>${free.map(toolCard).join("")}</div>` : ""}
    </section>`;
  });

  root.innerHTML = html;
  emptyState.hidden = visibleTotal !== 0;

  const statsEl = document.getElementById("stats-count");
  const total = categories.reduce((n, c) => n + c.tools.length, 0);
  statsEl.textContent =
    state.query || state.pricing !== "all"
      ? `Showing ${visibleTotal} of ${total} tools`
      : `Total Tools Available: ${total}+`;
}

function render() {
  if (!state.data) return;
  renderSections(state.data.categories);
  observeActiveSection();
}

function attachControls() {
  const searchInput = document.getElementById("search-input");
  const filterButtons = document.querySelectorAll(".filter-btn");

  searchInput.addEventListener("input", (e) => {
    state.query = e.target.value;
    render();
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      state.pricing = btn.dataset.pricing;
      render();
    });
  });
}

let sectionObserver = null;

function observeActiveSection() {
  const chips = document.querySelectorAll(".nav-chip");
  if (!chips.length) return;

  if (sectionObserver) sectionObserver.disconnect();

  sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        chips.forEach((chip) => {
          chip.classList.toggle(
            "is-active",
            chip.getAttribute("href") === `#${id}`,
          );
        });
      });
    },
    { rootMargin: "-20% 0px -70% 0px" },
  );

  document
    .querySelectorAll("main > section")
    .forEach((sec) => sectionObserver.observe(sec));
}

(async function init() {
  const root = document.getElementById("sections-root");
  root.innerHTML = `<p class="loading-state">Loading tools…</p>`;
  try {
    state.data = await loadData();
    renderNav(state.data.categories);
    render();
    attachControls();
  } catch (err) {
    root.innerHTML = `<p class="error-state">Couldn't load tools.json — ${err.message}</p>`;
    console.error(err);
  }
})();
