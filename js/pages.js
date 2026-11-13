/*
 * Platform pages: Dashboard, Models (filters + search), Providers, Pricing limits, API Keys.
 * All data comes from js/config.js (models, providers, pricing, token).
 */
(function (g) {
  'use strict';
  var cfg = g.NEXTVIDEO_CONFIG || {};
  var MODELS = cfg.models || [];
  var PROVIDERS = cfg.providers || {};
  var SYM = (g.NVToken && g.NVToken.symbol) || '$NEXT';
  var C = g.NVChains;
  var filter = { provider: 'all', type: 'all', q: '' };

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function prov(m) { return PROVIDERS[m.provider] || { name: m.provider, color: '#5b45f0' }; }
  function allTypes() {
    var out = [];
    MODELS.forEach(function (m) { (m.types || []).forEach(function (t) { if (out.indexOf(t) < 0) out.push(t); }); });
    return out;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Generated cover art (no third-party images): provider-tinted gradient, rings and the model id.
  function cover(m) {
    var c = prov(m).color, id = esc(m.id.length > 24 ? m.id.slice(0, 24) + '…' : m.id);
    var seed = 0; for (var i = 0; i < m.id.length; i++) seed = (seed * 31 + m.id.charCodeAt(i)) % 997;
    var cx = 250 + (seed % 30), cy = 58 + (seed % 20), F = 'font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif"';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">' +
      '<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b0d14"/><stop offset="1" stop-color="' + c + '" stop-opacity=".55"/></linearGradient>' +
      '<radialGradient id="r" cx="' + cx / 320 + '" cy="' + cy / 180 + '" r=".6"><stop offset="0" stop-color="' + c + '" stop-opacity=".9"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="320" height="180" fill="url(#b)"/><rect width="320" height="180" fill="url(#r)" opacity=".55"/>' +
      '<g fill="none" stroke="#fff" stroke-opacity=".16"><circle cx="' + cx + '" cy="' + cy + '" r="26"/><circle cx="' + cx + '" cy="' + cy + '" r="46"/><circle cx="' + cx + '" cy="' + cy + '" r="70"/></g>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="17" fill="#fff" fill-opacity=".14"/><path d="M' + (cx - 5) + ' ' + (cy - 8) + 'l13 8-13 8z" fill="#fff"/>' +
      '<text x="18" y="146" ' + F + ' font-size="17" font-weight="700" fill="#fff">' + id + '</text>' +
      '<text x="18" y="164" ' + F + ' font-size="10" fill="#fff" fill-opacity=".7">' + esc(prov(m).name) + ' · ' + esc((m.types || [])[0] || 'Video') + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function providerMark(p, size) {
    var s = el('span', 'nv-prov-mark', (p.name || '?').charAt(0));
    s.style.setProperty('--prov', p.color || '#5b45f0');
    if (size) { s.style.width = s.style.height = size + 'px'; s.style.fontSize = Math.round(size * 0.5) + 'px'; }
    return s;
  }

  function modelCard(m) {
    var a = el('article', 'nv-model-card');
    var img = el('img', 'nv-model-cover'); img.src = cover(m); img.alt = ''; img.loading = 'lazy';
    a.appendChild(img);
    var body = el('div', 'nv-model-body');
    var head = el('div', 'nv-model-head');
    head.appendChild(providerMark(prov(m)));
    head.appendChild(el('h3', '', m.name));
    body.appendChild(head);
    body.appendChild(el('p', 'nv-model-desc', m.description || ''));
    var meta = el('p', 'nv-model-meta', m.durations[0] + '–' + m.durations[1] + 's · ' + m.resolutions.join(' / '));
    body.appendChild(meta);
    var tags = el('div', 'nv-tags');
    (m.types || []).forEach(function (t) { tags.appendChild(el('span', 'nv-tag', t)); });
    body.appendChild(tags);
    var row = el('div', 'nv-model-actions');
    var tryBtn = el('button', 'btn btn-accent btn-small', 'Try in Video Studio'); tryBtn.type = 'button';
    tryBtn.addEventListener('click', function () { g.NVApp.setModel(m.id); });
    row.appendChild(tryBtn);
    row.appendChild(el('code', 'nv-model-id', m.id));
    body.appendChild(row);
    a.appendChild(body);
    return a;
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    $('dash-eyebrow').textContent = 'AI video studio · Paid with ' + SYM;
    var stats = $('dash-stats'); stats.innerHTML = '';
    var groups = C.groups(), live = groups.filter(function (x) { return x.ca; }).length;
    [
      [String(MODELS.length), 'Video models'],
      [String(Object.keys(PROVIDERS).length), 'Providers'],
      [String(C.active.length), C.active.length === 1 ? 'Network · ' + C.primary.name : 'Networks'],
      [live ? 'Live' : 'Soon', SYM + ' contract' + (groups.length > 1 ? 's' : '')]
    ].forEach(function (s) {
      var c = el('div', 'nv-stat');
      c.appendChild(el('strong', '', s[0])); c.appendChild(el('span', 'muted', s[1]));
      stats.appendChild(c);
    });
    var grid = $('dash-models'); grid.innerHTML = '';
    var pick = [cfg.defaultModel, 'wan3.0-video', 'dreamina-seedance-2-5-260628', 'kling-v3', 'viduq4-preview'];
    var seen = {}, list = [];
    pick.concat(MODELS.map(function (m) { return m.id; })).forEach(function (id) {
      var m = MODELS.filter(function (x) { return x.id === id; })[0];
      if (m && !seen[id] && list.length < 4) { seen[id] = 1; list.push(m); }
    });
    list.forEach(function (m) { grid.appendChild(modelCard(m)); });
  }

  // ---------- Models ----------
  function chip(label, active, onClick, dot) {
    var b = el('button', 'nv-chip' + (active ? ' active' : ''));
    b.type = 'button';
    if (dot) { var d = el('span', 'nv-chip-color'); d.style.setProperty('--prov', dot); b.appendChild(d); }
    b.appendChild(el('span', '', label));
    b.addEventListener('click', onClick);
    return b;
  }
  function renderFilters() {
    var pv = $('filter-providers'); pv.innerHTML = '';
    pv.appendChild(chip('All', filter.provider === 'all', function () { filter.provider = 'all'; renderModels(); }));
    Object.keys(PROVIDERS).forEach(function (k) {
      pv.appendChild(chip(PROVIDERS[k].name, filter.provider === k, function () { filter.provider = k; renderModels(); }, PROVIDERS[k].color));
    });
    var ty = $('filter-types'); ty.innerHTML = '';
    ty.appendChild(chip('All', filter.type === 'all', function () { filter.type = 'all'; renderModels(); }));
    allTypes().forEach(function (t) {
      ty.appendChild(chip(t, filter.type === t, function () { filter.type = t; renderModels(); }));
    });
  }
  function renderModels() {
    renderFilters();
    var q = filter.q.toLowerCase();
    var list = MODELS.filter(function (m) {
      if (filter.provider !== 'all' && m.provider !== filter.provider) return false;
      if (filter.type !== 'all' && (m.types || []).indexOf(filter.type) < 0) return false;
      if (q && (m.name + ' ' + m.id + ' ' + prov(m).name + ' ' + (m.description || '')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    $('models-count').textContent = list.length + ' model' + (list.length === 1 ? '' : 's');
    var grid = $('models-grid'); grid.innerHTML = '';
    if (!list.length) { grid.appendChild(el('p', 'empty', 'No models match these filters.')); return; }
    list.forEach(function (m) { grid.appendChild(modelCard(m)); });
  }

  // ---------- Providers ----------
  function renderProviders() {
    var grid = $('providers-grid'); grid.innerHTML = '';
    Object.keys(PROVIDERS).forEach(function (k) {
      var p = PROVIDERS[k], ms = MODELS.filter(function (m) { return m.provider === k; });
      var card = el('article', 'nv-provider-card');
      card.style.setProperty('--prov', p.color);
      var head = el('div', 'nv-model-head');
      head.appendChild(providerMark(p, 40));
      var t = el('div', 'nv-provider-id');
      t.appendChild(el('h3', '', p.name));
      t.appendChild(el('span', 'muted small', ms.length + ' model' + (ms.length === 1 ? '' : 's')));
      head.appendChild(t);
      card.appendChild(head);
      if (p.tagline) card.appendChild(el('p', 'muted', p.tagline));
      var ul = el('ul', 'nv-provider-models');
      ms.forEach(function (m) {
        var li = el('li');
        li.appendChild(el('span', '', m.name));
        li.appendChild(el('span', 'muted small', m.durations[0] + '–' + m.durations[1] + 's · ' + m.resolutions[m.resolutions.length - 1]));
        ul.appendChild(li);
      });
      card.appendChild(ul);
      var b = el('button', 'btn btn-small', 'View models'); b.type = 'button';
      b.addEventListener('click', function () { filter.provider = k; filter.type = 'all'; g.NVRouter.go('models'); renderModels(); });
      card.appendChild(b);
      grid.appendChild(card);
    });
  }

  // ---------- Pricing ----------
  function renderPricingPage() {
    $('pricing-title').textContent = SYM + ' per second';
    $('pricing-desc').textContent = 'Every video is paid with ' + SYM + '. Price depends on resolution and length.';
    var t = $('limits-table'); t.innerHTML = '';
    var hr = el('tr');
    ['Model', 'Provider', 'Duration', 'Resolutions', 'Aspect ratios'].forEach(function (h) { hr.appendChild(el('th', '', h)); });
    var thead = el('thead'); thead.appendChild(hr); t.appendChild(thead);
    var tb = el('tbody');
    MODELS.forEach(function (m) {
      var tr = el('tr');
      tr.appendChild(el('td', '', m.name));
      tr.appendChild(el('td', '', prov(m).name));
      tr.appendChild(el('td', 'num', m.durations[0] + '–' + m.durations[1] + 's'));
      tr.appendChild(el('td', '', m.resolutions.join(', ')));
      tr.appendChild(el('td', '', m.ratios.join(', ')));
      tb.appendChild(tr);
    });
    t.appendChild(tb);
  }

  // ---------- API Keys ----------
  function renderKeys() {
    var ol = $('keys-steps'); ol.innerHTML = '';
    [
      ['Connect your wallet', 'Use the wallet that holds ' + SYM + '.'],
      ['Create a key', 'Each key is shown once — store it somewhere safe.'],
      ['Call the API', 'Requests made with the key are paid in ' + SYM + ' from that wallet.']
    ].forEach(function (s, i) {
      var li = el('li', 'nv-step');
      li.appendChild(el('span', 'nv-step-num', String(i + 1)));
      var tx = el('div', 'nv-step-text'); tx.appendChild(el('strong', '', s[0])); tx.appendChild(el('span', 'muted', s[1]));
      li.appendChild(tx); ol.appendChild(li);
    });
    $('key-create').addEventListener('click', function () {
      var box = $('keys-gate'); box.innerHTML = '';
      var api = (cfg.api && cfg.api.baseUrl) || '';
      if (!api || g.NVWallet.holderStatus() !== 'holder') { box.appendChild(g.NVWalletUI.gate()); return; }
      box.appendChild(el('p', 'error', 'Key creation handler is not implemented yet.'));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderDashboard();
    renderModels();
    renderProviders();
    renderPricingPage();
    renderKeys();
    $('models-search').addEventListener('input', function () { filter.q = this.value.trim(); renderModels(); });
  });
})(window);
