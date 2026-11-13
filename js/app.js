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
  var TABS = ['generate', 'chat', 'compare', 'batch', 'tasks'];
  // Studio sub-tabs. 'token' (and other pages) go through the router.
  function showTab(name, stay) {
    if (name === 'token') { g.NVRouter.go('token'); return; }
    if (TABS.indexOf(name) < 0) name = 'generate';
    if (!stay) g.NVRouter.go('studio', { keepScroll: true });
    document.querySelectorAll('.tabs [data-tab]').forEach(function (b) {
      var on = b.dataset.tab === name;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    TABS.forEach(function (t) { $('panel-' + t).hidden = t !== name; });
    store(LS.tab, name);
  }
  document.querySelectorAll('.tabs [data-tab]').forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.dataset.tab, true); });
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
    renderSetup();
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
    $('gen-ratio').addEventListener('change', updateCost);
    applyModel();
  }

  // ---------- detect duration / ratio from the prompt (English + Chinese) ----------
  function detect(text) {
    var out = {};
    var d = /(\d{1,2})\s*-?\s*(?:s|sec|secs|second|seconds|秒)(?![a-z])/i.exec(text || '');
    if (d) out.duration = parseInt(d[1], 10);
    var r = /(?:^|[^\d])(21:9|16:9|9:16|4:3|3:4|1:1)(?!\d)/.exec(text || '');
    if (r) out.ratio = r[1];
    else if (/\b(vertical|portrait)\b|竖屏|竖版/i.test(text || '')) out.ratio = '9:16';
    else if (/\b(landscape|horizontal|widescreen)\b|横屏|横版/i.test(text || '')) out.ratio = '16:9';
    else if (/\bsquare\b|方形/i.test(text || '')) out.ratio = '1:1';
    return out;
  }
  function applyDetect() {
    var hint = $('gen-detected');
    if (!$('gen-detect').checked) { hint.hidden = true; return; }
    var det = detect($('gen-prompt').value), m = model(), parts = [];
    if (det.duration && m) { $('gen-duration').value = det.duration; clampDuration(); parts.push($('gen-duration').value + ' s'); }
    if (det.ratio && m && m.ratios.indexOf(det.ratio) >= 0) { $('gen-ratio').value = det.ratio; parts.push(det.ratio); }
    hint.textContent = parts.length ? 'Detected: ' + parts.join(' · ') : 'Nothing detected — using the settings below.';
    hint.hidden = false;
    updateCost();
  }

  // ---------- current setup summary ----------
  function mediaFields() {
    return {
      first_frame: $('gen-ff-url').value.trim() || (($('gen-ff-file').files || [])[0] ? 'local image' : ''),
      last_frame: $('gen-lf-url').value.trim(),
      reference_image: $('gen-ref-image').value.trim(),
      reference_video: $('gen-ref-video').value.trim(),
      reference_audio: $('gen-ref-audio').value.trim(),
      seed: $('gen-seed').value.trim()
    };
  }
  function renderSetup() {
    var box = $('gen-setup'); if (!box) return;
    var m = model(), md = mediaFields(), refs = [];
    if (md.first_frame) refs.push('first frame');
    if (md.last_frame) refs.push('last frame');
    if (md.reference_image) refs.push('image');
    if (md.reference_video) refs.push('video');
    if (md.reference_audio) refs.push('audio');
    var rows = [
      ['Model', m ? m.name : '—'],
      ['Duration', ($('gen-duration').value || '—') + ' s'],
      ['Resolution', $('gen-res').value || '—'],
      ['Aspect ratio', $('gen-ratio').value || '—'],
      ['References', refs.length ? refs.join(', ') : 'None'],
      ['Seed', md.seed || 'Random'],
      ['Audio', 'Native audio on']
    ];
    box.innerHTML = '';
    rows.forEach(function (r) { box.appendChild(el('dt', '', r[0])); box.appendChild(el('dd', '', r[1])); });
  }
  function validateMedia() {
    var md = mediaFields(), bad = '';
    ['gen-ff-url', 'gen-lf-url', 'gen-ref-image', 'gen-ref-video', 'gen-ref-audio'].forEach(function (id) {
      var v = $(id).value.trim();
      if (v && !/^https?:\/\/\S+$/i.test(v)) bad = 'Media must be a public HTTP/HTTPS URL.';
    });
    if (!bad && md.seed && !/^\d+$/.test(md.seed)) bad = 'Seed must be a whole number or blank.';
    var e = $('gen-media-error'); e.textContent = bad; e.hidden = !bad;
    return !bad;
  }
  function initMedia() {
    ['gen-ff-url', 'gen-lf-url', 'gen-ref-image', 'gen-ref-video', 'gen-ref-audio', 'gen-seed'].forEach(function (id) {
      $(id).addEventListener('input', function () { renderSetup(); validateMedia(); });
    });
    $('gen-detect').addEventListener('change', applyDetect);
    $('gen-prompt').addEventListener('input', function () { clearTimeout(applyDetect._t); applyDetect._t = setTimeout(applyDetect, 250); });
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
    if ($('gen-detected')) $('gen-detected').hidden = true;
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
      renderSetup();
    });
    $('gen-ff-remove').addEventListener('click', function () {
      file.value = ''; $('gen-ff-preview').hidden = true; $('gen-ff-img').removeAttribute('src'); renderSetup();
    });
  }

  // ---------- generate ----------
  function showResult(node) { var r = $('gen-result'); r.innerHTML = ''; r.appendChild(node); }
  function initGenerate() {
    $('gen-submit').addEventListener('click', function () {
      var err = $('gen-error');
      err.hidden = true;
      var prompt = $('gen-prompt').value.trim();
      if (!prompt && !mediaFields().first_frame) { err.textContent = 'Enter a prompt or a media URL.'; err.hidden = false; return; }
      if (!validateMedia()) { $('gen-media-card').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      // Only wallets holding $NEXT can generate.
      if (!API || g.NVWallet.holderStatus() !== 'holder') {
        showResult(g.NVWalletUI.gate());
        status(g.NVWallet.state.address ? 'Wallet connected · ' + g.NVWallet.short(g.NVWallet.state.address) : 'Connect a wallet holding ' + SYM + ' to generate');
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
  g.NVApp = { showTab: showTab, detect: detect, models: MODELS, status: status,
    findModel: function (q) {
      q = String(q || '').trim().toLowerCase();
      if (!q) return null;
      return MODELS.filter(function (m) { return m.id.toLowerCase() === q || m.name.toLowerCase() === q; })[0] || null;
    },
    prompt: function () { return $('gen-prompt').value; },
    setModel: function (id) {
      var sel = $('gen-model');
      if (!MODELS.some(function (m) { return m.id === id; })) return;
      sel.value = id; sel.dispatchEvent(new Event('change'));
      showTab('generate');
    } };
  document.addEventListener('DOMContentLoaded', function () {
    initModels();
    initPresets();
    initFirstFrame();
    initMedia();
    renderSetup();
    initGenerate();
    initTasks();
    initChat();
    var saved = load(LS.tab);
    showTab(TABS.indexOf(saved) >= 0 ? saved : 'generate', true);
    status(API ? 'Ready' : 'Preview · generation backend not connected yet');
  });
})(window);
