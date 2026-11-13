/*
 * Compare models tab: one prompt → 2–3 models side by side.
 * Settings snap to each model's own limits. Submitting requires a $NEXT holder wallet + backend.
 */
(function (g) {
  'use strict';
  var cfg = g.NEXTVIDEO_CONFIG || {};
  var MIN = 2, MAX = 3;
  var LS = 'nv_cmp';

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function models() { return (g.NVApp && g.NVApp.models) || []; }
  function selected() {
    var ids = [].map.call(document.querySelectorAll('#cmp-models input:checked'), function (i) { return i.value; });
    return models().filter(function (m) { return ids.indexOf(m.id) >= 0; });
  }
  function union(list, key) {
    var out = [];
    list.forEach(function (m) { m[key].forEach(function (v) { if (out.indexOf(v) < 0) out.push(v); }); });
    return out;
  }
  function fill(sel, values) {
    var keep = sel.value; sel.innerHTML = '';
    values.forEach(function (v) { var o = el('option', '', v); o.value = v; sel.appendChild(o); });
    if (values.indexOf(keep) >= 0) sel.value = keep;
    else if (values.indexOf('720p') >= 0) sel.value = '720p';
  }
  // Snap the shared settings to one model.
  function snap(m) {
    var d = parseInt($('cmp-duration').value, 10) || 5, res = $('cmp-res').value, ratio = $('cmp-ratio').value, notes = [];
    var dd = Math.min(m.durations[1], Math.max(m.durations[0], d));
    if (dd !== d) notes.push(dd + 's');
    var rr = m.resolutions.indexOf(res) >= 0 ? res : (m.resolutions.indexOf('720p') >= 0 ? '720p' : m.resolutions[0]);
    if (rr !== res) notes.push(rr);
    var ra = m.ratios.indexOf(ratio) >= 0 ? ratio : m.ratios[0];
    if (ra !== ratio) notes.push(ra);
    return { duration: dd, resolution: rr, ratio: ra, adjusted: notes };
  }
  function cost(m, s) {
    var per = (cfg.pricing || {})[s.resolution];
    return per == null || per === '' ? null : Math.round(per * s.duration * 1e6) / 1e6;
  }

  function refresh() {
    var sel = selected();
    var boxes = document.querySelectorAll('#cmp-models input');
    [].forEach.call(boxes, function (b) { b.disabled = !b.checked && sel.length >= MAX; });
    var base = sel.length ? sel : models();
    fill($('cmp-res'), union(base, 'resolutions'));
    fill($('cmp-ratio'), union(base, 'ratios'));
    var notice = [], total = 0, priced = true;
    sel.forEach(function (m) {
      var s = snap(m);
      if (s.adjusted.length) notice.push(m.name + ' supports ' + m.durations[0] + '–' + m.durations[1] + 's, ' + m.resolutions.join('/') + ' — will use ' + s.adjusted.join(' · ') + '.');
      var c = cost(m, s); if (c == null) priced = false; else total += c;
    });
    $('cmp-notice').textContent = notice.join(' ');
    $('cmp-notice').hidden = !notice.length;
    var sym = (g.NVToken && g.NVToken.symbol) || '$NEXT';
    $('cmp-cost').textContent = sel.length < MIN ? 'Select 2–3 models.' :
      (priced && sel.length ? 'Combined estimate: ' + Math.round(total * 1e6) / 1e6 + ' ' + sym + ' (' + sel.length + ' models)' : sel.length + ' models selected.');
    try { localStorage.setItem(LS, JSON.stringify(sel.map(function (m) { return m.id; }))); } catch (e) { /* private mode */ }
    renderTable(sel);
  }

  function renderTable(sel) {
    var box = $('cmp-result');
    if (box.querySelector('.nv-gate')) return;
    box.innerHTML = '';
    if (!sel.length) { box.appendChild(el('p', 'empty', 'Pick 2–3 models to see them side by side here.')); return; }
    var grid = el('div', 'nv-cmp-grid');
    sel.forEach(function (m) {
      var s = snap(m), c = cost(m, s);
      var card = el('div', 'nv-cmp-card');
      card.appendChild(el('strong', '', m.name));
      card.appendChild(el('span', 'muted small', s.duration + 's · ' + s.resolution + ' · ' + s.ratio + (c != null ? ' · ' + c + ' ' + g.NVToken.symbol : '')));
      var frame = el('div', 'nv-cmp-frame', 'Pending');
      card.appendChild(frame);
      grid.appendChild(card);
    });
    box.appendChild(grid);
  }

  function start() {
    var err = $('cmp-error'); err.hidden = true;
    var sel = selected();
    if (!$('cmp-prompt').value.trim()) { err.textContent = 'Write a shared prompt first.'; err.hidden = false; return; }
    if (sel.length < MIN) { err.textContent = 'Select at least ' + MIN + ' models to compare.'; err.hidden = false; return; }
    var api = (cfg.api && cfg.api.baseUrl) || '';
    if (!api || g.NVWallet.holderStatus() !== 'holder') {
      var box = $('cmp-result'); box.innerHTML = ''; box.appendChild(g.NVWalletUI.gate());
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    err.textContent = 'Compare submit handler is not implemented yet.'; err.hidden = false;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var list = $('cmp-models'), saved;
    try { saved = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { saved = null; }
    var pre = saved || models().slice(0, 2).map(function (m) { return m.id; });
    models().forEach(function (m) {
      var lab = el('label', 'check-item');
      var cb = el('input'); cb.type = 'checkbox'; cb.value = m.id; cb.checked = pre.indexOf(m.id) >= 0;
      var t = el('span', 'check-text');
      t.appendChild(el('span', 'model-name-row', m.name));
      t.appendChild(el('span', 'model-limits', m.durations[0] + '–' + m.durations[1] + 's · ' + m.resolutions.join('/')));
      lab.appendChild(cb); lab.appendChild(t);
      cb.addEventListener('change', function () { var b = $('cmp-result').querySelector('.nv-gate'); if (b) b.remove(); refresh(); });
      list.appendChild(lab);
    });
    ['cmp-duration', 'cmp-res', 'cmp-ratio'].forEach(function (id) { $(id).addEventListener('change', refresh); });
    $('cmp-from-gen').addEventListener('click', function () { $('cmp-prompt').value = g.NVApp.prompt(); });
    $('cmp-start').addEventListener('click', start);
    if (!$('cmp-prompt').value) $('cmp-prompt').value = g.NVApp.prompt();
    refresh();
  });
})(window);
