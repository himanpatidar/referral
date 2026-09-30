/* Referral links — fetches links.json, renders grouped cards, live search. */

(function () {
  'use strict';

  var resultsEl = document.getElementById('results');
  var searchEl = document.getElementById('search');
  var countEl = document.getElementById('count');
  var updatedEl = document.getElementById('updated');

  var allLinks = [];

  /* ---------- helpers ---------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null && text !== '') node.textContent = text;
    return node;
  }

  // Treat missing/blank fields as absent so cards render only what exists.
  function val(entry, key) {
    var v = entry[key];
    return typeof v === 'string' && v.trim() !== '' ? v.trim() : '';
  }

  function showState(message, isError) {
    resultsEl.textContent = '';
    var p = el('p', 'state' + (isError ? ' error' : ''), message);
    resultsEl.appendChild(p);
  }

  /* ---------- clipboard ---------- */

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for non-secure contexts / older browsers.
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copy failed'));
    });
  }

  function wireCopy(chip, code, labelEl) {
    var original = labelEl.textContent;
    var timer;
    chip.addEventListener('click', function () {
      copyText(code).then(function () {
        clearTimeout(timer);
        labelEl.textContent = 'Copied';
        chip.classList.add('copied');
        timer = setTimeout(function () {
          labelEl.textContent = original;
          chip.classList.remove('copied');
        }, 1600);
      }).catch(function () {
        clearTimeout(timer);
        labelEl.textContent = 'Press ⌘C';
        timer = setTimeout(function () { labelEl.textContent = original; }, 1600);
      });
    });
  }

  /* ---------- card ---------- */

  function buildCard(entry) {
    var app = val(entry, 'app') || 'Untitled';
    var accent = val(entry, 'accent');
    var url = val(entry, 'url');
    var code = val(entry, 'code');

    var card = el('article', 'card');
    if (accent) card.style.setProperty('--accent', accent);

    /* head: logo + name */
    var head = el('div', 'card-head');
    var logo = el('div', 'logo');
    var logoSrc = val(entry, 'logo');
    if (logoSrc) {
      var img = el('img');
      img.src = logoSrc;
      img.alt = '';
      // If the file is missing, fall back to the monogram.
      img.addEventListener('error', function () {
        logo.textContent = app.charAt(0).toUpperCase();
      });
      logo.appendChild(img);
    } else {
      logo.textContent = app.charAt(0).toUpperCase();
    }
    head.appendChild(logo);

    var title = el('div', 'card-title');
    title.appendChild(el('div', 'app', app));
    var tagline = val(entry, 'tagline');
    if (tagline) title.appendChild(el('div', 'tagline', tagline));
    head.appendChild(title);
    card.appendChild(head);

    /* body */
    var reward = val(entry, 'reward');
    if (reward) card.appendChild(el('p', 'reward', reward));

    var note = val(entry, 'note');
    if (note) card.appendChild(el('p', 'note', note));

    /* actions */
    var actions = el('div', 'actions');

    if (url) {
      var link = el('a', 'btn', 'Open link');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      actions.appendChild(link);
    }

    if (code) {
      var chip = el('button', 'code-chip');
      chip.type = 'button';
      chip.setAttribute('aria-label', 'Copy referral code for ' + app);
      var codeLabel = el('span', null, code);
      chip.appendChild(codeLabel);
      chip.appendChild(el('span', 'hint', 'copy'));
      wireCopy(chip, code, codeLabel);
      actions.appendChild(chip);
    }

    if (!url && !code) {
      actions.appendChild(el('span', 'pending', 'Link coming soon'));
    }

    card.appendChild(actions);
    return card;
  }

  /* ---------- render ---------- */

  function matches(entry, query) {
    if (!query) return true;
    var haystack = [
      val(entry, 'app'),
      val(entry, 'category'),
      val(entry, 'tagline'),
      val(entry, 'reward')
    ].join(' ').toLowerCase();
    return haystack.indexOf(query) !== -1;
  }

  function render(query) {
    var q = (query || '').trim().toLowerCase();
    var visible = allLinks.filter(function (entry) { return matches(entry, q); });

    countEl.textContent = visible.length
      ? visible.length + (visible.length === 1 ? ' referral' : ' referrals')
      : '';

    if (!visible.length) {
      showState(q ? 'No referrals match “' + query.trim() + '”.' : 'No referrals yet.');
      return;
    }

    // Group by category, preserving first-seen order from links.json.
    var order = [];
    var groups = {};
    visible.forEach(function (entry) {
      var cat = val(entry, 'category') || 'Other';
      if (!groups[cat]) { groups[cat] = []; order.push(cat); }
      groups[cat].push(entry);
    });

    var frag = document.createDocumentFragment();
    order.forEach(function (cat) {
      var section = el('section', 'category');
      section.appendChild(el('h2', null, cat));
      var grid = el('div', 'grid');
      groups[cat].forEach(function (entry) { grid.appendChild(buildCard(entry)); });
      section.appendChild(grid);
      frag.appendChild(section);
    });

    resultsEl.textContent = '';
    resultsEl.appendChild(frag);
  }

  /* ---------- load ---------- */

  fetch('links.json', { cache: 'no-cache' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      allLinks = Array.isArray(data && data.links) ? data.links : [];
      if (data && data.updated) {
        updatedEl.textContent = 'Updated ' + data.updated;
      }
      render('');
      searchEl.addEventListener('input', function () { render(searchEl.value); });
    })
    .catch(function (err) {
      showState('Could not load referrals (' + err.message + ').', true);
      countEl.textContent = '';
      // fetch() is blocked on file:// — serve the folder over HTTP to test locally.
      console.error('Failed to load links.json:', err);
    });
})();
