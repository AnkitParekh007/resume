(function () {
  "use strict";

  var THEME_KEY = "theme";
  var prefersReduced =
    typeof window.matchMedia !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function getTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}

    var meta = document.getElementById("themeColorMeta");
    if (meta) {
      meta.setAttribute("content", theme === "light" ? "#eef2ff" : "#07080d");
    }

    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
  }

  function toggleTheme() {
    applyTheme(getTheme() === "dark" ? "light" : "dark");
  }

  var themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", toggleTheme);
    applyTheme(getTheme());
  } else {
    applyTheme(getTheme());
  }

  /* Nav scroll shadow */
  var nav = document.querySelector(".site-nav");
  if (nav) {
    function onScrollNav() {
      nav.classList.toggle("is-scrolled", window.scrollY > 40);
    }
    window.addEventListener("scroll", onScrollNav, { passive: true });
    onScrollNav();
  }

  /* Smooth anchor scroll + close mobile menu */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var id = this.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var navEl = document.querySelector(".site-nav");
      var offset = navEl ? navEl.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - offset - 8;
      window.scrollTo({ top: top, behavior: prefersReduced ? "auto" : "smooth" });
      var collapse = document.querySelector(".navbar-collapse");
      if (
        typeof bootstrap !== "undefined" &&
        collapse &&
        collapse.classList.contains("show")
      ) {
        bootstrap.Collapse.getOrCreateInstance(collapse).hide();
      }
    });
  });

  /* Scroll-triggered section visibility */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && !prefersReduced && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { root: null, rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else if (revealEls.length) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* Active nav by section in view */
  var navSections = ["vision", "building", "edge", "work-experiences", "experience", "contact"];
  var navLinks = document.querySelectorAll(".nav-section");

  function clearNavActive() {
    navLinks.forEach(function (a) {
      a.classList.remove("is-active");
    });
  }

  function setNavActive(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-section") === id);
    });
  }

  if (navLinks.length && "IntersectionObserver" in window) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            if (navSections.indexOf(id) !== -1) {
              setNavActive(id);
            }
          }
        });
      },
      { root: null, rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    navSections.forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) navObserver.observe(sec);
    });
  }

  window.addEventListener(
    "scroll",
    function () {
      if (window.scrollY < 100) {
        clearNavActive();
      }
    },
    { passive: true }
  );
})();
