/* Progressive enhancements for the in-page Open Source Projects route. */
(function () {
  'use strict';
  var page = document.getElementById('open-source-projects');
  if (!page) return;
  var elements = Array.prototype.slice.call(page.querySelectorAll('.reveal'));
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && 'IntersectionObserver' in window) {
    page.classList.add('js');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    elements.forEach(function (element) { observer.observe(element); });
  } else {
    elements.forEach(function (element) { element.classList.add('in-view'); });
  }
  var progress = page.querySelector('#reading-progress');
  var queued = false;
  function update() {
    queued = false;
    if (page.hidden || !progress) return;
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.transform = 'scaleX(' + Math.min(1, Math.max(0, window.scrollY/maxScroll)).toFixed(4) + ')';
  }
  function queue() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  queue();
}());
