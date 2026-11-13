/*
 * Page router (clean URLs, no #): /, /models, /providers, /pricing, /api-keys, /studio, /token.
 * vercel.json rewrites every path to index.html. Also drives the mobile sidebar.
 */
(function (g) {
  'use strict';
  var PAGES = {
    dashboard: { path: '/', title: 'Dashboard' },
    models: { path: '/models', title: 'Models' },
    providers: { path: '/providers', title: 'Providers' },
    pricing: { path: '/pricing', title: 'Pricing' },
    'api-keys': { path: '/api-keys', title: 'API Keys' },
    studio: { path: '/studio', title: 'Video Studio' },
    token: { path: '/token', title: '$NEXT Token' }
  };
  var listeners = [], current = null;

  function fromPath(p) {
    p = (p || '/').replace(/\/+$/, '') || '/';
    for (var k in PAGES) if (PAGES[k].path === p) return k;
    return 'dashboard';
  }
  function closeMenu() {
    document.body.classList.remove('nv-menu-open');
    var s = document.getElementById('scrim'); if (s) s.hidden = true;
  }
  function render(page) {
    current = page;
    document.querySelectorAll('.nv-page').forEach(function (s) { s.hidden = s.dataset.page !== page; });
    document.querySelectorAll('.nv-nav-link').forEach(function (a) {
      var on = a.dataset.page === page;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var t = PAGES[page].title.replace('$NEXT', (g.NVToken && g.NVToken.symbol) || '$NEXT');
    var c = document.getElementById('crumb'); if (c) c.textContent = t;
    document.title = (page === 'dashboard' ? 'NextVideo · AI Video Studio' : t + ' · NextVideo');
    closeMenu();
    listeners.forEach(function (f) { f(page); });
  }
  function go(page, opts) {
    if (!PAGES[page]) page = 'dashboard';
    if (page !== current) {
      var path = PAGES[page].path;
      if (location.pathname !== path) history.pushState({ page: page }, '', path);
      render(page);
      if (!(opts && opts.keepScroll)) g.scrollTo(0, 0);
    }
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-page]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(a.dataset.page);
  });
  g.addEventListener('popstate', function () { render(fromPath(location.pathname)); });

  document.addEventListener('DOMContentLoaded', function () {
    var burger = document.getElementById('burger'), scrim = document.getElementById('scrim');
    burger.addEventListener('click', function () { document.body.classList.add('nv-menu-open'); scrim.hidden = false; });
    scrim.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    render(fromPath(location.pathname));
  });

  g.NVRouter = { go: go, current: function () { return current; }, onChange: function (f) { listeners.push(f); } };
})(window);
