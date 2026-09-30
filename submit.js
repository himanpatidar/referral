/* Submission form — validation and live card preview.
   The submit handler is deliberately stubbed: there is no backend yet, so
   nothing leaves the browser. Wire sendSubmission() to the API when it exists. */

(function () {
  'use strict';

  var buildCard = window.ReferralCard.buildCard;

  var form = document.getElementById('submit-form');
  var mount = document.getElementById('preview-mount');
  var statusEl = document.getElementById('form-status');
  var honeypot = document.getElementById('website');

  var FIELDS = ['app', 'category', 'url', 'code', 'reward', 'submittedBy'];

  function input(name) { return document.getElementById(name); }
  function wrapper(name) { return document.getElementById('f-' + name); }

  function readForm() {
    var out = {};
    FIELDS.forEach(function (name) { out[name] = input(name).value.trim(); });
    return out;
  }

  /* ---------- validation ---------- */

  function setError(name, message) {
    var w = wrapper(name);
    var slot = w.querySelector('.error-text');
    if (message) {
      w.classList.add('invalid');
      slot.textContent = message;
      input(name).setAttribute('aria-invalid', 'true');
    } else {
      w.classList.remove('invalid');
      slot.textContent = '';
      input(name).removeAttribute('aria-invalid');
    }
  }

  function clearErrors() { FIELDS.forEach(function (n) { setError(n, ''); }); }

  // Only http(s) — a javascript: or data: URL in a referral link is never legitimate.
  function badUrl(raw) {
    if (!raw) return '';
    var parsed;
    try { parsed = new URL(raw); } catch (e) { return 'That doesn’t look like a valid URL.'; }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return 'Only http and https links are accepted.';
    }
    if (parsed.protocol === 'http:') return 'Please use an https:// link.';
    return '';
  }

  function validate(data) {
    var errors = {};

    if (!data.app) errors.app = 'Required — which app is this for?';
    else if (data.app.length < 2) errors.app = 'That looks too short.';

    if (!data.category) errors.category = 'Pick a category.';

    var urlProblem = badUrl(data.url);
    if (urlProblem) errors.url = urlProblem;

    // The whole point of an entry is that it gives the visitor something to use.
    if (!data.url && !data.code) {
      errors.url = 'Give a link or a code — at least one is needed.';
      errors.code = 'Give a link or a code — at least one is needed.';
    }

    return errors;
  }

  /* ---------- preview ---------- */

  function renderPreview() {
    var data = readForm();
    var hasAnything = data.app || data.url || data.code || data.reward;

    mount.textContent = '';
    if (!hasAnything) {
      var empty = document.createElement('p');
      empty.className = 'state';
      empty.textContent = 'Start typing to see your card.';
      mount.appendChild(empty);
      return;
    }

    mount.appendChild(buildCard({
      app: data.app || 'Your app',
      category: data.category,
      reward: data.reward,
      url: badUrl(data.url) ? '' : data.url,
      code: data.code,
      submittedBy: data.submittedBy
    }, { inert: true }));
  }

  /* ---------- submit (stub) ---------- */

  function sendSubmission(data) {
    // TODO: POST to the submissions API once the backend exists. Until then the
    // form is intentionally inert — no endpoint, nothing stored, nothing published.
    console.info('Submission captured locally (not sent):', data);
    return Promise.reject(new Error('NO_BACKEND'));
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    clearErrors();
    statusEl.textContent = '';

    // A filled honeypot means a bot. Fail silently rather than teach it the rules.
    if (honeypot && honeypot.value !== '') return;

    var data = readForm();
    var errors = validate(data);
    var names = Object.keys(errors);

    if (names.length) {
      names.forEach(function (n) { setError(n, errors[n]); });
      input(names[0]).focus();
      statusEl.textContent = 'Please fix the highlighted fields.';
      return;
    }

    sendSubmission(data).then(function () {
      statusEl.textContent = 'Thanks — submitted for review.';
      form.reset();
      renderPreview();
    }).catch(function (err) {
      statusEl.textContent = err.message === 'NO_BACKEND'
        ? 'Submissions aren’t switched on yet — nothing was sent.'
        : 'Something went wrong. Please try again.';
    });
  });

  /* ---------- wiring ---------- */

  FIELDS.forEach(function (name) {
    input(name).addEventListener('input', function () {
      setError(name, '');
      renderPreview();
    });
    input(name).addEventListener('change', renderPreview);
  });

  renderPreview();
})();
