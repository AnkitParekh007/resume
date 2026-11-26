(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme');
  function dark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function paint() {
    if (!btn) return;
    btn.textContent = dark() ? 'Light' : 'Dark';
    btn.setAttribute('aria-label', dark() ? 'Switch to light theme' : 'Switch to dark theme');
  }
  try {
    var saved = localStorage.getItem('theme');
    if (saved) root.setAttribute('data-theme', saved);
  } catch (e) {}
  paint();
  if (btn) btn.addEventListener('click', function () {
    var next = dark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    paint();
  });

  var D = window.COURSE_DATA;
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function academy(id) { return D.academies.filter(function (a) { return a.id === id; })[0]; }
  function items(id) { return D.items.filter(function (i) { return !id || i.academy === id; }); }
  function stats(list) {
    return {
      courses: list.length,
      badges: list.filter(function (i) { return i.kind === 'badge'; }).length,
      certificates: list.filter(function (i) { return i.kind === 'certificate'; }).length,
      completed: list.filter(function (i) { return i.kind === 'completed'; }).length
    };
  }
  function verifiedCount(a, s) { return a.verified === 'badges' ? s.badges : s.certificates; }
  function mark(id) {
    if (id === 'cl') return '<span class="mark cl" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.3 3.5h-3.7L20.3 20.5H24ZM6.7 3.5 0 20.5h3.7l1.4-3.6h7l1.4 3.6h3.7L10.5 3.5Zm-.4 10.2 2.3-5.9 2.3 5.9Z"/></svg></span>';
    if (id === 'oa') return '<span class="mark oa" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.3 9.8a6 6 0 0 0-.5-4.9 6 6 0 0 0-6.5-2.9A6 6 0 0 0 5 4.2a6 6 0 0 0-4 2.9 6 6 0 0 0 .7 7.1 6 6 0 0 0 .5 4.9 6 6 0 0 0 6.5 2.9A6 6 0 0 0 13.3 24a6 6 0 0 0 5.8-4.2 6 6 0 0 0 4-2.9 6 6 0 0 0-.8-7.1ZM13.3 22.4a4.5 4.5 0 0 1-2.9-1l.1-.1 4.8-2.8a.8.8 0 0 0 .4-.7V11l2 1.2v5.6a4.5 4.5 0 0 1-4.4 4.6Zm-9.7-4.1a4.5 4.5 0 0 1-.5-3l.1.1 4.8 2.7a.8.8 0 0 0 .8 0l5.8-3.4v2.3L9.7 20a4.5 4.5 0 0 1-6.1-1.7ZM2.3 7.9A4.5 4.5 0 0 1 4.7 6v5.7a.8.8 0 0 0 .4.7l5.8 3.3-2 1.2-4.8-2.8A4.5 4.5 0 0 1 2.3 7.9Zm16.6 3.9L13.1 8.4l2-1.2 4.8 2.8a4.5 4.5 0 0 1-.7 8.1v-5.7a.8.8 0 0 0-.4-.6Zm2-3-.1-.1-4.8-2.8a.8.8 0 0 0-.8 0L9.4 9.2V6.9l4.8-2.8a4.5 4.5 0 0 1 6.7 4.7ZM8.3 12.9l-2-1.2V6.1a4.5 4.5 0 0 1 7.4-3.5L8.7 5.5a.8.8 0 0 0-.4.7Zm1.1-2.4 2.6-1.5 2.6 1.5V13l-2.6 1.5-2.6-1.5Z"/></svg></span>';
    if (id === 'lc') return '<span class="mark lc" aria-hidden="true">LC</span>';
    return '<span class="mark hf" aria-hidden="true">HF</span>';
  }
  function when(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return Number(p[2]) + ' ' + months[Number(p[1]) - 1] + ' ' + p[0];
  }
  function row(item) {
    var date = item.completedOn ? '<time class="when" datetime="' + esc(item.completedOn) + '">' + esc(when(item.completedOn)) + '</time>' : '';
    return '<a class="course" href="' + esc(item.href) + '" target="_blank" rel="noopener noreferrer"><span class="course-title">' + esc(item.title) + '</span>' + date + '<span class="pill ' + item.kind + '">' + esc(item.label) + '</span><svg class="ext" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></a>';
  }
  window.Courses = { data: D, esc: esc, academy: academy, items: items, stats: stats, verifiedCount: verifiedCount, mark: mark, row: row };
})();
