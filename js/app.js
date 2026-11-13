/*
 * NextVideo studio UI: tabs, presets, model settings, first frame, history, chat.
 * Generation is wired to config.api.baseUrl; while it is empty the UI never submits jobs.
 */
(function (g) {
  'use strict';
  var cfg = g.NEXTVIDEO_CONFIG || {};
  var MODELS = cfg.models || [];
  var PRESETS = cfg.presets || [];
  var API = (cfg.api && cfg.api.baseUrl) || '';
  var SYM = (g.NVToken && g.NVToken.symbol) || '$NEXT';
  var LS = { tab: 'nv_tab', prompt: 'nv_prompt', model: 'nv_model', tasks: 'nv_tasks' };

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function toast(m) { if (g.NVToken) g.NVToken.toast(m); }
  function status(m) { $('statusbar').textContent = m; }

  // ---------- tabs ----------
  var TABS = ['chat', 'generate', 'tasks', 'token'];
  function showTab(name) {
    if (TABS.indexOf(name) < 0) name = 'generate';
    document.querySelectorAll('.tabs [data-tab]').forEach(function (b) {
      var on = b.dataset.tab === name;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    TABS.forEach(function (t) { $('panel-' + t).hidden = t !== name; });
    store(LS.tab, name);
  }
  document.querySelectorAll('.tabs [data-tab]').forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.dataset.tab); });
  });

  // ---------- model + params ----------
  function model() {
    var id = $('gen-model').value;
    for (var i = 0; i < MODELS.length; i++) if (MODELS[i].id === id) return MODELS[i];
    return MODELS[0];
  }
  function fillSelect(sel, values, keep) {
    sel.innerHTML = '';
    values.forEach(function (v) { var o = el('option', '', v); o.value = v; sel.appendChild(o); });
    if (keep && values.indexOf(keep) >= 0) sel.value = keep;
  }
  function applyModel(keepRes, keepRatio) {
    var m = model(); if (!m) return;
    fillSelect($('gen-res'), m.resolutions, keepRes || '720p');
    fillSelect($('gen-ratio'), m.ratios, keepRatio || '16:9');
    var d = $('gen-duration');
    d.min = m.durations[0]; d.max = m.durations[1];
    clampDuration();
    $('gen-model-desc').textContent = m.description || '';
    updateCost();
  }
  function clampDuration() {
    var d = $('gen-duration'), m = model(); if (!m) return;
    var v = parseInt(d.value, 10);
    if (isNaN(v)) v = m.durations[0];
    d.value = Math.min(m.durations[1], Math.max(m.durations[0], v));
  }
  function updateCost() {
    var p = cfg.pricing || {}, res = $('gen-res').value, per = p[res];
    var c = $('gen-cost');
    if (per == null || per === '') { c.textContent = ''; return; }
    var secs = parseInt($('gen-duration').value, 10) || 0;
    var total = Math.round(per * secs * 1e6) / 1e6;
    c.textContent = 'Estimated cost: ' + total + ' ' + SYM + ' (' + secs + 's · ' + res + ')';
  }

  function initModels() {
    var sel = $('gen-model');
    MODELS.forEach(function (m) { var o = el('option', '', m.name); o.value = m.id; sel.appendChild(o); });
    var saved = load(LS.model);
    sel.value = (saved && MODELS.some(function (m) { return m.id === saved; })) ? saved : (cfg.defaultModel || (MODELS[0] && MODELS[0].id));
    sel.addEventListener('change', function () {
      store(LS.model, sel.value);
      applyModel($('gen-res').value, $('gen-ratio').value);
    });
    $('gen-duration').addEventListener('change', function () { clampDuration(); updateCost(); });
    $('gen-res').addEventListener('change', updateCost);
    applyModel();
  }

  // ---------- presets ----------
  var activePreset = null;
  function previewHost() { return g.matchMedia('(min-width: 1000px)').matches ? $('gen-preview-desktop') : $('gen-preview-mobile'); }
  function placePreview() {
    var box = $('gen-preset-preview'), host = previewHost();
    if (box.parentNode !== host) host.appendChild(box);
  }
  function showPreview(p) {
    var box = $('gen-preset-preview');
    box.innerHTML = '';
    var wrap = el('div', 'preset-sample');
    wrap.appendChild(el('p', 'preset-sample-label', 'Example preview · ' + p.label));
    var v = el('video', 'preset-sample-video');
    v.src = p.video; v.poster = p.poster; v.muted = true; v.loop = true; v.autoplay = true;
    v.setAttribute('playsinline', ''); v.setAttribute('aria-label', 'Example preview');
    wrap.appendChild(v);
    wrap.appendChild(el('p', 'preset-sample-note muted small', 'Sample only — click Generate video for your own clip.'));
    box.appendChild(wrap);
    box.hidden = false;
    placePreview();
  }
  function applyPreset(p) {
    activePreset = p.id;
    document.querySelectorAll('#gen-example-chips .example-preset').forEach(function (b) {
      b.classList.toggle('active', b.dataset.id === p.id);
    });
    $('gen-prompt').value = p.prompt;
    store(LS.prompt, p.prompt);
    var m = model();
    if (m) {
      if (m.resolutions.indexOf(p.resolution) >= 0) $('gen-res').value = p.resolution;
      if (m.ratios.indexOf(p.ratio) >= 0) $('gen-ratio').value = p.ratio;
      $('gen-duration').value = p.duration; clampDuration();
    }
    updateCost();
    showPreview(p);
    status('Preset loaded — edit it or generate as-is.');
  }
  function initPresets() {
    var box = $('gen-example-chips');
    PRESETS.forEach(function (p) {
      var b = el('button', 'example-chip example-preset');
      b.type = 'button'; b.dataset.id = p.id; b.title = p.blurb || p.label;
      b.appendChild(el('span', 'chip-title', p.label));
      b.appendChild(el('span', 'preset-blurb', p.blurb || ''));
      b.addEventListener('click', function () { applyPreset(p); });
      box.appendChild(b);
    });
    var saved = load(LS.prompt);
    var match = PRESETS.filter(function (p) { return p.prompt === saved; })[0];
    if (saved && !match) { $('gen-prompt').value = saved; }
    else if (PRESETS.length) applyPreset(match || PRESETS[0]);
    $('gen-prompt').addEventListener('input', function () {
      store(LS.prompt, $('gen-prompt').value);
      if (activePreset) {
        var p = PRESETS.filter(function (x) { return x.id === activePreset; })[0];
        if (p && p.prompt !== $('gen-prompt').value) {
          activePreset = null;
          document.querySelectorAll('#gen-example-chips .example-preset').forEach(function (b) { b.classList.remove('active'); });
        }
      }
    });
    g.matchMedia('(min-width: 1000px)').addEventListener('change', placePreview);
  }

  // ---------- first frame ----------
  function initFirstFrame() {
    var file = $('gen-ff-file');
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast('Please choose an image file'); file.value = ''; return; }
      $('gen-ff-img').src = URL.createObjectURL(f);
      $('gen-ff-info').textContent = f.name + ' · ' + Math.round(f.size / 1024) + ' KB';
      $('gen-ff-preview').hidden = false;
    });
    $('gen-ff-remove').addEventListener('click', function () {
      file.value = ''; $('gen-ff-preview').hidden = true; $('gen-ff-img').removeAttribute('src');
    });
  }

  // ---------- generate ----------
  function showResult(node) { var r = $('gen-result'); r.innerHTML = ''; r.appendChild(node); }
  function notLive(where) {
    var box = el('div', 'nv-notice');
    box.appendChild(el('strong', '', 'Generation backend not connected yet'));
    box.appendChild(el('p', 'muted', where + ' Your prompt and settings are kept in this browser, and nothing was charged.'));
    var a = el('button', 'btn btn-small'); a.type = 'button'; a.textContent = 'Get ' + SYM + ' ready';
    a.addEventListener('click', function () { showTab('token'); });
    box.appendChild(a);
    return box;
  }
  function initGenerate() {
    $('gen-submit').addEventListener('click', function () {
      var err = $('gen-error');
      err.hidden = true;
      var prompt = $('gen-prompt').value.trim();
      if (!prompt) { err.textContent = 'Write a prompt or pick a preset first.'; err.hidden = false; return; }
      if (!API) {
        showResult(notLive('NextVideo is in preview — the Generate button will submit real jobs once the API goes live.'));
        status('Preview · generation backend not connected');
        $('progress-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      // Backend hook: submit { model, prompt, duration, resolution, ratio } to API once it exists.
      err.textContent = 'Backend is configured but the submit handler is not implemented yet.';
      err.hidden = false;
    });
  }

  // ---------- history ----------
  function tasks() { try { return JSON.parse(load(LS.tasks) || '[]'); } catch (e) { return []; } }
  function renderTasks() {
    var list = $('tasks-list'), all = tasks();
    list.innerHTML = '';
    if (!all.length) { list.appendChild(el('p', 'empty', 'No jobs yet. Jobs you submit in Generate will appear here.')); return; }
    all.forEach(function (t) {
      var c = el('div', 'task');
      var h = el('div', 'task-head'); h.appendChild(el('span', 'task-title', t.model || 'Video')); h.appendChild(el('span', 'muted small', t.status || ''));
      c.appendChild(h);
      if (t.prompt) c.appendChild(el('p', 'task-prompt', t.prompt));
      var id = el('div', 'task-id'); id.appendChild(el('code', '', t.id)); c.appendChild(id);
      list.appendChild(c);
    });
  }
  function initTasks() {
    renderTasks();
    $('tasks-copy').addEventListener('click', function () {
      var ids = tasks().map(function (t) { return t.id; });
      if (!ids.length) { toast('No job IDs to copy'); return; }
      g.NVToken.copyText(ids.join('\n')).then(function () { toast('Job IDs copied'); });
    });
    $('tasks-clear').addEventListener('click', function () {
      store(LS.tasks, JSON.stringify(tasks().filter(function (t) { return t.status !== 'done' && t.status !== 'failed'; })));
      renderTasks();
    });
    $('manual-btn').addEventListener('click', function () {
      var e = $('manual-error'), id = $('manual-id').value.trim();
      e.hidden = false;
      e.textContent = !id ? 'Paste a job ID first.' : (!API ? 'Job lookup opens when the generation backend goes live.' : 'Lookup handler not implemented yet.');
    });
  }

  // ---------- chat ----------
  function bubble(role, text) {
    var row = el('div', 'chat-row chat-row--' + role);
    if (role === 'assistant') { var av = el('span', 'chat-avatar'); var i = el('img'); i.src = 'assets/logo.svg'; i.alt = ''; av.appendChild(i); row.appendChild(av); }
    row.appendChild(el('div', 'chat-bubble chat-bubble--' + role, text));
    $('chat-thread').appendChild(row);
    return row;
  }
  function chatGreet() {
    $('chat-thread').innerHTML = '';
    var r = bubble('assistant', "Hi! Tell me what you want to film and we'll shape the shot together. Or start from a preset:");
    var chips = el('div', 'nv-chat-chips');
    PRESETS.forEach(function (p) {
      var b = el('button', 'example-chip'); b.type = 'button'; b.textContent = p.label;
      b.addEventListener('click', function () { applyPreset(p); showTab('generate'); });
      chips.appendChild(b);
    });
    r.querySelector('.chat-bubble').appendChild(chips);
  }
  function initChat() {
    chatGreet();
    $('chat-reset').addEventListener('click', chatGreet);
    function send() {
      var t = $('chat-input').value.trim(); if (!t) return;
      bubble('user', t);
      $('chat-input').value = '';
      var r = bubble('assistant', API ? 'Chat handler not implemented yet.' :
        'The chat assistant goes live together with the generation backend. You can already send this idea to Generate and refine it there.');
      if (!API) {
        var b = el('button', 'btn btn-small nv-chat-use'); b.type = 'button'; b.textContent = 'Use in Generate';
        b.addEventListener('click', function () {
          $('gen-prompt').value = t; store(LS.prompt, t); activePreset = null;
          document.querySelectorAll('#gen-example-chips .example-preset').forEach(function (x) { x.classList.remove('active'); });
          $('gen-preset-preview').hidden = true;
          showTab('generate');
        });
        r.querySelector('.chat-bubble').appendChild(b);
      }
    }
    $('chat-send').addEventListener('click', send);
    $('chat-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); }
    });
  }

  // ---------- boot ----------
  g.NVApp = { showTab: showTab };
  document.addEventListener('DOMContentLoaded', function () {
    initModels();
    initPresets();
    initFirstFrame();
    initGenerate();
    initTasks();
    initChat();
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    showTab(load(LS.tab) || 'generate');
    status(API ? 'Ready' : 'Preview · generation backend not connected yet');
  });
})(window);
