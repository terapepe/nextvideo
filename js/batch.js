/*
 * Batch import tab: Excel / CSV → task preview table.
 * Header names follow the desktop app (English or Chinese). Nothing is submitted until Start,
 * and Start requires a $NEXT holder wallet + backend.
 */
(function (g) {
  'use strict';
  var cfg = g.NEXTVIDEO_CONFIG || {};
  var LS = { rows: 'nv_batch_rows', src: 'nv_batch_src', chr: 'nv_batch_character', chain: 'nv_batch_chain', gen: 'nv_batch_par_gen', dl: 'nv_batch_par_dl' };
  var DEFAULTS = { duration: 5, resolution: '720p', ratio: '16:9' };

  // Accepted headers after normalize (spaces, _, -, brackets removed; lower case) — same as desktop batch_import.py.
  var H = {
    duration: ['时长', '时长秒', '视频时长', '视频时长秒', 'duration', 'durations', 'seconds', 'durationsec', 'durationsecs', 'durationseconds',
      'length', 'lengths', 'lengthsec', 'lengthseconds', 'videolength', 'cliplength', 'sec', 'secs', 'runtime', 'durations'],
    resolution: ['分辨率', 'resolution', 'size', 'res', 'videoresolution'],
    ratio: ['比例', '画面比例', 'ratio', 'aspectratio', 'aspect'],
    prompt: ['提示词', '完整提示词', '视频提示词', 'prompt', 'prompts', 'fullprompt', 'videoprompt', 'prompttext', 'videodescription'],
    title: ['名称', '标题', '视频标题', 'title', 'name', 'episode', 'episodetitle', 'cliptitle', 'clipname', 'videotitle', 'videoname', 'scene'],
    model: ['模型', 'model', 'models', 'videomodel', 'modelid', 'modelname']
  };

  var rows = [];
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function save(k, v) { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) { /* private mode */ } }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function normalize(h) { return String(h || '').toLowerCase().replace(/[\s_\-()（）\[\]【】]/g, ''); }
  function kindOf(h) {
    var v = normalize(h);
    if (H.prompt.indexOf(v) >= 0 || (v.indexOf('prompt') >= 0 && (v.indexOf('完整') >= 0 || v.indexOf('wan') >= 0))) return 'prompt';
    for (var k in H) if (H[k].indexOf(v) >= 0) return k;
    if (v.slice(-5) === 'model' || v.indexOf('model') === 0) return 'model';
    return null;
  }
  function defaultModel() {
    var ms = g.NVApp.models;
    return ms.filter(function (m) { return m.id === 'wan3.0-video'; })[0] || g.NVApp.findModel(cfg.defaultModel) || ms[0];
  }

  function buildRows(table) {
    var head = -1, map = {};
    for (var i = 0; i < Math.min(table.length, 10); i++) {
      var m = {};
      (table[i] || []).forEach(function (c, j) { var k = kindOf(c); if (k && m[k] == null) m[k] = j; });
      if (m.prompt != null) { head = i; map = m; break; }
    }
    if (head < 0) throw new Error('No Prompt column found. Columns: Duration (s), Resolution, Prompt. Optional: Title, Aspect ratio, Model.');
    var out = [], skipped = [];
    for (var r = head + 1; r < table.length; r++) {
      var line = table[r] || [], get = function (k) { return map[k] == null ? '' : String(line[map[k]] == null ? '' : line[map[k]]).trim(); };
      if (!line.some(function (c) { return String(c || '').trim(); })) continue;
      var prompt = get('prompt');
      if (!prompt) { skipped.push(r + 1); continue; }
      var notes = [];
      var model = g.NVApp.findModel(get('model'));
      if (get('model') && !model) notes.push('Unknown model “' + get('model') + '”, using default');
      model = model || defaultModel();
      var det = g.NVApp.detect(prompt);
      var dur = parseInt(get('duration'), 10) || det.duration || DEFAULTS.duration;
      var dClamp = Math.min(model.durations[1], Math.max(model.durations[0], dur));
      if (dClamp !== dur) notes.push(dur + 's → ' + dClamp + 's');
      var res = (get('resolution') || DEFAULTS.resolution).toLowerCase();
      if (model.resolutions.indexOf(res) < 0) { var nr = model.resolutions.indexOf('720p') >= 0 ? '720p' : model.resolutions[0]; notes.push(res + ' → ' + nr); res = nr; }
      var ratio = get('ratio') || det.ratio || DEFAULTS.ratio;
      if (model.ratios.indexOf(ratio) < 0) { notes.push(ratio + ' → ' + model.ratios[0]); ratio = model.ratios[0]; }
      out.push({ row: r + 1, title: get('title'), prompt: prompt, duration: dClamp, resolution: res, ratio: ratio,
        model: model.id, modelName: model.name, status: 'Queued', taskId: '', notes: notes.join('; ') });
    }
    return { rows: out, skipped: skipped };
  }

  function finalPrompt(r) {
    var ch = $('batch-character').value.trim();
    return ch ? ch + '\n\n' + r.prompt : r.prompt;
  }

  function render() {
    var body = $('batch-rows'); body.innerHTML = '';
    if (!rows.length) {
      var tr = el('tr'), td = el('td', 'nv-table-empty', 'Import a spreadsheet to preview it. Nothing is submitted or charged until you click Start.');
      td.colSpan = 9; tr.appendChild(td); body.appendChild(tr);
      $('batch-summary').textContent = '';
      return;
    }
    rows.forEach(function (r, i) {
      var tr = el('tr');
      var cb = el('input'); cb.type = 'checkbox'; cb.dataset.i = i; cb.setAttribute('aria-label', 'Select row ' + r.row);
      var c0 = el('td'); c0.appendChild(cb); tr.appendChild(c0);
      tr.appendChild(el('td', 'num', String(r.row)));
      var tt = el('td', 'nv-cell-title'); tt.appendChild(el('strong', '', r.title || '—'));
      var pp = el('span', 'nv-cell-prompt', finalPrompt(r)); pp.title = finalPrompt(r); tt.appendChild(pp);
      if (r.notes) tt.appendChild(el('span', 'nv-cell-note', r.notes));
      tr.appendChild(tt);
      tr.appendChild(el('td', 'num', String(r.duration)));
      tr.appendChild(el('td', '', r.resolution.toUpperCase()));
      tr.appendChild(el('td', '', r.ratio));
      tr.appendChild(el('td', '', r.modelName));
      tr.appendChild(el('td', '', r.status));
      tr.appendChild(el('td', 'mono', r.taskId || ''));
      body.appendChild(tr);
    });
    var total = rows.reduce(function (a, r) { return a + r.duration; }, 0);
    var per = cfg.pricing || {}, priced = rows.every(function (r) { return per[r.resolution] != null && per[r.resolution] !== ''; });
    var est = priced ? ' · Estimate ' + Math.round(rows.reduce(function (a, r) { return a + per[r.resolution] * r.duration; }, 0) * 1e6) / 1e6 + ' ' + g.NVToken.symbol : '';
    $('batch-summary').textContent = rows.length + ' rows · ' + total + ' s of video' + est;
  }

  function importFile(file) {
    var err = $('batch-import-error'); err.hidden = true;
    g.NVSheet.readFile(file).then(function (table) {
      var res = buildRows(table);
      if (!res.rows.length) throw new Error('No rows with a prompt were found.');
      rows = res.rows;
      var src = file.name + ' · ' + rows.length + ' row' + (rows.length === 1 ? '' : 's') +
        ($('batch-character').value.trim() ? ' · Character setting added to every prompt' : '') +
        (res.skipped.length ? ' · Skipped (no prompt): row ' + res.skipped.join(', ') : '');
      $('batch-source').textContent = src;
      save(LS.rows, rows); save(LS.src, src);
      var gate = $('batch-result').querySelector('.nv-gate'); if (gate) gate.remove();
      render();
      g.NVApp.status('Imported ' + rows.length + ' rows from ' + file.name);
    }).catch(function (e) {
      err.textContent = 'Import failed: ' + (e.message || e); err.hidden = false;
    }).then(function () { $('batch-file').value = ''; });
  }

  function exportCsv() {
    if (!rows.length) { g.NVToken.toast('Nothing to export yet'); return; }
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = [['Row', 'Title', 'Duration (s)', 'Resolution', 'Aspect ratio', 'Model', 'Status', 'Task ID', 'Notes', 'Prompt'].join(',')];
    rows.forEach(function (r) {
      lines.push([r.row, r.title, r.duration, r.resolution, r.ratio, r.model, r.status, r.taskId, r.notes, finalPrompt(r)].map(q).join(','));
    });
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = el('a'); a.href = URL.createObjectURL(blob); a.download = 'nextvideo-batch-results.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function start(onlySelected) {
    if (!rows.length) { g.NVToken.toast('Import a spreadsheet first'); return; }
    var pick = [].filter.call(document.querySelectorAll('#batch-rows input[type=checkbox]'), function (c) { return c.checked; });
    if (onlySelected && !pick.length) { g.NVToken.toast('Select at least one row'); return; }
    var api = (cfg.api && cfg.api.baseUrl) || '';
    if (!api || g.NVWallet.holderStatus() !== 'holder') {
      var box = $('batch-result'); box.innerHTML = ''; box.appendChild(g.NVWalletUI.gate());
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    g.NVToken.toast('Batch submit handler is not implemented yet');
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('batch-character').value = load(LS.chr) || '';
    $('batch-chain').checked = load(LS.chain) === '1';
    $('batch-par-gen').value = load(LS.gen) || 3;
    $('batch-par-dl').value = load(LS.dl) || 2;
    try { rows = JSON.parse(load(LS.rows) || '[]'); } catch (e) { rows = []; }
    if (load(LS.src)) $('batch-source').textContent = load(LS.src);
    render();

    $('batch-file').addEventListener('change', function () { var f = this.files && this.files[0]; if (f) importFile(f); });
    $('batch-character').addEventListener('input', function () { save(LS.chr, this.value); render(); });
    $('batch-chain').addEventListener('change', function () { save(LS.chain, this.checked ? '1' : '0'); });
    [['batch-par-gen', LS.gen, 8], ['batch-par-dl', LS.dl, 4]].forEach(function (x) {
      $(x[0]).addEventListener('change', function () {
        var v = Math.min(x[2], Math.max(1, parseInt(this.value, 10) || 1)); this.value = v; save(x[1], String(v));
      });
    });
    $('batch-all').addEventListener('change', function () {
      var on = this.checked;
      document.querySelectorAll('#batch-rows input[type=checkbox]').forEach(function (c) { c.checked = on; });
    });
    $('batch-start-all').addEventListener('click', function () { start(false); });
    $('batch-start-sel').addEventListener('click', function () { start(true); });
    $('batch-export').addEventListener('click', exportCsv);
    $('batch-clear').addEventListener('click', function () {
      rows = []; save(LS.rows, rows); save(LS.src, '');
      $('batch-source').textContent = 'Columns: Duration (s), Resolution, Prompt. Optional: Title, Aspect ratio, Model.';
      $('batch-result').innerHTML = ''; render();
    });
  });
})(window);
