(function () {
  const STORAGE_KEY = "ddb_survey_state_v1"; // { completed: bool } — permanent
  const SESSION_KEY = "ddb_survey_dismissed"; // this-tab-only, clears on new session
  const STYLE_ID = "survey-styles";

  /* ----------------------------------------------------------
     0. Icon set (inline SVG, stroke = currentColor).
     No emoji anywhere — every icon is a deliberate line-icon so
     it scales crisply and matches a single visual language.
     ---------------------------------------------------------- */
  const ICONS = {
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`,
    back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
    crosshair: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>`,
    code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 6 2 12 8 18"/><polyline points="16 6 22 12 16 18"/></svg>`,
    pencil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
    image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`,
    trending: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>`,
    unlock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
    card: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
    layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  };

  /* Accent colors pulled from the site's own palette (--primary,
     --secondary, --success, and the three accent-gradient stops)
     so every icon badge belongs to the existing brand, not a new
     ad-hoc one. */
  const ACCENT = {
    neutral: "154,164,184", // --text-secondary
    blue: "59,130,246", // --primary
    purple: "139,92,246", // --secondary
    pink: "255,47,209", // accent-gradient stop 1
    cyan: "56,189,248", // accent-gradient stop 3
    green: "52,211,153", // --success
  };

  function badge(iconKey, accentKey) {
    const rgb = ACCENT[accentKey];
    return `<span class="survey-icon-badge" style="color:rgb(${rgb});background:rgba(${rgb},0.14)">${ICONS[iconKey]}</span>`;
  }

  /* ----------------------------------------------------------
     1. Intent → category mapping
     The category list per intent lives in app.js's
     SURVEY_CATEGORY_GROUPS (see primaryCategorySlug below) — not
     duplicated here, so the two files can't drift apart.
     ---------------------------------------------------------- */
  const INTENTS = [
    {
      id: "build",
      icon: "code",
      accent: "blue",
      label: "Build & ship software",
      sub: "Coding, apps, deployment, cloud",
    },
    {
      id: "write",
      icon: "pencil",
      accent: "pink",
      label: "Write, research & learn",
      sub: "Writing, research, notes, tutorials",
    },
    {
      id: "create",
      icon: "image",
      accent: "purple",
      label: "Create images, video & design",
      sub: "Image, video, audio, creative design",
    },
    {
      id: "run",
      icon: "trending",
      accent: "cyan",
      label: "Run & grow my business",
      sub: "Presentations, finance, CRM, social",
    },
  ];

  const PRICING_OPTIONS = [
    { id: "free", icon: "unlock", accent: "green", label: "Free tools only" },
    {
      id: "paid",
      icon: "card",
      accent: "purple",
      label: "Paid tools are fine",
    },
    { id: "all", icon: "layers", accent: "blue", label: "Show me everything" },
  ];

  /* ----------------------------------------------------------
     2. State
     ---------------------------------------------------------- */
  let step = "intro"; // 'intro' | 'intent' | 'pricing'
  let chosenIntent = null;
  let modalEl = null;
  let lastFocused = null;

  function getStoredState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveStoredState(patch) {
    try {
      const next = { ...getStoredState(), ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* localStorage unavailable — fail silently, survey just re-shows */
    }
  }

  function wasDismissedThisSession() {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  }

  function markDismissedThisSession() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* sessionStorage unavailable — fail silently */
    }
  }

  /* ----------------------------------------------------------
     3. Styles — injected once, self-contained.
     ---------------------------------------------------------- */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
.survey-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:var(--space-4);background:rgba(4,6,10,.78);backdrop-filter:blur(8px);animation:survey-fade-in var(--dur-base) var(--ease-out) both;overflow-y:auto;box-sizing:border-box}
body.survey-open{overflow:hidden}
.survey-modal{position:relative;width:100%;max-width:460px;max-height:min(85vh,660px);overflow-y:auto;-webkit-overflow-scrolling:touch;box-sizing:border-box;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);box-shadow:0 24px 60px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.03) inset;padding:var(--space-6);animation:survey-pop-in var(--dur-slow) var(--ease-out) both;margin:auto}
.survey-modal::before{content:"";position:absolute;top:-1px;left:var(--space-6);right:var(--space-6);height:2px;background:linear-gradient(90deg,#ff2fd1,#a855f7,#38bdf8);border-radius:var(--radius-full);opacity:.9}

.survey-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.survey-progress{display:flex;gap:6px;flex:1;max-width:120px}
.survey-progress-seg{height:3px;flex:1;border-radius:var(--radius-full);background:var(--border-strong);overflow:hidden}
.survey-progress-seg::after{content:"";display:block;height:100%;width:0;background:var(--primary);border-radius:var(--radius-full);transition:width var(--dur-base) var(--ease-out)}
.survey-progress-seg.is-done::after{width:100%}
.survey-progress-seg.is-active::after{width:55%}

.survey-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:var(--radius-full);background:transparent;color:var(--text-tertiary);flex:none;transition:background var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out)}
.survey-iconbtn svg{width:16px;height:16px}
.survey-iconbtn:hover{background:var(--surface-hover);color:var(--text)}

