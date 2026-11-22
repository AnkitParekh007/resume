(() => {
  "use strict";
  const root = document.documentElement;
  const themeButton = document.getElementById("theme");
  const themeIcon = document.getElementById("theme-icon");
  const key = "portfolio-theme";
  const mq = window.matchMedia("(prefers-color-scheme: dark)");

  const preferred = () => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const setTheme = (theme, persist = false) => {
    if (theme === "light" || theme === "dark") root.dataset.theme = theme;
    else root.removeAttribute("data-theme");
    const effective = theme === "light" || theme === "dark" ? theme : (mq.matches ? "dark" : "light");
    themeButton.setAttribute("aria-label", "Switch to " + (effective === "dark" ? "light" : "dark") + " theme");
    themeButton.setAttribute("aria-pressed", String(effective === "dark"));
    if (themeIcon) themeIcon.textContent = effective === "dark" ? "☀" : "☾";
    if (persist) {
      try { localStorage.setItem(key, effective); } catch { /* storage can be unavailable */ }
    }
  };
  setTheme(preferred());
  themeButton.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" || (!root.dataset.theme && mq.matches) ? "light" : "dark", true);
  });
  if (mq.addEventListener) mq.addEventListener("change", () => { if (!preferred()) setTheme(null); });

  const buttons = [...document.querySelectorAll("[data-filter]")];
  const cards = [...document.querySelectorAll("[data-categories]")];
  const groups = [...document.querySelectorAll("[data-project-group]")];
  const announcement = document.getElementById("filter-status");

  const applyFilter = filter => {
    let shown = 0;
    cards.forEach(card => {
      const matches = filter === "all" || card.dataset.categories.split(" ").includes(filter);
      card.hidden = !matches;
      if (matches) shown++;
    });
    groups.forEach(group => {
      group.hidden = !group.querySelector("[data-categories]:not([hidden])");
    });
    buttons.forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
    });
    if (announcement) announcement.textContent = `${shown} project${shown === 1 ? "" : "s"} shown`;
  };

  buttons.forEach(button => button.addEventListener("click", () => applyFilter(button.dataset.filter)));
  applyFilter("all");
})();
