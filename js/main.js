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

// Loaded async, so this may run either side of DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPrintControl);
} else {
  initPrintControl();
}