.survey-eyebrow{display:inline-flex;align-items:center;gap:6px;margin:0 0 var(--space-3);padding:4px 10px 4px 8px;border-radius:var(--radius-full);background:var(--primary-tint);color:var(--primary);font-size:11px;font-weight:var(--fw-semibold);letter-spacing:.06em;text-transform:uppercase}
.survey-eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--primary)}

.survey-title{margin:0 0 var(--space-2);font-size:1.5rem;font-weight:var(--fw-bold);letter-spacing:-0.015em;line-height:1.2;color:var(--text)}
.survey-subtitle{margin:0 0 var(--space-6);color:var(--text-secondary);font-size:var(--fs-body);line-height:var(--lh-body)}

.survey-icon-badge{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:var(--radius-md);margin-bottom:var(--space-3)}
.survey-icon-badge svg{width:19px;height:19px}

.survey-options{display:grid;gap:var(--space-3)}
.survey-options--2col{grid-template-columns:repeat(2,1fr)}
.survey-options--1col{grid-template-columns:1fr}

.survey-option{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:var(--space-4);text-align:left;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-lg);transition:background var(--dur-base) var(--ease-out),border-color var(--dur-base) var(--ease-out),transform var(--dur-fast) var(--ease-out),box-shadow var(--dur-base) var(--ease-out);cursor:pointer}
.survey-option:hover,.survey-option:focus-visible{background:var(--surface-hover);border-color:var(--border-strong);transform:translateY(-2px);outline:none}
.survey-option:active{transform:translateY(0) scale(.99)}

.survey-option--primary{border-color:rgba(59,130,246,.35);background:linear-gradient(180deg,rgba(59,130,246,.08),var(--surface-2) 60%)}
.survey-option--primary:hover{border-color:var(--primary);box-shadow:0 8px 24px rgba(59,130,246,.16)}

.survey-badge-tag{position:absolute;top:var(--space-3);right:var(--space-3);padding:2px 8px;border-radius:var(--radius-full);background:var(--primary);color:var(--text-on-primary);font-size:10px;font-weight:var(--fw-semibold);letter-spacing:.03em;text-transform:uppercase}

.survey-option-label{font-size:15px;font-weight:var(--fw-semibold);color:var(--text);line-height:1.35}
.survey-option-sub{font-size:13px;color:var(--text-tertiary);line-height:1.4}

.survey-option--row{flex-direction:row;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4)}
.survey-option--row .survey-icon-badge{margin-bottom:0;flex:none}

.survey-footer{margin-top:20px;display:flex;justify-content:center}
.survey-skip{padding:8px 14px;border-radius:var(--radius-md);background:transparent;color:var(--text-tertiary);font-size:13px;font-weight:var(--fw-medium);transition:background var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out)}
.survey-skip:hover{background:var(--surface-2);color:var(--text-secondary)}

.survey-trigger{position:fixed;right:var(--space-6);bottom:calc(var(--space-6) + env(safe-area-inset-bottom,0px));z-index:900;display:inline-flex;align-items:center;gap:var(--space-2);height:44px;padding:0 var(--space-4);background:var(--surface);border:1px solid var(--border-strong);border-radius:var(--radius-full);color:var(--text);font-size:13px;font-weight:var(--fw-medium);box-shadow:var(--shadow-md);cursor:pointer;transition:transform var(--dur-fast) var(--ease-out),box-shadow var(--dur-base) var(--ease-out),background var(--dur-base) var(--ease-out);max-width:calc(100vw - var(--space-8))}
.survey-trigger svg{width:16px;height:16px;color:var(--primary);flex:none}
.survey-trigger:hover{background:var(--surface-hover);transform:translateY(-2px);box-shadow:var(--shadow-lg)}

@keyframes survey-fade-in{from{opacity:0}to{opacity:1}}
@keyframes survey-pop-in{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}

