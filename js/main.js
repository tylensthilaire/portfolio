// Shows the print button on `/resume`
function initPrintButtons() {
  for (const button of document.querySelectorAll("[data-print]")) {
    button.hidden = false;
    button.addEventListener("click", () => window.print());
  }
}

// Loaded `async`, so it may run either side of DOMContentLoaded.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPrintButtons);
} else {
  initPrintButtons();
}
