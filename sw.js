var V = 'cnf-v7';
var ASSETS = [
  "index.html",
  "leaderboard.html",
  "style.css",
  "site.js",
  "cnf.js",
  "app.js",
  "config.js",
  "manifest.webmanifest",
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(V).then(function (cache) {
      // Use Promise.allSettled so missing optional files won't crash the service worker
      return Promise.allSettled(
        ASSETS.map(function (url) {
          return cache.add(url).catch(function (err) {
            console.warn('Skipping cache for missing asset:', url);
          });
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(
        ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  var font = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (u.origin !== location.origin && !font) return;

  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then(function (res) {
        var cp = res.clone();
        caches.open(V).then(function (c) { c.put(r, cp); });
        return res;
      }).catch(function () {
        return caches.match(r).then(function (m) { return m || caches.match('index.html'); });
      })
    );
    return;
  }

  // own files (js/css/html): network first so updates show immediately, cache only when offline
  if (u.origin === location.origin) {
    e.respondWith(
      fetch(r).then(function (res) {
        if (res && res.ok) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); }
        return res;
      }).catch(function () { return caches.match(r); })
    );
    return;
  }

  e.respondWith(
    caches.match(r).then(function (m) {
      var net = fetch(r).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) {
          var cp = res.clone();
          caches.open(V).then(function (c) { c.put(r, cp); });
        }
        return res;
      }).catch(function () { return m; });
      return m || net;
    })
  );
});