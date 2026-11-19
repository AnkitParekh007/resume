/* Progressive enhancement for the Open Source Projects story. */
(function () {
  'use strict';

  var root = document.documentElement;
  var themeButton = document.getElementById('theme');
  var themeSun = document.getElementById('themeSun');
  var themeMoon = document.getElementById('themeMoon');

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function currentlyDark() {
    var saved = root.getAttribute('data-theme');
    return saved === 'dark' || (!saved && systemPrefersDark());
  }

  function updateThemeLabel() {
    if (!themeButton) return;
    var dark = currentlyDark();
    themeSun.hidden = !dark;
    themeMoon.hidden = dark;
    themeButton.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  try {
    var storedTheme = window.localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      root.setAttribute('data-theme', storedTheme);
    }
  } catch (error) {
    /* Private browsing can disable local storage; the toggle still works. */
  }

  updateThemeLabel();

  if (themeButton) {
    themeButton.addEventListener('click', function () {
      var next = currentlyDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        window.localStorage.setItem('theme', next);
      } catch (error) {}
      updateThemeLabel();
    });
  }

  if (window.matchMedia) {
    var scheme = window.matchMedia('(prefers-color-scheme: dark)');
    if (typeof scheme.addEventListener === 'function') {
      scheme.addEventListener('change', updateThemeLabel);
    }
  }

  var revealItems = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -5% 0px' });
    revealItems.forEach(function (element) { observer.observe(element); });
  } else {
    revealItems.forEach(function (element) { element.classList.add('in-view'); });
  }

  var progress = document.getElementById('reading-progress');
  var queued = false;

  function updateReadingProgress() {
    queued = false;
    if (!progress) return;
    var scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var fraction = Math.min(1, Math.max(0, window.scrollY / scrollable));
    progress.style.transform = 'scaleX(' + fraction.toFixed(4) + ')';
  }

  function queueUpdate() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(updateReadingProgress);
  }

  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate);
  window.addEventListener('load', queueUpdate);
  updateReadingProgress();
}());
