/* Ask my agent: chat panel and job-description fit check.
   The module stays hidden until the agent backend answers GET /api/health. There are no canned answers:
   if the backend is unreachable the section, the launcher and the table-of-contents entry simply do not appear. */
(function () {
  'use strict';

  var meta = document.querySelector('meta[name="ask-agent-endpoint"]');
  var endpoint = ((meta && meta.content) || '').trim();
  // Local testing only: http://localhost:8765/?askAgent=http://localhost:8787
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    var override = new URLSearchParams(location.search).get('askAgent');
    if (override) endpoint = override.trim();
  }
  endpoint = endpoint.replace(/\/+$/, '');
  if (!/^https?:\/\//.test(endpoint)) return;

  var MAX_CHARS = 1000;
  var MAX_HISTORY_CHARS = 11000;
  var CHAT_TIMEOUT_MS = 60000;
  var JD_TIMEOUT_MS = 60000;

  var $ = function (id) { return document.getElementById(id); };
  var section = $('ask'), tocItem = $('askToc'), launcher = $('askLaunch'), panel = $('askPanel');
  if (!section || !launcher || !panel) return;
  var log = $('askLog'), form = $('askForm'), input = $('askInput'), sendBtn = $('askSend'), starters = $('askStarters');
  var jdForm = $('jdForm'), jdText = $('jdText'), jdCount = $('jdCount'), jdSubmit = $('jdSubmit'), jdError = $('jdError'), jdResult = $('jdResult');

  var history = [];
  var busy = false;

  // ---------- Safe rendering: escape first, then add only the few tags the answers need ----------
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})\b/g, '<a href="mailto:$1">$1</a>');
    s = s.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    s = s.replace(/(^|[\s(])(https:\/\/[^\s<)]*[^\s<).,;:!?])/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    return s;
  }
  function renderMd(text) {
    var out = [], para = [], list = null;
    function flushPara() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    function flushList() {
      if (list) {
        out.push('<' + list.tag + '>' + list.items.map(function (i) { return '<li>' + inline(i) + '</li>'; }).join('') + '</' + list.tag + '>');
        list = null;
      }
    }
    text.replace(/\r\n/g, '\n').split('\n').forEach(function (raw) {
      var line = raw.trim();
      if (!line) { flushPara(); flushList(); return; }
      var ul = /^[-*\u2022]\s+(.*)$/.exec(line), ol = /^\d+[.)]\s+(.*)$/.exec(line), m = ul || ol;
      if (m) {
        flushPara();
        var tag = ul ? 'ul' : 'ol';
        if (list && list.tag !== tag) flushList();
        if (!list) list = { tag: tag, items: [] };
        list.items.push(m[1]);
        return;
      }
      flushList();
      para.push(line);
    });
    flushPara(); flushList();
    return out.join('');
  }

  // ---------- Chat panel ----------
  function nearBottom() { return log.scrollHeight - log.scrollTop - log.clientHeight < 80; }
  function toBottom() { log.scrollTop = log.scrollHeight; }

  function addMessage(role, kind) {
    var wrap = document.createElement('div');
    wrap.className = 'ask-msg ask-msg--' + role + (kind ? ' ask-msg--' + kind : '');
    var bubble = document.createElement('div');
    bubble.className = 'ask-bubble';
    wrap.appendChild(bubble);
    log.appendChild(wrap);
    toBottom();
    return { wrap: wrap, bubble: bubble };
  }
  function typingDots() {
    var el = document.createElement('span');
    el.className = 'ask-typing';
    el.setAttribute('aria-label', 'The agent is writing');
    el.innerHTML = '<i></i><i></i><i></i>';
    return el;
  }

  function openPanel(focus) {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    if (focus !== false) input.focus();
    toBottom();
  }
  function closePanel() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }

  function setBusy(on) {
    busy = on;
    input.disabled = on;
    sendBtn.disabled = on;
    if (!on && !panel.hidden) input.focus();
  }

  function trimmedHistory() {
    var h = history.slice(-11);
    var total = h.reduce(function (n, m) { return n + m.content.length; }, 0);
    // Drop whole question/answer pairs from the front so the turns still alternate and start with the user.
    while (h.length > 1 && total > MAX_HISTORY_CHARS) {
      total -= h[0].content.length + h[1].content.length;
      h = h.slice(2);
    }
    return h;
  }

  function friendly(err, fallback) {
    if (err && err.name === 'AbortError') return 'The agent took too long to answer. Please try again.';
    if (err && err.userMessage) return err.userMessage;
    return fallback;
  }
  function failure(res) {
    return res.json().catch(function () { return {}; }).then(function (j) {
      var e = new Error('http ' + res.status);
      e.userMessage = (j && j.error) || 'The agent is unavailable right now. Please try again shortly.';
      throw e;
    });
  }

  function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);
    openPanel(false);
    starters.hidden = true;
    var userMsg = addMessage('user');
    userMsg.bubble.textContent = text;
    history.push({ role: 'user', content: text });
    setBusy(true);

    var reply = addMessage('assistant');
    reply.bubble.appendChild(typingDots());
    var acc = '', queued = false;
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, CHAT_TIMEOUT_MS);

    function paint() {
      queued = false;
      var stick = nearBottom();
      reply.bubble.innerHTML = renderMd(acc);
      if (stick) toBottom();
    }

    fetch(endpoint + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: trimmedHistory() }),
      signal: ctrl.signal
    }).then(function (res) {
      if (!res.ok) return failure(res);
      if (!res.body || !res.body.getReader) {
        return res.text().then(function (t) { acc = t; });
      }
      var reader = res.body.getReader(), dec = new TextDecoder();
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) { acc += dec.decode(); return; }
          acc += dec.decode(r.value, { stream: true });
          if (!queued) { queued = true; requestAnimationFrame(paint); }
          return pump();
        });
      }
      return pump();
    }).then(function () {
      if (!acc.trim()) {
        var e = new Error('empty');
        e.userMessage = 'The agent returned no answer. Please try again.';
        throw e;
      }
      paint();
      history.push({ role: 'assistant', content: acc });
    }).catch(function (err) {
      if (acc.trim()) {
        // Keep what arrived so the turns stay paired, and say the answer was cut short.
        paint();
        history.push({ role: 'assistant', content: acc });
        var note = addMessage('assistant', 'error');
        note.bubble.textContent = friendly(err, 'The answer was cut short. Please try again.');
        return;
      }
      history.pop();
      reply.wrap.classList.add('ask-msg--error');
      reply.bubble.textContent = friendly(err, 'The agent is unavailable right now. Please try again shortly.');
    }).then(function () {
      clearTimeout(timer);
      setBusy(false);
      toBottom();
    });
  }

  // ---------- Job description fit check (the inline card and the dialog share this) ----------
  var VERDICT_TEXT = { strong: 'Strong fit', partial: 'Partial fit', weak: 'Weak fit' };
  var JD_MIN = 80;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderFit(fit, box) {
    box.textContent = '';
    var badge = el('p', 'ask-verdict', VERDICT_TEXT[fit.verdict] || 'Fit');
    badge.dataset.v = fit.verdict;
    box.appendChild(badge);
    box.appendChild(el('p', 'ask-summary', fit.summary));

    if (fit.matches && fit.matches.length) {
      box.appendChild(el('h4', null, 'Requirements and evidence'));
      var ul = el('ul', 'ask-matches');
      fit.matches.forEach(function (m) {
        var li = el('li');
        li.appendChild(el('b', null, m.requirement));
        li.appendChild(el('p', null, m.evidence));
        li.appendChild(el('span', 'ask-label', m.label));
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
    if (fit.gaps && fit.gaps.length) {
      box.appendChild(el('h4', null, 'Gaps'));
      var g = el('ul', 'ask-gaps');
      fit.gaps.forEach(function (t) { g.appendChild(el('li', null, t)); });
      box.appendChild(g);
    }
    box.appendChild(el('p', 'ask-caveat', 'Generated by an AI from Ankit\u2019s profile. Verify anything that matters with him directly.'));
    box.hidden = false;
  }

  function jdChecker(f) {
    var label = f.submit.textContent;
    function fail(message) { f.error.textContent = message; f.error.hidden = false; }

    f.text.addEventListener('input', function () { f.count.textContent = f.text.value.length + ' / ' + f.text.maxLength; });
    f.form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.submit.disabled) return;
      var text = f.text.value.trim();
      f.error.hidden = true;
      if (text.length < JD_MIN) { fail('Paste the full job description (at least a few sentences) so the match is meaningful.'); return; }
      f.submit.disabled = true;
      f.submit.textContent = 'Checking\u2026';
      f.result.hidden = true;
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, JD_TIMEOUT_MS);

      fetch(endpoint + '/api/jd-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: text }),
        signal: ctrl.signal
      }).then(function (res) {
        if (!res.ok) return failure(res);
        return res.json();
      }).then(function (fit) {
        if (!fit || !fit.verdict || !fit.summary) {
          var bad = new Error('shape');
          bad.userMessage = 'The agent returned an unexpected answer. Please try again.';
          throw bad;
        }
        renderFit(fit, f.result);
        if (f.afterResult) f.afterResult();
      }).catch(function (err) {
        fail(friendly(err, 'The agent is unavailable right now. Please try again shortly.'));
      }).then(function () {
        clearTimeout(timer);
        f.submit.disabled = false;
        f.submit.textContent = label;
      });
    });
    return { fail: fail };
  }

  // ---------- Dialogs ----------
  function openDialog(d, focusEl) {
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else { d.setAttribute('open', ''); }
    document.documentElement.classList.add('ask-lock');
    if (focusEl) focusEl.focus();
  }
  function wireDialog(d) {
    d.addEventListener('close', function () {
      if (!document.querySelector('dialog[open]')) document.documentElement.classList.remove('ask-lock');
    });
    // A click on the backdrop lands on the dialog element itself.
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    Array.prototype.forEach.call(d.querySelectorAll('[data-close]'), function (b) {
      b.addEventListener('click', function () { d.close(); });
    });
  }

  // ---------- Features, each shown only when the backend reports it ready ----------
  var agentOn = false, contactOn = false;

  function showAgent() {
    if (agentOn) return;
    agentOn = true;
    launcher.addEventListener('click', function () { if (panel.hidden) openPanel(); else closePanel(); });
    $('askClose').addEventListener('click', closePanel);
    $('askOpen').addEventListener('click', function () { openPanel(); });
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); closePanel(); } });
    form.addEventListener('submit', function (e) { e.preventDefault(); var t = input.value; if (t.trim()) { input.value = ''; send(t); } });
    Array.prototype.forEach.call(document.querySelectorAll('[data-ask]'), function (b) {
      b.addEventListener('click', function () { send(b.getAttribute('data-ask')); });
    });
    jdChecker({ form: jdForm, text: jdText, count: jdCount, submit: jdSubmit, error: jdError, result: jdResult });

    // Footer: fit check in a dialog, chat in the panel.
    var fitDialog = $('fitDialog'), fitText = $('fitText'), fitFile = $('fitFile'), fitResult = $('fitResult');
    wireDialog(fitDialog);
    var fit = jdChecker({
      form: $('fitForm'), text: fitText, count: $('fitCount'), submit: $('fitSubmit'), error: $('fitError'), result: fitResult,
      afterResult: function () { fitResult.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    });
    $('ctaFit').addEventListener('click', function () { openDialog(fitDialog, fitText); });
    $('ctaAsk').addEventListener('click', function () { openPanel(); });
    $('fitUpload').addEventListener('click', function () { fitFile.click(); });
    fitFile.addEventListener('change', function () {
      var file = fitFile.files && fitFile.files[0];
      fitFile.value = '';
      if (!file) return;
      $('fitError').hidden = true;
      if (file.size > 200000) { fit.fail('That file is too large. Paste the relevant part of the job description instead.'); return; }
      var reader = new FileReader();
      reader.onload = function () {
        var text = String(reader.result || '').trim();
        if (text.length > fitText.maxLength) { fit.fail('That file is longer than ' + fitText.maxLength.toLocaleString('en-US') + ' characters. Paste the relevant part instead.'); return; }
        fitText.value = text;
        fitText.dispatchEvent(new Event('input'));
      };
      reader.onerror = function () { fit.fail('That file could not be read. Paste the text instead.'); };
      reader.readAsText(file);
    });

    section.hidden = false;
    if (tocItem) tocItem.hidden = false;
    var nav = $('askNav');
    if (nav) nav.hidden = false;
    launcher.hidden = false;
    $('ctaFit').hidden = false;
    $('ctaAsk').hidden = false;
    // Let the table of contents pick up the new entry.
    dispatchEvent(new Event('resize'));
  }

  function showContact() {
    if (contactOn) return;
    var dialog = $('msgDialog'), mform = $('msgForm'), done = $('msgDone'), msgSend = $('msgSend'), err = $('msgError');
    var text = $('msgText'), count = $('msgCount'), cta = $('ctaMsg');
    if (!dialog || !mform || !cta) return;
    contactOn = true;
    wireDialog(dialog);

    function updateCount() { count.textContent = String(text.maxLength - text.value.length); }
    text.addEventListener('input', updateCount);

    function reset() {
      mform.reset();
      updateCount();
      err.hidden = true;
      mform.hidden = false;
      done.hidden = true;
    }
    cta.addEventListener('click', function () {
      if (!done.hidden) reset();
      openDialog(dialog, $('msgName'));
    });

    mform.addEventListener('submit', function (e) {
      e.preventDefault();
      if (msgSend.disabled) return;
      err.hidden = true;
      var payload = {
        name: $('msgName').value, email: $('msgEmail').value, topic: $('msgTopic').value,
        company: $('msgCompany').value, message: text.value, website: $('msgWebsite').value
      };
      msgSend.disabled = true;
      msgSend.textContent = 'Sending\u2026';
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 30000);

      fetch(endpoint + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal
      }).then(function (res) {
        if (!res.ok) return failure(res);
        $('msgDoneText').textContent = 'Thanks, ' + payload.name.trim().split(/\s+/)[0] + '. I\u2019ll reply to ' + payload.email.trim() + '.';
        mform.hidden = true;
        done.hidden = false;
        mform.reset();
        updateCount();
      }).catch(function (e2) {
        err.textContent = friendly(e2, 'Your message could not be sent right now. Please email ankit77parekh@gmail.com directly.');
        err.hidden = false;
      }).then(function () {
        clearTimeout(timer);
        msgSend.disabled = false;
        msgSend.textContent = 'Send Message';
      });
    });

    cta.hidden = false;
  }

  var healthCtrl = new AbortController();
  var healthTimer = setTimeout(function () { healthCtrl.abort(); }, 6000);
  fetch(endpoint + '/api/health', { cache: 'no-store', signal: healthCtrl.signal })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (j) {
      if (!j) return;
      if (j.ok === true) showAgent();
      if (j.contact === true) showContact();
    })
    .catch(function () { /* backend unreachable: leave everything hidden */ })
    .then(function () { clearTimeout(healthTimer); });
})();
