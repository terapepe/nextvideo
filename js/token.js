/*
 * $NEXT token UI: network theme, header badges, contract-address cards with copy, pay tab, socials, footer.
 * Everything is driven by js/config.js through window.NVChains.
 */
(function (g) {
  'use strict';
  var cfg = g.NEXTVIDEO_CONFIG || {};
  var brand = cfg.brand || {};
  var token = cfg.token || {};
  var socials = cfg.socials || {};
  var C = g.NVChains;
  var SYM = '$' + (token.symbol || 'NEXT');

  var ICON = {
    copy: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    ext: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M17.75 3h3.07l-6.71 7.67L22 21h-6.18l-4.84-6.33L5.44 21H2.37l7.18-8.2L2 3h6.34l4.37 5.78L17.75 3zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M21.94 4.3l-3.2 15.1c-.24 1.07-.87 1.33-1.76.83l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.03-8.16c.39-.35-.09-.54-.61-.2L6.4 13.1l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54L20.6 2.83c.87-.32 1.63.2 1.34 1.47z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg>'
  };

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function netIcon(n, size) {
    var i = el('img', 'nv-net-icon');
    i.src = n.icon; i.alt = n.name; i.width = size || 18; i.height = size || 18;
    return i;
  }
  function xUrl() { return socials.x ? 'https://x.com/' + String(socials.x).replace(/^@/, '') : ''; }
  function tgUrl() {
    var t = String(socials.telegram || '').replace(/^@/, '');
    return !t ? '' : (/^https?:/.test(t) ? t : 'https://t.me/' + t);
  }
  function dexUrl(n, ca) { return ca ? 'https://dexscreener.com/' + n.dex + '/' + ca : ''; }

  // ---------- toast / clipboard ----------
  function toast(msg) {
    var t = $('toast'); if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 1800);
  }
  function copyText(text) {
    if (navigator.clipboard && g.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var a = el('textarea'); a.value = text; a.setAttribute('readonly', '');
      a.className = 'sr-only'; document.body.appendChild(a); a.select();
      try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); }
      document.body.removeChild(a);
    });
  }

  /** Full contract address + copy button with SVG icon. */
  function caBox(grp, compact) {
    if (!grp.ca) {
      var p = el('div', 'nv-ca nv-ca-pending');
      p.appendChild(el('code', '', 'Contract address coming soon'));
      return p;
    }
    var b = el('button', 'nv-ca' + (compact ? ' nv-ca-compact' : ''));
    b.type = 'button';
    b.title = 'Copy ' + grp.tag + ' contract address';
    b.setAttribute('aria-label', 'Copy ' + grp.tag + ' contract address ' + grp.ca);
    var code = el('code', 'nv-ca-text', grp.ca);
    var ic = el('span', 'nv-copy'); ic.innerHTML = ICON.copy;
    var lbl = el('span', 'nv-copy-label', 'Copy');
    ic.appendChild(lbl);
    b.appendChild(code); b.appendChild(ic);
    b.addEventListener('click', function () {
      copyText(grp.ca).then(function () {
        ic.innerHTML = ICON.check; ic.appendChild(lbl); lbl.textContent = 'Copied';
        b.classList.add('is-copied');
        toast(grp.tag + ' CA copied');
        setTimeout(function () { ic.innerHTML = ICON.copy; ic.appendChild(lbl); lbl.textContent = 'Copy'; b.classList.remove('is-copied'); }, 1400);
      }, function () { toast('Copy failed — select the address manually'); });
    });
    return b;
  }

  function netBadges(nets, size) {
    var w = el('span', 'nv-net-badges');
    nets.forEach(function (n) { w.appendChild(netIcon(n, size)); });
    return w;
  }

  // ---------- theme ----------
  function applyTheme() {
    var root = document.documentElement;
    root.dataset.mode = C.isSingle ? 'single' : 'multi';
    root.dataset.net = C.isSingle ? C.primary.key : 'multi';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && C.isSingle) meta.setAttribute('content', C.primary.color);
  }

  // ---------- header ----------
  function renderHeader() {
    if (brand.tagline) $('brand-tagline').textContent = brand.tagline;
    var stack = $('header-nets');
    stack.innerHTML = '';
    C.active.forEach(function (n) {
      var s = el('span', 'nv-net-pill');
      s.title = n.name;
      s.appendChild(netIcon(n, 18));
      if (C.isSingle) s.appendChild(el('span', 'nv-net-pill-name', n.name));
      stack.appendChild(s);
    });
    stack.title = C.isSingle ? 'Live on ' + C.primary.name : 'Live on ' + C.names(C.active);
    $('token-chip-text').textContent = SYM;
    $('token-chip').addEventListener('click', function () { if (g.NVApp) g.NVApp.showTab('token'); });
    $('tab-token-full').textContent = 'Pay with ' + SYM;
    $('tab-token-short').textContent = SYM;
    var soc = $('header-socials'); soc.innerHTML = '';
    socialLinks(true).forEach(function (a) { soc.appendChild(a); });
  }

  function socialLinks(iconOnly) {
    var out = [];
    var list = [
      { url: xUrl(), icon: ICON.x, label: 'X', handle: '@' + String(socials.x || '').replace(/^@/, '') },
      { url: tgUrl(), icon: ICON.telegram, label: 'Telegram', handle: String(socials.telegram || '').replace(/^https?:\/\/t\.me\//, '') }
    ];
    list.forEach(function (s) {
      if (!s.url) return;
      var a = el('a', iconOnly ? 'nv-social-btn' : 'nv-social-row');
      a.href = s.url; a.target = '_blank'; a.rel = 'noopener';
      a.title = s.label + ' ' + s.handle;
      a.setAttribute('aria-label', s.label + ' ' + s.handle);
      a.innerHTML = s.icon;
      if (!iconOnly) {
        var t = el('span', 'nv-social-text');
        t.appendChild(el('strong', '', s.label));
        t.appendChild(el('span', 'muted', s.handle));
        a.appendChild(t);
      }
      out.push(a);
    });
    return out;
  }

  // ---------- contract strip (all tabs) ----------
  function renderStrip() {
    var box = $('ca-strip'); box.innerHTML = '';
    var inner = el('div', 'nv-ca-strip-inner');
    var lead = el('div', 'nv-ca-lead');
    lead.appendChild(el('span', 'nv-ca-sym', SYM));
    lead.appendChild(el('span', 'nv-ca-lead-text', C.isSingle ? 'on ' + C.primary.name : C.active.length + ' networks'));
    inner.appendChild(lead);
    var list = el('div', 'nv-ca-strip-list');
    C.groups().forEach(function (grp) {
      var item = el('div', 'nv-ca-item');
      item.dataset.group = grp.id;
      var tag = el('span', 'nv-ca-tag');
      tag.appendChild(netBadges(grp.nets, 18));
      tag.appendChild(el('span', 'nv-ca-tag-text', grp.tag));
      item.appendChild(tag);
      item.appendChild(caBox(grp, true));
      list.appendChild(item);
    });
    inner.appendChild(list);
    box.appendChild(inner);
  }

  // ---------- token tab ----------
  function renderTokenCard() {
    var card = $('token-card'); card.innerHTML = '';
    var top = el('div', 'nv-token-top');
    var logo = el('img', 'nv-token-logo'); logo.src = 'assets/logo.svg'; logo.alt = ''; logo.width = 52; logo.height = 52;
    top.appendChild(logo);
    var t = el('div', 'nv-token-id');
    t.appendChild(el('h3', 'nv-token-name', token.name || brand.name || 'NextVideo'));
    var meta = el('p', 'nv-token-meta');
    meta.appendChild(el('span', 'nv-sym-pill', SYM));
    meta.appendChild(el('span', 'muted', C.isSingle ? 'Single network · ' + C.primary.name : 'Multi-chain · ' + C.names(C.active)));
    t.appendChild(meta);
    top.appendChild(t);
    card.appendChild(top);
    if (C.isSingle && C.primary.tagline) card.appendChild(el('p', 'nv-net-tagline', C.primary.tagline));

    var grid = el('div', 'nv-ca-grid' + (C.groups().length > 1 ? '' : ' one'));
    C.groups().forEach(function (grp) {
      var art = el('article', 'nv-ca-card nv-ca-card--' + grp.id);
      if (grp.nets.length === 1) {
        art.style.setProperty('--net', grp.nets[0].color);
        art.style.setProperty('--net-ink', C.inkOn(grp.nets[0].color));
      }
      var head = el('div', 'nv-ca-card-head');
      head.appendChild(netBadges(grp.nets, 24));
      head.appendChild(el('h4', '', grp.nets.length > 1 ? 'One address · ' + grp.nets.length + ' networks' : grp.nets[0].name));
      art.appendChild(head);
      var pills = el('ul', 'nv-pills');
      grp.nets.forEach(function (n) {
        var li = el('li', 'nv-pill'); li.appendChild(netIcon(n, 14)); li.appendChild(el('span', '', n.name)); pills.appendChild(li);
      });
      art.appendChild(pills);
      art.appendChild(el('p', 'nv-ca-label', SYM + ' contract address'));
      art.appendChild(caBox(grp, false));
      if (grp.ca) {
        var row = el('div', 'nv-link-row');
        grp.nets.forEach(function (n) {
          var a = el('a', 'btn btn-small');
          a.href = n.explorer + grp.ca; a.target = '_blank'; a.rel = 'noopener';
          a.appendChild(netIcon(n, 14)); a.appendChild(el('span', '', n.name + ' explorer'));
          var e = el('span', 'nv-ext'); e.innerHTML = ICON.ext; a.appendChild(e);
          row.appendChild(a);
        });
        var d = el('a', 'btn btn-small btn-accent');
        d.href = dexUrl(grp.nets[0], grp.ca); d.target = '_blank'; d.rel = 'noopener';
        d.textContent = 'Buy ' + SYM;
        row.appendChild(d);
        art.appendChild(row);
      }
      grid.appendChild(art);
    });
    card.appendChild(grid);
    var foot = el('p', 'muted small');
    foot.textContent = 'Always verify the contract address here or on our official X and Telegram.';
    card.appendChild(foot);
  }

  function renderSteps() {
    var ol = $('pay-steps'); ol.innerHTML = '';
    var where = C.isSingle ? C.primary.name : C.names(C.active, 'or');
    [
      ['Hold ' + SYM, 'Get ' + SYM + ' on ' + where + '.'],
      ['Connect your wallet', 'Link the wallet that holds ' + SYM + ' — no account or API key needed.'],
      ['Generate & pay per video', 'Each job shows its ' + SYM + ' price before you confirm. You only pay for jobs you submit.']
    ].forEach(function (s, i) {
      var li = el('li', 'nv-step');
      li.appendChild(el('span', 'nv-step-num', String(i + 1)));
      var tx = el('div', 'nv-step-text');
      tx.appendChild(el('strong', '', s[0]));
      tx.appendChild(el('span', 'muted', s[1]));
      li.appendChild(tx);
      ol.appendChild(li);
    });
    $('token-desc').textContent = 'Every video on ' + (brand.name || 'NextVideo') + ' is paid with ' + SYM + ' on ' + where + '.';
    $('token-title').textContent = 'Pay with ' + SYM;
  }

  function renderPricing() {
    var box = $('pricing'); box.innerHTML = '';
    var p = cfg.pricing || {};
    var keys = Object.keys(p);
    if (!keys.length) {
      box.appendChild(el('p', 'empty', SYM + ' pricing will be announced when generation goes live.'));
      return;
    }
    var tbl = el('table', 'nv-price-table');
    var hr = el('tr'); hr.appendChild(el('th', '', 'Resolution')); hr.appendChild(el('th', '', SYM + ' / second'));
    tbl.appendChild(hr);
    keys.forEach(function (k) {
      var tr = el('tr'); tr.appendChild(el('td', '', k)); tr.appendChild(el('td', '', String(p[k]))); tbl.appendChild(tr);
    });
    box.appendChild(tbl);
  }

  function renderCommunity() {
    var box = $('community-links'); box.innerHTML = '';
    socialLinks(false).forEach(function (a) { box.appendChild(a); });
    if (brand.email) {
      var m = el('a', 'nv-social-row'); m.href = 'mailto:' + brand.email; m.innerHTML = ICON.mail;
      var t = el('span', 'nv-social-text'); t.appendChild(el('strong', '', 'Email')); t.appendChild(el('span', 'muted', brand.email));
      m.appendChild(t); box.appendChild(m);
    }
  }

  function renderCta() {
    $('cta-title').textContent = 'Create AI videos and pay with ' + SYM + '.';
    $('cta-desc').textContent = C.isSingle ? 'Live on ' + C.primary.name + '.' : 'Live on ' + C.names(C.active) + '.';
    var box = $('cta-actions'); box.innerHTML = '';
    var buy = el('button', 'btn btn-accent'); buy.type = 'button'; buy.textContent = 'Get ' + SYM;
    buy.addEventListener('click', function () { if (g.NVApp) g.NVApp.showTab('token'); });
    box.appendChild(buy);
    if (tgUrl()) {
      var tg = el('a', 'btn'); tg.href = tgUrl(); tg.target = '_blank'; tg.rel = 'noopener';
      tg.innerHTML = ICON.telegram; tg.appendChild(el('span', '', 'Join Telegram'));
      box.appendChild(tg);
    }
  }

  function renderFooter() {
    var f = $('footer'); f.innerHTML = '';
    var y = new Date().getFullYear();
    f.appendChild(el('span', '', '© ' + y + ' ' + (brand.name || 'NextVideo')));
    if (xUrl()) { var a = el('a', '', 'X @' + String(socials.x).replace(/^@/, '')); a.href = xUrl(); a.target = '_blank'; a.rel = 'noopener'; f.appendChild(a); }
    if (tgUrl()) { var b = el('a', '', 'Telegram'); b.href = tgUrl(); b.target = '_blank'; b.rel = 'noopener'; f.appendChild(b); }
    if (brand.email) { var m = el('a', '', brand.email); m.href = 'mailto:' + brand.email; f.appendChild(m); }
    var l = el('a', '', 'MIT License'); l.href = 'LICENSE'; l.target = '_blank'; l.rel = 'noopener'; f.appendChild(l);
  }

  applyTheme();
  document.addEventListener('DOMContentLoaded', function () {
    renderHeader();
    renderStrip();
    renderTokenCard();
    renderSteps();
    renderPricing();
    renderCommunity();
    renderCta();
    renderFooter();
  });

  g.NVToken = { toast: toast, copyText: copyText, symbol: SYM };
})(window);
