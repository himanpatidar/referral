/* Referral directory — fetches links.json, renders grouped cards, live search.
   Card rendering lives in card.js (shared with the submit page). */

(function () {
  'use strict';

  var resultsEl = document.getElementById('results');
  var searchEl = document.getElementById('search');
  var countEl = document.getElementById('count');
  var updatedEl = document.getElementById('updated');
  var bannerEl = document.getElementById('banner');

  var allLinks = [];

  var el = window.ReferralCard.el;
  var val = window.ReferralCard.val;
  var buildCard = window.ReferralCard.buildCard;

  function showState(message, isError) {
    resultsEl.textContent = '';
    resultsEl.appendChild(el('p', 'state' + (isError ? ' error' : ''), message));
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
      if (data && typeof data.note === 'string' && data.note.trim() !== '') {
        var strong = el('strong', null, 'Heads up:');
        bannerEl.appendChild(strong);
        bannerEl.appendChild(el('span', null, ' ' + data.note.trim()));
        bannerEl.hidden = false;
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
