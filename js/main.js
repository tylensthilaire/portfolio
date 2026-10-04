// Single column is the default; two columns is an opt-in held in the URL
const LAYOUTS = ["single", "two-column"];

function currentLayout() {
  const asked = new URLSearchParams(window.location.search).get("layout");
  // Anything unrecognised falls back to the safe layout rather than being trusted.
  return LAYOUTS.includes(asked) ? asked : "single";
}

function applyLayout(layout) {
  if (layout === "two-column") {
    document.documentElement.dataset.layout = "two-column";
  } else {
    delete document.documentElement.dataset.layout;
  }
}

function writeLayoutToUrl(layout) {
  const url = new URL(window.location.href);
  if (layout === "two-column") {
    url.searchParams.set("layout", layout);
  } else {
    url.searchParams.delete("layout");
  }
  window.history.replaceState({}, "", url);
}

function initPrintControl() {
  const control = document.querySelector("[data-print]");
  if (!control) return;

  const toggle = control.querySelector(".c-print__toggle");
  const options = control.querySelector(".c-print__options");
  if (!toggle || !options) return;

  applyLayout(currentLayout());
  control.hidden = false;

  const close = () => {
    options.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    options.hidden = open;
    toggle.setAttribute("aria-expanded", String(!open));
  });

  control.querySelectorAll(".c-print__option").forEach(option => {
    option.addEventListener("click", () => {
      const layout = option.dataset.layout;
      applyLayout(layout);
      writeLayoutToUrl(layout);
      close();
      // Let the layout land before print() snapshots the page
      requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
  });

  document.addEventListener("click", event => {
    if (!control.contains(event.target)) close();
  });
}

// Analytics (Umami, cookie-free) ------------------------------------------

// Umami skips tracking in any browser where this flag is set.
const OPT_OUT_KEY = "umami.disabled";

function isOptedOut() {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch (error) {
    return false;
  }
}

// Goals that aren't page views: e-mail links and PDF downloads, wherever they appear.
function initGoalTracking() {
  document.addEventListener("click", event => {
    const link = event.target.closest && event.target.closest("a[href]");
    if (!link || !window.umami) return;
    const href = link.getAttribute("href");
    if (href.startsWith("mailto:")) {
      window.umami.track("email-click");
    } else if (/\.pdf($|[?#])/i.test(href)) {
      window.umami.track("pdf-download", { file: href.split("/").pop() });
    }
  });
}

// Footer counter: all-time visits from the /api/visits Netlify Function.
async function initVisitCounter() {
  const counter = document.querySelector("[data-visit-counter]");
  if (!counter) return;
  const count = counter.querySelector("[data-visit-count]");
  const label = counter.querySelector("[data-visit-label]");
  try {
    const response = await fetch("/api/visits");
    if (!response.ok) return;
    const { visits } = await response.json();
    if (!Number.isFinite(visits)) return;
    const formatted = visits.toLocaleString("en-GB");
    count.textContent = formatted;
    count.hidden = false;
    label.textContent = `${formatted} visits, counted without cookies. About this counter and opting out`;
  } catch (error) {
    // Leave the icon and its label as they are; the link still works.
  }
}

// Privacy page: a button that switches tracking off (and on) in this browser.
function initOptOutToggle() {
  const toggle = document.querySelector("[data-analytics-toggle]");
  const status = document.querySelector("[data-analytics-status]");
  if (!toggle || !status) return;

  const render = () => {
    const optedOut = isOptedOut();
    status.textContent = optedOut
      ? "You've opted out: this browser isn't being counted."
      : "This browser is being counted (anonymously, without cookies).";
    toggle.textContent = optedOut ? "Opt back in" : "Opt out";
    toggle.setAttribute("aria-pressed", String(optedOut));
  };

  toggle.addEventListener("click", () => {
    try {
      if (isOptedOut()) {
        localStorage.removeItem(OPT_OUT_KEY);
      } else {
        localStorage.setItem(OPT_OUT_KEY, "1");
      }
    } catch (error) {
      status.textContent = "Your browser is blocking storage, so the opt-out can't be saved.";
      return;
    }
    render();
  });

  toggle.hidden = false;
  render();
}

function init() {
  initPrintControl();
  initGoalTracking();
  initVisitCounter();
  initOptOutToggle();
}

// Loaded async, so this may run either side of DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