@media (max-width:640px){
  .survey-modal{padding:var(--space-4);max-height:min(88vh,640px)}
  .survey-options--2col{grid-template-columns:1fr}
  .survey-trigger span{display:none}
  .survey-trigger{width:44px;padding:0;justify-content:center;right:var(--space-4)}
  .survey-overlay{padding:var(--space-3)}
}
@media (max-width:380px){
  .survey-title{font-size:1.3rem}
  .survey-modal{padding:var(--space-4)}
}
@media (max-height:600px){
  .survey-modal{max-height:92vh}
  .survey-title{font-size:1.25rem;margin-bottom:4px}
  .survey-subtitle{margin-bottom:var(--space-4)}
  .survey-option{padding:var(--space-3)}
}
    `;
    document.head.appendChild(style);
  }

  /* ----------------------------------------------------------
     4. Rendering
     ---------------------------------------------------------- */
  function progressBar() {
    const steps = ["intro", "intent", "pricing"];
    const activeIdx = steps.indexOf(step);
    return `<div class="survey-progress" aria-hidden="true">
      ${steps
        .map((s, i) => {
          const cls =
            i < activeIdx ? "is-done" : i === activeIdx ? "is-active" : "";
          return `<span class="survey-progress-seg ${cls}"></span>`;
        })
        .join("")}
    </div>`;
  }

  function topbar(showBack, backAction) {
    return `<div class="survey-topbar">
      ${
        showBack
          ? `<button class="survey-iconbtn" data-action="${backAction}" type="button" aria-label="Back">${ICONS.back}</button>`
          : `<span></span>`
      }
      ${progressBar()}
      <button class="survey-iconbtn" data-action="close" type="button" aria-label="Close">${ICONS.close}</button>
    </div>`;
  }

  function renderIntro() {
    return `
      ${topbar(false)}
      <p class="survey-eyebrow">Quick start</p>
      <h2 class="survey-title" id="survey-title">What brings you here today?</h2>
      <p class="survey-subtitle">Answer 1–2 questions and we'll jump you straight to the right tools.</p>
      <div class="survey-options survey-options--2col">
        <button class="survey-option" data-action="explore" type="button">
          ${badge("grid", "neutral")}
          <span class="survey-option-label">Explore all tools</span>
          <span class="survey-option-sub">Browse everything myself</span>
        </button>
        <button class="survey-option survey-option--primary" data-action="specific" type="button">
          <span class="survey-badge-tag">Recommended</span>
          ${badge("crosshair", "blue")}
          <span class="survey-option-label">I have a specific task</span>
          <span class="survey-option-sub">Get pointed in the right direction</span>
        </button>
      </div>
      <div class="survey-footer">
        <button class="survey-skip" data-action="explore" type="button">Skip, just show me everything</button>
      </div>
    `;
  }

  function renderIntent() {
    return `
      ${topbar(true, "back-to-intro")}
      <p class="survey-eyebrow">Step 1 of 2</p>
      <h2 class="survey-title" id="survey-title">What do you need help with?</h2>
      <p class="survey-subtitle">Pick the closest match — you can still browse everything after.</p>
      <div class="survey-options survey-options--1col">
        ${INTENTS.map(
          (intent) => `
          <button class="survey-option survey-option--row" data-action="pick-intent" data-intent="${intent.id}" type="button">
            ${badge(intent.icon, intent.accent)}
            <span>
              <span class="survey-option-label">${intent.label}</span><br/>
              <span class="survey-option-sub">${intent.sub}</span>
            </span>
          </button>`,
        ).join("")}
      </div>
    `;
  }

  function renderPricing() {
    return `
      ${topbar(true, "back-to-intent")}
      <p class="survey-eyebrow">Step 2 of 2</p>
      <h2 class="survey-title" id="survey-title">Free or paid tools?</h2>
      <p class="survey-subtitle">We'll filter the list so you only see what fits.</p>
      <div class="survey-options survey-options--1col">
        ${PRICING_OPTIONS.map(
          (p) => `
          <button class="survey-option survey-option--row" data-action="pick-pricing" data-pricing="${p.id}" type="button">
            ${badge(p.icon, p.accent)}
            <span class="survey-option-label">${p.label}</span>
          </button>`,
        ).join("")}
      </div>
    `;
  }

  function renderStep() {
    if (step === "intro") return renderIntro();
    if (step === "intent") return renderIntent();
    return renderPricing();
  }

  function render() {
    if (!modalEl) return;
    const dialog = modalEl.querySelector(".survey-modal");
    dialog.innerHTML = renderStep();
    const firstOption = dialog.querySelector(
      ".survey-option, .survey-skip, .survey-iconbtn",
    );
    firstOption?.focus();
  }

  /* ----------------------------------------------------------
     5. Actions
     ---------------------------------------------------------- */
  function waitForElement(id, timeoutMs = 3000) {
    return new Promise((resolve) => {
      const existing = document.getElementById(id);
      if (existing) return resolve(existing);
      const start = Date.now();
      const interval = setInterval(() => {
        const el = document.getElementById(id);
        if (el || Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve(el || null);
        }
      }, 100);
    });
  }

  // Reads the first category name out of app.js's SURVEY_CATEGORY_GROUPS for
  // this intent, then slugs it the same way app.js does — one source of
  // truth for "which category do we land on" instead of two lists that can
  // drift apart.
  function primaryCategorySlug(intentId) {
    const group =
      (typeof SURVEY_CATEGORY_GROUPS !== "undefined" &&
        SURVEY_CATEGORY_GROUPS[intentId]) ||
      [];
    const primaryName = group[0];
    if (!primaryName) return "";
    return typeof slug === "function"
      ? slug(primaryName)
      : primaryName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
  }

  async function goToCategory(categorySlug) {
    closeSurvey();
    if (typeof showPage === "function") showPage("tools");
    history.pushState(null, "", "#tools");

    if (!categorySlug) return;
    const section = await waitForElement(`cat-${categorySlug}`);
    section?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  function applyPricingFilter(pricingId) {
    // Fallback only — used when app.js's applySurveyRecommendation hook
    // isn't available for some reason. Always click, including "all", so
    // a previously-active free/paid filter actually gets cleared.
    const btn = document.querySelector(
      `.filter-btn[data-pricing="${pricingId}"]`,
    );
    btn?.click(); // reuses the site's existing filter logic in app.js
  }

  function handleAction(action, target) {
    if (action === "close") {
      markDismissedThisSession();
      closeSurvey();
      return;
    }

    if (action === "explore") {
      saveStoredState({ completed: true, path: "explore" });
      closeSurvey();
      if (typeof window.applySurveyRecommendation === "function") {
        window.applySurveyRecommendation(null, "all"); // clear any earlier intent filter
      }
      if (typeof showPage === "function") showPage("categories");
      history.pushState(null, "", "#categories");
      return;
    }

    if (action === "specific") {
      step = "intent";
      render();
      return;
    }

    if (action === "back-to-intro") {
      step = "intro";
      render();
      return;
    }

    if (action === "back-to-intent") {
      step = "intent";
      render();
      return;
    }

    if (action === "pick-intent") {
      chosenIntent = INTENTS.find((i) => i.id === target.dataset.intent);
      step = "pricing";
      render();
      return;
    }

    if (action === "pick-pricing") {
      const pricingId = target.dataset.pricing;
      saveStoredState({
        completed: true,
        path: "specific",
        intent: chosenIntent?.id,
        pricing: pricingId,
      });

      if (typeof window.applySurveyRecommendation === "function") {
        // Filters Browse Tools down to this intent's categories AND syncs
        // the pricing filter buttons in one call — app.js owns the state.
        window.applySurveyRecommendation(chosenIntent.id, pricingId);
      } else {
        // app.js didn't expose the hook (older version, or it failed to
        // load) — fall back to the old behavior so the survey still works.
        applyPricingFilter(pricingId);
      }

      goToCategory(primaryCategorySlug(chosenIntent.id));
      return;
    }
  }

  /* ----------------------------------------------------------
     6. Open / close
     ---------------------------------------------------------- */
  function openSurvey() {
    if (modalEl) return; // already open
    injectStyles();
    step = "intro";
    chosenIntent = null;
    lastFocused = document.activeElement;

    modalEl = document.createElement("div");
    modalEl.className = "survey-overlay";
    modalEl.innerHTML = `<div class="survey-modal" role="dialog" aria-modal="true" aria-labelledby="survey-title"></div>`;
    document.body.appendChild(modalEl);
    document.body.classList.add("survey-open");

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) handleAction("close");
      const actionEl = e.target.closest("[data-action]");
      if (actionEl) handleAction(actionEl.dataset.action, actionEl);
    });

    document.addEventListener("keydown", onKeydown);
    render();
  }

  function closeSurvey() {
    if (!modalEl) return;
    document.removeEventListener("keydown", onKeydown);
    modalEl.remove();
    modalEl = null;
    document.body.classList.remove("survey-open");
    lastFocused?.focus?.();
  }

  function onKeydown(e) {
    if (e.key === "Escape") handleAction("close");
  }

  /* ----------------------------------------------------------
     7. Floating re-open trigger (persists after the first visit)
     ---------------------------------------------------------- */
  function mountTrigger() {
    if (document.querySelector(".survey-trigger")) return;
    const btn = document.createElement("button");
    btn.className = "survey-trigger";
    btn.type = "button";
    btn.innerHTML = `${ICONS.crosshair} <span>Not sure where to start?</span>`;
    btn.addEventListener("click", openSurvey);
    document.body.appendChild(btn);
  }

  /* ----------------------------------------------------------
     8. Init — auto-show once for first-time visitors on the
     home page, then just leave the floating trigger available.
     ---------------------------------------------------------- */
  function init() {
    injectStyles();
    mountTrigger();

    setTimeout(() => {
      openSurvey();
    }, 700);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
