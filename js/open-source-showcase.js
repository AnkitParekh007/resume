/* Category filters for the engineering gallery. The original storytelling script owns theme, reveal and scroll progress. */
(function () {
  'use strict';
  var root = document.getElementById('featured');
  if (!root) return;
  var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-filter]'));
  var cards = Array.prototype.slice.call(root.querySelectorAll('[data-categories]'));
  var groups = Array.prototype.slice.call(root.querySelectorAll('[data-project-group]'));
  var liveRegion = document.getElementById('filter-status');

  function applyFilter(filter) {
    var shown = 0;
    cards.forEach(function (card) {
      var categories = (card.getAttribute('data-categories') || '').split(/\s+/);
      var visible = filter === 'all' || categories.indexOf(filter) !== -1;
      card.hidden = !visible;
      if (visible) shown++;
    });
    groups.forEach(function (group) {
      group.hidden = !group.querySelector('[data-categories]:not([hidden])');
    });
    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
    });
    if (liveRegion) liveRegion.textContent = shown + ' project' + (shown === 1 ? '' : 's') + ' shown';
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      applyFilter(button.dataset.filter);
    });
  });
  applyFilter('all');
}());
