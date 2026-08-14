const state = {
  data: null,
  query: "",
  pricing: "all",
  surveyIntent: null,
};

const SURVEY_CATEGORY_GROUPS = {
  build: [
    "Coding & Development",
    "Website & App Development",
    "Automation, Coding & Deployment",
    "Cloud Dev Platforms",
  ],

  write: [
    "Writing",
    "Deep Research",
    "Tutorial",
    "Learning Platforms",
    "Note Taking",
  ],

  create: [
    "AI Image Generation",
    "Creative & Design Tools",
    "AI Video Generation",
    "Audio-to-Formatted-Text",
    "AI Music & Audio Generation",
  ],

  run: [
    "Presentation",
    "Accounting & Finance",
    "Business, Client & Workflow (CRM)",
    "Social Media",
  ],
};

// Derived from SURVEY_CATEGORY_GROUPS itself (rather than a second,
// separately-maintained list) so the two can never drift out of sync —
// flattening build -> write -> create -> run keeps each survey theme's
// categories adjacent, matching the comment in survey.js.
const CATEGORY_ORDER = [
  ...SURVEY_CATEGORY_GROUPS.build,
  ...SURVEY_CATEGORY_GROUPS.write,
  ...SURVEY_CATEGORY_GROUPS.create,
  ...SURVEY_CATEGORY_GROUPS.run,
];

function orderCategories(categories) {
  const rank = new Map(CATEGORY_ORDER.map((name, i) => [name, i]));
  // Categories not listed above (e.g. a new one added to tools.json later)
  // keep appearing, just pushed to the end instead of disappearing.
  return [...categories].sort((a, b) => {
    const ra = rank.has(a.name) ? rank.get(a.name) : CATEGORY_ORDER.length;
    const rb = rank.has(b.name) ? rank.get(b.name) : CATEGORY_ORDER.length;
    return ra - rb;
  });
}

async function loadData() {
  if (typeof toolsDataPromise !== "undefined") return toolsDataPromise;
  const res = await fetch("tools.json");
  if (!res.ok) throw new Error("Failed to load tools.json");
  return res.json();
}

function favicon(url) {
  try {
    const host = new URL(url).hostname;
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
      ${free.length ? `<div class="tools"><p>Free Tools</p>${free.map(toolCard).join("")}</div>` : ""}
      ${paid.length ? `<div class="tools"><p>Paid Tools</p>${paid.map(toolCard).join("")}</div>` : ""}
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

  let categoriesToShow = state.data.categories;

  if (state.surveyIntent) {
    const allowedCategories = SURVEY_CATEGORY_GROUPS[state.surveyIntent] || [];

    categoriesToShow = state.data.categories.filter((category) =>
      allowedCategories.includes(category.name),
    );
  }

  renderSections(categoriesToShow);
  observeActiveSection();
}

window.applySurveyRecommendation = function (intentId, pricingId = "all") {
  state.surveyIntent = intentId;
  state.pricing = pricingId;

  document.querySelectorAll(".filter-btn").forEach((button) => {
    const active = button.dataset.pricing === pricingId;

    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  render();
};

function attachControls() {
  const searchInput = document.getElementById("search-input");
  const filterButtons = document.querySelectorAll(".filter-btn");

  searchInput.addEventListener("input", (e) => {
    state.query = e.target.value;
    render();
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
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
    state.data.categories = orderCategories(state.data.categories);
    renderNav(state.data.categories);
    render();
    attachControls();
  } catch (err) {
    root.innerHTML = `<p class="error-state">Couldn't load tools.json — ${err.message}</p>`;
    console.error(err);
  }
})();
