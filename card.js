/* Shared card rendering — used by app.js (the directory) and submit.js (live preview).
   Exposes window.ReferralCard. */

window.ReferralCard = (function () {
  'use strict';

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

  // Feedback goes on the small hint label, never on the code itself — the
  // code stays put so the chip can't change size or reflow the row.
  function wireCopy(chip, code, hintEl) {
    var original = hintEl.textContent;
    var timer;

    function reset() {
      hintEl.textContent = original;
      chip.classList.remove('copied');
    }

    chip.addEventListener('click', function () {
      copyText(code).then(function () {
        clearTimeout(timer);
        hintEl.textContent = 'Copied';
        chip.classList.add('copied');
        timer = setTimeout(reset, 1600);
      }).catch(function () {
        clearTimeout(timer);
        hintEl.textContent = 'Failed';
        timer = setTimeout(reset, 1600);
      });
    });
  }

  /* opts.inert — render the card without wiring the copy button, for previews. */
  function buildCard(entry, opts) {
    opts = opts || {};
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

    /* credit line — set on community submissions, absent on the owner's own */
    var credit = val(entry, 'submittedBy');
    if (credit) card.appendChild(el('p', 'credit', 'shared by ' + credit));

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
      chip.appendChild(el('span', 'code', code));
      var hint = el('span', 'hint', 'copy');
      chip.appendChild(hint);
      if (!opts.inert) wireCopy(chip, code, hint);
      actions.appendChild(chip);
    }

    if (!url && !code) {
      actions.appendChild(el('span', 'pending', 'Link coming soon'));
    }

    card.appendChild(actions);
    return card;
  }

  return { el: el, val: val, buildCard: buildCard, copyText: copyText };
})();
