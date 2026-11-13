/*
 * Network registry + single/multi logic for the $NEXT token.
 * Reads window.NEXTVIDEO_CONFIG (js/config.js). Exposes window.NVChains.
 */
(function (g) {
  'use strict';
  var cfg = g.NEXTVIDEO_CONFIG || {};
  var token = cfg.token || {};
  var overrides = token.chains || {};

  // Built-in network defaults. name/short/color/tagline/ca can be overridden in config.token.chains.
  var BASE = [
    { key: 'solana', vm: 'svm', name: 'Solana', short: 'SOL', color: '#9945FF', color2: '#14F195',
      icon: 'assets/chains/solana.svg', explorer: 'https://solscan.io/token/', dex: 'solana' },
    { key: 'robinhood', vm: 'evm', name: 'Robinhood', short: 'RH', color: '#CCFF00', color2: '#9BCB00',
      icon: 'assets/chains/robinhood.svg', explorer: 'https://robinhoodchain.blockscout.com/token/', dex: 'robinhood' },
    { key: 'base', vm: 'evm', name: 'Base', short: 'BASE', color: '#0052FF', color2: '#3C8AFF',
      icon: 'assets/chains/base.svg', explorer: 'https://basescan.org/token/', dex: 'base' },
    { key: 'bsc', vm: 'evm', name: 'BNB Chain', short: 'BSC', color: '#F0B90B', color2: '#F8D12F',
      icon: 'assets/chains/bsc.svg', explorer: 'https://bscscan.com/token/', dex: 'bsc' }
  ];

  function clean(o) {
    var r = {};
    for (var k in (o || {})) if (o[k] !== '' && o[k] != null) r[k] = o[k];
    return r;
  }
  function merge(a, b) { var r = {}, k; for (k in a) r[k] = a[k]; for (k in b) r[k] = b[k]; return r; }

  var networks = BASE.map(function (n) { return merge(merge({ tagline: '', ca: '' }, n), clean(overrides[n.key])); });
  function byKey(k) { for (var i = 0; i < networks.length; i++) if (networks[i].key === k) return networks[i]; return null; }

  var isSingle = token.mode !== 'multi';
  var active;
  if (isSingle) {
    active = [byKey(token.singleNetwork) || networks[0]];
  } else {
    // Multi: always all 4 networks, ordered by multiOrder, then any missing ones.
    var order = (token.multiOrder || []).concat(networks.map(function (n) { return n.key; }));
    var seen = {};
    active = order.filter(function (k) { if (seen[k] || !byKey(k)) return false; seen[k] = 1; return true; }).map(byKey);
  }

  // Contract address for a network.
  // Multi: Robinhood / Base / BSC always share evmAddress; Solana uses solanaAddress.
  // Single: chains.<key>.ca wins, else evmAddress / solanaAddress.
  function caOf(n) {
    var shared = n.vm === 'svm' ? token.solanaAddress : token.evmAddress;
    var ca = isSingle ? (n.ca || shared) : (n.vm === 'svm' ? (shared || n.ca) : shared);
    return String(ca || '').trim();
  }

  // Group networks sharing one address → one card / one copy button (multi: SOL + RH/BASE/BSC).
  function groups() {
    var out = [];
    active.forEach(function (n) {
      var ca = caOf(n);
      var id = isSingle ? n.key : (n.vm === 'svm' ? 'svm' : 'evm');
      var grp = null;
      for (var i = 0; i < out.length; i++) if (out[i].id === id) grp = out[i];
      if (grp) grp.nets.push(n);
      else out.push({ id: id, ca: ca, nets: [n] });
    });
    out.forEach(function (x) { x.tag = x.nets.map(function (n) { return n.short; }).join(' / '); });
    return out;
  }

  // Readable text color on top of a network color.
  function inkOn(hex) {
    var v = parseInt(String(hex).replace('#', ''), 16);
    var l = (0.299 * (v >> 16) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255;
    return l > 0.6 ? '#0e0c0b' : '#ffffff';
  }

  function names(list, sep) {
    var s = list.map(function (n) { return n.name; });
    if (s.length < 2) return s.join('');
    return s.slice(0, -1).join(', ') + ' ' + (sep || 'and') + ' ' + s[s.length - 1];
  }

  g.NVChains = {
    networks: networks,
    active: active,
    primary: active[0],
    isSingle: isSingle,
    caOf: caOf,
    groups: groups,
    inkOn: inkOn,
    names: names,
    byKey: byKey
  };
})(window);
