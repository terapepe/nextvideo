/*
 * Wallet UI: header wallet button, connect modal with one button per active network,
 * and the "connect a wallet holding $NEXT" gate shown by Generate.
 */
(function (g) {
  'use strict';
  var C = g.NVChains, W = g.NVWallet;
  var SYM = (g.NVToken && g.NVToken.symbol) || '$NEXT';

  var ICON_WALLET = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/><path d="M3 6.5A2.5 2.5 0 0 0 5.5 9H20a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a2.5 2.5 0 0 1 0-5"/></svg>';

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function icon(n, s) { var i = el('img', 'nv-net-icon'); i.src = n.icon; i.alt = ''; i.width = s; i.height = s; return i; }

  /** One "Connect on <network>" button per active network. */
  function networkButtons() {
    var wrap = el('div', 'nv-wallet-nets' + (C.active.length === 1 ? ' one' : ''));
    C.active.forEach(function (n) {
      var b = el('button', 'nv-wallet-net');
      b.type = 'button';
      b.style.setProperty('--net', n.color);
      b.appendChild(icon(n, 28));
      var t = el('span', 'nv-wallet-net-text');
      t.appendChild(el('strong', '', 'Connect on ' + n.name));
      t.appendChild(el('span', 'muted', W.hasProvider(n) ? W.walletName(n) : 'Install ' + W.walletName(n) + ' ↗'));
      b.appendChild(t);
      if (W.state.address && W.state.net && W.state.net.key === n.key) b.classList.add('is-active');
      b.addEventListener('click', function () {
        b.disabled = true; b.classList.add('is-busy');
        W.connect(n).then(function () { b.disabled = false; b.classList.remove('is-busy'); });
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function statusLine() {
    var s = W.holderStatus(), n = W.state.net;
    var map = {
      checking: ['', 'Checking your ' + SYM + ' balance on ' + (n && n.name) + '…'],
      'no-ca': ['warn', SYM + ' contract address has not been announced yet. Generation opens at launch.'],
      error: ['bad', W.state.error],
      empty: ['bad', 'This wallet holds no ' + SYM + ' on ' + (n && n.name) + '.'],
      holder: ['ok', 'Verified ' + SYM + ' holder on ' + (n && n.name) + '.']
    };
    var m = map[s]; if (!m) return null;
    return el('p', 'nv-wallet-status ' + m[0], m[1]);
  }

  function connectedRow() {
    var n = W.state.net;
    var row = el('div', 'nv-wallet-connected');
    row.appendChild(icon(n, 22));
    var t = el('div', 'nv-wallet-connected-text');
    t.appendChild(el('strong', '', W.short(W.state.address)));
    t.appendChild(el('span', 'muted', n.name + ' · ' + W.walletName(n)));
    row.appendChild(t);
    var d = el('button', 'link link-small', 'Disconnect'); d.type = 'button';
    d.addEventListener('click', function () { W.disconnect(); });
    row.appendChild(d);
    return row;
  }

  /** Gate shown in the Generate progress card. */
  function gate() {
    var s = W.holderStatus();
    var box = el('div', 'nv-notice nv-gate');
    if (s === 'none') {
      box.appendChild(el('strong', '', 'Connect a wallet holding ' + SYM + ' to use this feature'));
      box.appendChild(el('p', 'muted', 'Generating videos is available to ' + SYM + ' holders. Connect your wallet on ' + C.names(C.active, 'or') + '.'));
      box.appendChild(networkButtons());
      return box;
    }
    box.appendChild(connectedRow());
    var st = statusLine(); if (st) box.appendChild(st);
    var row = el('div', 'actions');
    if (s === 'empty') {
      var b = el('button', 'btn btn-accent btn-small', 'Get ' + SYM); b.type = 'button';
      b.addEventListener('click', function () { if (g.NVApp) g.NVApp.showTab('token'); });
      row.appendChild(b);
    }
    if (s === 'error') {
      var r = el('button', 'btn btn-small', 'Retry'); r.type = 'button';
      r.addEventListener('click', function () { W.checkBalance(); });
      row.appendChild(r);
    }
    if (s === 'holder') {
      box.appendChild(el('p', 'muted', 'The generation backend goes live soon — your prompt and settings are kept in this browser, and nothing was charged.'));
    }
    if (row.childNodes.length) box.appendChild(row);
    if (s === 'empty' || s === 'error') {
      var other = el('details', 'nv-other-net');
      other.appendChild(el('summary', 'muted small', 'Use another wallet or network'));
      other.appendChild(networkButtons());
      box.appendChild(other);
    }
    return box;
  }

  // ---------- modal ----------
  function renderModal() {
    var body = $('wallet-modal-body'); body.innerHTML = '';
    if (W.state.address) {
      body.appendChild(connectedRow());
      var st = statusLine(); if (st) body.appendChild(st);
      var other = el('p', 'muted small nv-modal-sub', 'Switch network or wallet:');
      body.appendChild(other);
    } else {
      body.appendChild(el('p', 'muted nv-modal-sub', 'Choose the network where you hold ' + SYM + '.'));
    }
    body.appendChild(networkButtons());
    if (W.state.error && !W.state.address) body.appendChild(el('p', 'error', W.state.error));
  }
  function openModal() { renderModal(); $('wallet-modal').hidden = false; $('wallet-modal-close').focus(); }
  function closeModal() { $('wallet-modal').hidden = true; }

  // ---------- header + pay tab ----------
  function renderHeader() {
    var b = $('wallet-btn'); b.innerHTML = '';
    if (W.state.address) {
      b.classList.add('is-connected');
      b.appendChild(icon(W.state.net, 18));
      b.appendChild(el('span', '', W.short(W.state.address)));
      var s = W.holderStatus();
      if (s === 'holder') b.appendChild(el('span', 'nv-dot ok'));
      else if (s === 'empty' || s === 'error') b.appendChild(el('span', 'nv-dot bad'));
    } else {
      b.classList.remove('is-connected');
      var i = el('span', 'nv-wallet-ic'); i.innerHTML = ICON_WALLET; b.appendChild(i);
      b.appendChild(el('span', '', 'Connect wallet'));
    }
    var pay = $('wallet-connect');
    pay.disabled = false;
    pay.textContent = W.state.address ? 'Wallet: ' + W.short(W.state.address) : 'Connect wallet';
    var note = $('wallet-note');
    var st = W.holderStatus();
    note.textContent = st === 'none' ? 'Solana, Robinhood, Base or BSC — the network where you hold ' + SYM + '.'
      : (statusLine() || {}).textContent || '';
    if (C.isSingle && st === 'none') note.textContent = 'Connect on ' + C.primary.name + ' — the network where you hold ' + SYM + '.';
  }

  function refresh() {
    renderHeader();
    if (!$('wallet-modal').hidden) renderModal();
    var r = $('gen-result');
    if (r && r.querySelector('.nv-gate')) { r.innerHTML = ''; r.appendChild(gate()); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('wallet-btn').addEventListener('click', openModal);
    $('wallet-connect').addEventListener('click', openModal);
    $('wallet-modal-close').addEventListener('click', closeModal);
    $('wallet-modal').addEventListener('click', function (e) { if (e.target.id === 'wallet-modal') closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('wallet-modal').hidden) closeModal(); });
    W.onChange(refresh);
    renderHeader();
  });

  g.NVWalletUI = { gate: gate, open: openModal };
})(window);
