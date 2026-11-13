/*
 * Wallet sign-in for $NEXT holders.
 * EVM networks (Robinhood, Base, BSC) use the injected EIP-1193 wallet (MetaMask, Rabby, Coinbase, OKX…).
 * Solana uses the injected Solana wallet (Phantom, Solflare, Backpack…).
 * After connecting, the $NEXT balance is read on-chain; Generate is unlocked only for holders.
 */
(function (g) {
  'use strict';
  var C = g.NVChains;
  var SYM = '$' + ((((g.NEXTVIDEO_CONFIG || {}).token || {}).symbol) || 'NEXT');
  var LS_KEY = 'nv_wallet';
  var state = { net: null, address: '', balance: null, checking: false, error: '' };
  var listeners = [];

  function emit() { listeners.forEach(function (f) { try { f(state); } catch (e) { /* ignore */ } }); }
  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify({ net: state.net && state.net.key, address: state.address })); } catch (e) { /* private mode */ } }
  function clearSaved() { try { localStorage.removeItem(LS_KEY); } catch (e) { /* private mode */ } }
  function short(a) { return a ? a.slice(0, 6) + '…' + a.slice(-4) : ''; }

  // ---------- providers ----------
  function evmProvider() { return g.ethereum || null; }
  function solProvider() {
    if (g.phantom && g.phantom.solana && g.phantom.solana.isPhantom) return g.phantom.solana;
    if (g.solflare && g.solflare.isSolflare) return g.solflare;
    if (g.backpack && g.backpack.solana) return g.backpack.solana;
    if (g.solana) return g.solana;
    return null;
  }
  function hasProvider(n) { return n.vm === 'svm' ? !!solProvider() : !!evmProvider(); }
  function installUrl(n) { return n.vm === 'svm' ? 'https://phantom.app/download' : 'https://metamask.io/download/'; }
  function walletName(n) {
    if (n.vm === 'svm') { var s = solProvider(); return !s ? 'Phantom' : s.isPhantom ? 'Phantom' : s.isSolflare ? 'Solflare' : 'Solana wallet'; }
    var e = evmProvider();
    if (!e) return 'MetaMask';
    return e.isRabby ? 'Rabby' : e.isCoinbaseWallet ? 'Coinbase Wallet' : e.isOkxWallet || e.isOKExWallet ? 'OKX Wallet' : e.isMetaMask ? 'MetaMask' : 'EVM wallet';
  }

  // ---------- EVM ----------
  function hexChain(id) { return '0x' + Number(id).toString(16); }
  function switchChain(eth, n) {
    return eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexChain(n.chainId) }] }).catch(function (e) {
      if (e && (e.code === 4902 || /unrecognized|not added|unknown chain/i.test(e.message || ''))) {
        return eth.request({ method: 'wallet_addEthereumChain', params: [{
          chainId: hexChain(n.chainId), chainName: n.name,
          nativeCurrency: { name: n.native, symbol: n.native, decimals: 18 },
          rpcUrls: [n.rpc], blockExplorerUrls: n.explorerHome ? [n.explorerHome] : []
        }] });
      }
      throw e;
    });
  }
  function rpc(url, method, params) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: method, params: params }) })
      .then(function (r) { if (!r.ok) throw new Error('RPC HTTP ' + r.status); return r.json(); })
      .then(function (j) { if (j.error) throw new Error(j.error.message || 'RPC error'); return j.result; });
  }
  function evmBalance(n, owner, ca) {
    // balanceOf(address) — 0x70a08231
    var data = '0x70a08231' + owner.toLowerCase().replace(/^0x/, '').padStart(64, '0');
    return rpc(n.rpc, 'eth_call', [{ to: ca, data: data }, 'latest']).then(function (hex) {
      return hex && hex !== '0x' ? BigInt(hex) : 0n;
    });
  }
  function connectEvm(n) {
    var eth = evmProvider();
    if (!eth) return Promise.reject(new Error('NO_WALLET'));
    return eth.request({ method: 'eth_requestAccounts' }).then(function (acc) {
      if (!acc || !acc[0]) throw new Error('No account returned by the wallet');
      return switchChain(eth, n).then(function () { return acc[0]; });
    });
  }

  // ---------- Solana ----------
  function solBalance(n, owner, mint) {
    return rpc(n.rpc, 'getTokenAccountsByOwner', [owner, { mint: mint }, { encoding: 'jsonParsed' }]).then(function (res) {
      var total = 0n;
      (res && res.value || []).forEach(function (a) {
        var amt = a.account && a.account.data && a.account.data.parsed && a.account.data.parsed.info.tokenAmount;
        if (amt && amt.amount) total += BigInt(amt.amount);
      });
      return total;
    });
  }
  function connectSol() {
    var sol = solProvider();
    if (!sol) return Promise.reject(new Error('NO_WALLET'));
    return sol.connect().then(function (r) {
      var pk = (r && r.publicKey) || sol.publicKey;
      if (!pk) throw new Error('No account returned by the wallet');
      return pk.toString();
    });
  }

  // ---------- balance ----------
  function checkBalance() {
    var n = state.net, ca = n && C.caOf(n);
    if (!n || !state.address) return Promise.resolve();
    if (!ca) { state.balance = null; state.error = ''; emit(); return Promise.resolve(); }
    state.checking = true; state.error = ''; emit();
    var p = n.vm === 'svm' ? solBalance(n, state.address, ca) : evmBalance(n, state.address, ca);
    return p.then(function (b) { state.balance = b; }, function (e) {
      state.balance = null; state.error = 'Could not read your ' + SYM + ' balance on ' + n.name + ' (' + (e.message || e) + ').';
    }).then(function () { state.checking = false; emit(); });
  }

  // ---------- public ----------
  function connect(n) {
    state.error = '';
    var p = n.vm === 'svm' ? connectSol() : connectEvm(n);
    return p.then(function (addr) {
      state.net = n; state.address = addr; state.balance = null;
      save(); emit();
      return checkBalance();
    }, function (e) {
      if (e && e.message === 'NO_WALLET') { g.open(installUrl(n), '_blank', 'noopener'); return; }
      state.error = (e && (e.code === 4001 || /reject|denied|cancel/i.test(e.message || ''))) ? 'Connection request was cancelled.' : 'Could not connect: ' + ((e && e.message) || e);
      emit();
    });
  }
  function disconnect() {
    var n = state.net;
    if (n && n.vm === 'svm') { var s = solProvider(); if (s && s.disconnect) try { s.disconnect(); } catch (e) { /* ignore */ } }
    state.net = null; state.address = ''; state.balance = null; state.error = '';
    clearSaved(); emit();
  }

  /** Holder status: 'none' | 'checking' | 'no-ca' | 'error' | 'empty' | 'holder' */
  function holderStatus() {
    if (!state.address) return 'none';
    if (state.checking) return 'checking';
    if (!C.caOf(state.net)) return 'no-ca';
    if (state.error) return 'error';
    if (state.balance == null) return 'checking';
    return state.balance > 0n ? 'holder' : 'empty';
  }

  // Restore a previous session silently (only if the wallet still exposes the same account).
  function restore() {
    var saved; try { saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) { saved = null; }
    if (!saved || !saved.address) return;
    var n = C.active.filter(function (x) { return x.key === saved.net; })[0];
    if (!n) { clearSaved(); return; }
    var p;
    if (n.vm === 'svm') {
      var sol = solProvider();
      p = sol && sol.connect ? sol.connect({ onlyIfTrusted: true }).then(function (r) { return ((r && r.publicKey) || sol.publicKey).toString(); }) : Promise.reject();
    } else {
      var eth = evmProvider();
      p = eth ? eth.request({ method: 'eth_accounts' }).then(function (a) { if (!a || !a[0]) throw 0; return a[0]; }) : Promise.reject();
    }
    p.then(function (addr) {
      if (addr.toLowerCase() !== saved.address.toLowerCase()) throw 0;
      state.net = n; state.address = addr; emit(); checkBalance();
    }).catch(function () { clearSaved(); });
  }

  // React to account switches inside the wallet.
  function watch() {
    var eth = evmProvider();
    if (eth && eth.on) eth.on('accountsChanged', function (a) {
      if (!state.net || state.net.vm !== 'evm') return;
      if (!a || !a[0]) { disconnect(); return; }
      state.address = a[0]; save(); emit(); checkBalance();
    });
    var sol = solProvider();
    if (sol && sol.on) sol.on('accountChanged', function (pk) {
      if (!state.net || state.net.vm !== 'svm') return;
      if (!pk) { disconnect(); return; }
      state.address = pk.toString(); save(); emit(); checkBalance();
    });
  }

  g.NVWallet = {
    state: state, connect: connect, disconnect: disconnect, holderStatus: holderStatus, checkBalance: checkBalance,
    onChange: function (f) { listeners.push(f); }, hasProvider: hasProvider, walletName: walletName, short: short
  };
  document.addEventListener('DOMContentLoaded', function () { watch(); restore(); });
})(window);
