/* Progressive, dependency-free motion for the in-page Open Source Projects route.
   Keeps routing and filtering owned by their existing scripts. */
(function () {
  'use strict';

  var page = document.getElementById('open-source-projects');
  if (!page) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var cards = Array.prototype.slice.call(page.querySelectorAll('#featured .project'));
  var started = false;
  var railUpdate = null;
  var framePending = false;

  function onFrame(fn) {
    var pending = false;
    return function () {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(function () {
        pending = false;
        fn();
      });
    };
  }

  function cardEntered(card) {
    if (card.hidden || page.hidden || reducedMotion.matches) return;
    card.classList.add('motion-entered');
  }

  function setupGallery() {
    var observer = 'IntersectionObserver' in window ?
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          cardEntered(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: .08, rootMargin: '0px 0px 40px 0px' }) : null;

    cards.forEach(function (card, index) {
      card.style.setProperty('--oss-delay', ((index % 2) * 90) + 'ms');
      if (observer) observer.observe(card);
      else cardEntered(card);
    });

    // The existing filter handler runs first; animate only cards it kept visible.
    Array.prototype.forEach.call(page.querySelectorAll('#featured [data-filter]'), function (button) {
      button.addEventListener('click', function () {
        if (reducedMotion.matches) return;
        window.requestAnimationFrame(function () {
          var visible = cards.filter(function (card) {
            var group = card.closest('[data-project-group]');
            return !card.hidden && (!group || !group.hidden);
          });
          visible.forEach(function (card) { card.classList.remove('motion-entered'); });
          // One layout flush restarts the sequence for this deliberate filter action.
          if (visible.length) void visible[0].offsetWidth;
          visible.forEach(function (card, index) {
            card.style.setProperty('--oss-delay', (Math.min(index, 4) * 75) + 'ms');
            card.classList.add('motion-entered');
            if (observer) observer.unobserve(card);
          });
          if (railUpdate) railUpdate();
        });
      });
    });
  }

  function setupPointerMotion() {
    if (!finePointer.matches) return;

    var art = page.querySelector('.hero-art');
    if (art) {
      var artFrame = 0;
      var artX = 0, artY = 0;
      art.addEventListener('pointermove', function (event) {
        if (reducedMotion.matches) return;
        var rect = art.getBoundingClientRect();
        artX = ((event.clientX - rect.left) / rect.width - .5);
        artY = ((event.clientY - rect.top) / rect.height - .5);
        if (artFrame) return;
        artFrame = window.requestAnimationFrame(function () {
          artFrame = 0;
          art.style.setProperty('--oss-parallax-x', (artX * 17).toFixed(1) + 'px');
          art.style.setProperty('--oss-parallax-y', (artY * 14).toFixed(1) + 'px');
          art.style.setProperty('--oss-tag-x', (artX * -7).toFixed(1) + 'px');
          art.style.setProperty('--oss-tag-y', (artY * -6).toFixed(1) + 'px');
        });
      });
      art.addEventListener('pointerleave', function () {
        if (artFrame) window.cancelAnimationFrame(artFrame);
        artFrame = 0;
        ['--oss-parallax-x','--oss-parallax-y','--oss-tag-x','--oss-tag-y'].forEach(function (name) {
          art.style.setProperty(name, '0px');
        });
      });
    }

    cards.forEach(function (card) {
      var frame = 0;
      var eventX = 0, eventY = 0;
      card.addEventListener('pointermove', function (event) {
        if (reducedMotion.matches) return;
        var rect = card.getBoundingClientRect();
        eventX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        eventY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        if (frame) return;
        frame = window.requestAnimationFrame(function () {
          frame = 0;
          card.style.setProperty('--oss-spot-x', (eventX * 100).toFixed(1) + '%');
          card.style.setProperty('--oss-spot-y', (eventY * 100).toFixed(1) + '%');
          card.style.setProperty('--oss-media-x', ((.5 - eventX) * 11).toFixed(1) + 'px');
          card.style.setProperty('--oss-media-y', ((.5 - eventY) * 8).toFixed(1) + 'px');
        });
      });
      card.addEventListener('pointerleave', function () {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        card.style.setProperty('--oss-spot-x', '50%');
        card.style.setProperty('--oss-spot-y', '25%');
        card.style.setProperty('--oss-media-x', '0px');
        card.style.setProperty('--oss-media-y', '0px');
      });
    });

    Array.prototype.forEach.call(page.querySelectorAll('.opening .btn, .feature-actions .btn.primary, .close-cta .btn.primary'), function (button) {
      var frame = 0;
      var x = 0, y = 0;
      button.addEventListener('pointermove', function (event) {
        if (reducedMotion.matches) return;
        var rect = button.getBoundingClientRect();
        x = ((event.clientX - rect.left) / rect.width - .5) * 9;
        y = ((event.clientY - rect.top) / rect.height - .5) * 7;
        if (frame) return;
        frame = window.requestAnimationFrame(function () {
          frame = 0;
          button.style.setProperty('--oss-magnet-x', x.toFixed(1) + 'px');
          button.style.setProperty('--oss-magnet-y', y.toFixed(1) + 'px');
        });
      });
      button.addEventListener('pointerleave', function () {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        button.style.setProperty('--oss-magnet-x', '0px');
        button.style.setProperty('--oss-magnet-y', '0px');
      });
    });
  }

  function setupJourneyRail() {
    var chapters = [
      { id: 'problem', label: 'The challenge' },
      { id: 'reboundops', label: 'ReboundOps' },
      { id: 'job-search-assistant', label: 'AI Job Search Assistant' },
      { id: 'principles', label: 'Design principles' },
      { id: 'featured', label: 'Project gallery' },
      { id: 'close-title', label: 'Explore the source' }
    ];
    var rail = document.createElement('nav');
    rail.className = 'oss-journey-rail';
    rail.setAttribute('aria-label', 'Open-source story chapters');
    var list = document.createElement('ul');
    var links = [];
    chapters.forEach(function (chapter) {
      if (!document.getElementById(chapter.id)) return;
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = '#' + chapter.id;
      link.setAttribute('aria-label', chapter.label);
      var dot = document.createElement('span');
      dot.className = 'rail-dot';
      dot.setAttribute('aria-hidden', 'true');
      var label = document.createElement('span');
      label.className = 'rail-label';
      label.setAttribute('aria-hidden', 'true');
      label.textContent = chapter.label;
      link.appendChild(dot);
      link.appendChild(label);
      item.appendChild(link);
      list.appendChild(item);
      links.push({ element: link, target: document.getElementById(chapter.id) });
    });
    rail.appendChild(list);
    page.appendChild(rail);

    function updateRail() {
      if (page.hidden) return;
      var marker = window.innerHeight * .45;
      var active = 0;
      links.forEach(function (item, index) {
        if (item.target.getBoundingClientRect().top <= marker) active = index;
      });
      links.forEach(function (item, index) {
        if (active === index) item.element.setAttribute('aria-current', 'location');
        else item.element.removeAttribute('aria-current');
      });
    }
    railUpdate = onFrame(updateRail);
    window.addEventListener('scroll', railUpdate, { passive: true });
    window.addEventListener('resize', railUpdate);
    window.addEventListener('hashchange', railUpdate);
    railUpdate();
  }

  function activate() {
    if (page.hidden || started || reducedMotion.matches) return;
    started = true;
    page.classList.add('motion-ready');
    window.requestAnimationFrame(function () { page.classList.add('motion-active'); });
    setupGallery();
    setupPointerMotion();
    setupJourneyRail();
  }

  // The Open Source route is hidden on the resume view and revealed via hash navigation.
  var routeObserver = new MutationObserver(function () {
    if (!page.hidden) {
      activate();
      if (railUpdate) railUpdate();
    }
  });
  routeObserver.observe(page, { attributes: true, attributeFilter: ['hidden'] });
  activate();

  function onPreferenceChange() {
    if (reducedMotion.matches) {
      page.classList.remove('motion-ready', 'motion-active');
      cards.forEach(function (card) { card.classList.add('motion-entered'); });
    } else if (started) {
      page.classList.add('motion-ready', 'motion-active');
    } else {
      activate();
    }
  }
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', onPreferenceChange);
  else if (reducedMotion.addListener) reducedMotion.addListener(onPreferenceChange);
}());
