/* Calm & Focus – streaks, progress, background score sync, share, sleep timer */
(function () {
  'use strict';
  var CFG = window.CNF_CONFIG || {};
  var BASE = (CFG.supabaseUrl || '').replace(/\/$/, ''), KEY = CFG.supabaseKey || '';
  var ON = !!(BASE && KEY);
  var GAMES = [
    ['reflex', 'Reaction time', true, function (v) { return Math.round(v) + ' ms'; }],
    ['schulte', 'Schulte grid', true, function (v) { return (v / 1000).toFixed(1) + ' s'; }],
    ['stroop', 'Color focus (Stroop)', false, function (v) { return v + ' in a row'; }],
    ['seq', 'Sequence memory', false, function (v) { return 'Level ' + v; }],
    ['num', 'Number span', false, function (v) { return v + ' digits'; }]
  ];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function jget(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }

  function todayStr() { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }   // player's local day (streaks)
  function utcDay() { return new Date().toISOString().slice(0, 10); }                                                                   // server day (daily board)
  function addDays(s, n) { var d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function gameInfo(g) { return GAMES.filter(function (x) { return x[0] === g; })[0]; }

  /* ---------- per-identity cache ----------
     One cache per account (key "cnf-cache:<uid>") and one for guests ("cnf-cache:guest"), so accounts
     never overwrite each other. Holds: all-time bests, today's bests, history, streak days, unsent scores. */
  var MIRROR = { reflex: 'cnf-reflex-best', schulte: 'cnf-schulte-best', stroop: 'cnf-stroop-best' };   // app.js reads these keys directly
  function myId() { var s0 = jget('cnf-sess', null); return (s0 && s0.uid) || 'guest'; }
  function blank() { return { v: 1, pb: {}, hist: {}, days: [], bestStreak: 0, daily: { day: utcDay(), best: {} }, pending: {}, sSync: '', fetched: false }; }
  function writeMirror(c, id) {   // id = whose scores these are, so another account never inherits them
    Object.keys(MIRROR).forEach(function (g) {
      try { if (c && c.pb[g] != null) localStorage.setItem(MIRROR[g], c.pb[g]); else localStorage.removeItem(MIRROR[g]); } catch (e) { }
    });
    try { if (c) localStorage.setItem('cnf-mirror-owner', id || ID); else localStorage.removeItem('cnf-mirror-owner'); } catch (e) { }
  }
  function pkey(g, daily) { return g + (daily ? ':d' : ':a'); }   // unsent scores: ':d' counts for today + all-time, ':a' all-time only
  var ID = myId(), CK = 'cnf-cache:' + ID, C = jget(CK, null);
  if (!C || C.v !== 1) {
    C = blank();
    var mo = null; try { mo = localStorage.getItem('cnf-mirror-owner'); } catch (e) { }
    if (ID === 'guest' && (mo === null || mo === 'guest')) {   // one-time: pick up scores the games stored before caches existed
      Object.keys(MIRROR).forEach(function (g) { try { var v0 = +localStorage.getItem(MIRROR[g]); if (v0) C.pb[g] = v0; } catch (e) { } });
    }
  }
  ['cnf-pb', 'cnf-hist', 'cnf-days', 'cnf-best-streak', 'cnf-owner'].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { } });   // old shared keys
  function rollDaily() {   // new day -> delete yesterday's daily cache
    var t = utcDay();
    if (!C.daily || C.daily.day !== t) C.daily = { day: t, best: {} };
    Object.keys(C.pending || {}).forEach(function (k) {   // yesterday's unsent score can no longer count for today's board
      var p = C.pending[k]; if (!p.daily || p.day === t) return;
      delete C.pending[k]; var ak = pkey(p.g, false), q = C.pending[ak], lo = gameInfo(p.g) && gameInfo(p.g)[2];
      if (!q || (lo ? p.v < q.v : p.v > q.v)) C.pending[ak] = { g: p.g, v: p.v, day: p.day, daily: false };
    });
  }
  function saveC() { jset(CK, C); }
  rollDaily(); saveC(); writeMirror(C);
  var days = C.days, hist = C.hist, pbs = C.pb;

  function calc() {
    var set = {}; days.forEach(function (d) { set[d] = 1; });
    var t = todayStr(), cur = 0, d = set[t] ? t : addDays(t, -1);
    while (set[d]) { cur++; d = addDays(d, -1); }
    var best = C.bestStreak || 0, run = 0, prev = null;
    days.slice().sort().forEach(function (x) { run = prev && addDays(prev, 1) === x ? run + 1 : 1; prev = x; if (run > best) best = run; });
    if (cur > best) best = cur;
    if (best !== C.bestStreak) { C.bestStreak = best; saveC(); }
    return { cur: cur, best: best, today: !!set[t] };
  }
  function badge() {
    var s = calc(), n = $('#streak-n'), b = $('#me-btn');
    if (n) n.textContent = s.cur;
    if (b) b.classList.toggle('lit', s.today);
  }
  function markActive() {
    var t = todayStr();
    if (days.indexOf(t) > -1) return;
    days.push(t); if (days.length > 400) days.splice(0, days.length - 400); saveC();
    badge(); syncStreak();
  }

  /* ---------- Supabase Background Sync ---------- */
  function sess() { return jget('cnf-sess', null); }
  function jwt(t) { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return {}; } }
  function saveSess(r) {
    var c = jwt(r.access_token);
    jset('cnf-sess', { access_token: r.access_token, refresh_token: r.refresh_token, exp: c.exp || Math.floor(Date.now() / 1000) + (r.expires_in || 3600), uid: c.sub, email: c.email || (r.user && r.user.email) || '' });
  }
  function parse(r) {
    return r.text().then(function (t) {
      var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { }
      if (!r.ok) { var er = new Error((j && (j.msg || j.message || j.error_description)) || 'Request failed'); er.status = r.status; throw er; }
      return j;
    });
  }
  function token() {
    var s = sess(); if (!s) return Promise.resolve(null);
    if (s.exp - 60 > Date.now() / 1000) return Promise.resolve(s.access_token);
    return fetch(BASE + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token }) })
      .then(parse).then(function (j) { saveSess(j); return j.access_token; })
      .catch(function () { jset('cnf-sess', null); return null; });
  }
  function http(path, o) {
    o = o || {};
    return token().then(function (tok) {
      if (!o.anon && !tok) throw new Error('Session expired - please log in again');
      var h = { apikey: KEY, 'Content-Type': 'application/json', Authorization: 'Bearer ' + (o.anon ? KEY : tok) };
      if (o.prefer) h.Prefer = o.prefer;
      return fetch(BASE + path, { method: o.method || 'GET', headers: h, body: o.body ? JSON.stringify(o.body) : undefined }).then(parse);
    });
  }
  function rawNick() { try { return localStorage.getItem('cnf-nick'); } catch (e) { return null; } }  // saved as plain text by leaderboard.html
  function joined() { return ON && sess() && rawNick(); }

  /* Score → validated RPC. Only called when a score beats the cached daily or all-time best. Resolves true when saved. */
  function submit(g, v, daily, quiet) {
    if (!joined()) { console.log('[cnf] guest mode: score kept in local cache only'); return Promise.resolve(false); }
    var body = { g: g, v: Math.round(v) }; if (daily === false) body.record_daily = false;
    return http('/rest/v1/rpc/submit_score', { method: 'POST', body: body })
      .then(function () { console.log('[cnf] score saved', g, Math.round(v), daily === false ? '(all-time only)' : ''); if (!quiet) toast('New best saved online ✓'); return true; })
      .catch(function (err) { console.error('Score sync failed', err); if (!quiet) toast('Score not saved online: ' + err.message); return false; });
  }

  /* Streak → validated RPC */
  function syncStreak() {
    if (!joined()) return Promise.resolve();
    var st = calc(), mark = todayStr() + ':' + st.cur + ':' + st.best;
    if (C.sSync === mark) return Promise.resolve();   // already sent
    return http('/rest/v1/rpc/submit_streak', {
      method: 'POST',
      body: { cur: st.cur, best: st.best, d: todayStr() }
    }).then(function () { C.sSync = mark; saveC(); }).catch(function (err) { console.error('Streak sync failed', err); });
  }

  /* ---------- public hook used by the games ---------- */
  function record(g, v) {
    console.log('[cnf] cnfScore called', g, v);
    v = +v; var info = gameInfo(g);
    if (!info || !isFinite(v)) return;
    v = (g === 'schulte' && v < 1000) ? Math.round(v * 1000) : Math.round(v);

    rollDaily();
    var low = info[2];
    var h = hist[g] || (hist[g] = []); h.push(v); if (h.length > 30) h.shift();
    var beatAll = pbs[g] == null || (low ? v < pbs[g] : v > pbs[g]);
    var dPrev = C.daily.best[g];
    var beatDay = dPrev == null || (low ? v < dPrev : v > dPrev);
    if (beatAll) pbs[g] = v;
    if (beatDay) C.daily.best[g] = v;
    saveC(); writeMirror(C);
    markActive();

    if (!beatAll && !beatDay) { console.log('[cnf] not a new daily/overall best - nothing sent'); return; }
    var pk = pkey(g, true);
    C.pending[pk] = { g: g, v: v, day: utcDay(), daily: true }; saveC();   // stays cached until the server confirms
    submit(g, v).then(function (ok) {
      if (ok) { delete C.pending[pk]; saveC(); if (typeof window.renderLeaderboard === 'function') window.renderLeaderboard(); }
    });
  }
  var stroopTimer;
  window.cnfScore = function (g, v) {
    // Stroop reports every correct click; only send the final value once the run pauses
    if (g === 'stroop') {
      clearTimeout(stroopTimer);
      stroopTimer = setTimeout(function () { record(g, v); }, 1500);
      return;
    }
    record(g, v);
  };

  /* ---------- toast + share ---------- */
  function toast(m) {
    var t = $('#cnf-toast');
    if (!t) { t = document.createElement('div'); t.id = 'cnf-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = m; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function share(text) {
    var url = /^https?:$/.test(location.protocol) ? location.href.split('#')[0] : '';
    if (navigator.share) { navigator.share({ title: 'Calm & Focus', text: text, url: url }).catch(function () { }); return; }
    var full = (text + ' ' + url).trim();
    (navigator.clipboard ? navigator.clipboard.writeText(full) : Promise.reject()).then(function () { toast('Copied to clipboard'); }, function () { toast('Copy not available'); });
  }

  /* ---------- progress dialog ---------- */
  var dlg;
  function spark(a, low) {
    if (!a || a.length < 2) return '<svg viewBox="0 0 80 22" aria-hidden="true"></svg>';
    var mn = Math.min.apply(null, a), mx = Math.max.apply(null, a), r = mx - mn || 1;
    var pts = a.map(function (v, i) { var y = (v - mn) / r; if (!low) y = 1 - y; return (i / (a.length - 1) * 78 + 1).toFixed(1) + ',' + (y * 18 + 2).toFixed(1); }).join(' ');
    return '<svg viewBox="0 0 80 22" aria-hidden="true"><polyline points="' + pts + '"/></svg>';
  }

  function renderProgressView() {
    var s = calc(), t = todayStr(), set = {}, strip = '';
    days.forEach(function (d) { set[d] = 1; });
    for (var i = 13; i >= 0; i--) { var d = addDays(t, -i); strip += '<i class="' + (set[d] ? 'on' : '') + '"><b></b>' + 'SMTWTFS'.charAt(new Date(d + 'T00:00:00Z').getUTCDay()) + '</i>'; }
    var rows = GAMES.map(function (g) { var pb = pbs[g[0]]; return '<div class="me-row"><span>' + g[1] + '</span>' + spark(hist[g[0]], g[2]) + '<b>' + (pb == null ? '–' : g[3](pb)) + '</b></div>'; }).join('');

    return '<div class="me-streak"><b>' + s.cur + '</b><div><strong>day streak</strong><small>Best: ' + s.best + (s.today ? ' · done today ✓' : ' · use any tool today to keep it going') + '</small></div></div>' +
      '<div class="me-week" aria-label="Last 14 days">' + strip + '</div><h3 class="me-h">Personal bests</h3>' + rows +
      '<div class="btn-row" style="margin-top: 20px;"><button class="btn ghost" type="button" data-act="share-progress">Share progress</button></div>' +
      '<p class="me-note" style="margin-top: 16px;">Streaks and scores are saved locally on your device. Visit the <a href="leaderboard.html" style="color: var(--sea);">Leaderboard page</a> to compete online!</p>';
  }

  function onClick(e) {
    if (e.target === dlg) { dlg.close(); return; }
    var t = e.target.closest('[data-act]'); if (!t) return;
    var a = t.dataset.act;
    if (a === 'close') dlg.close();
    else if (a === 'share-progress') { share('I’m on a ' + calc().cur + '-day streak on Calm & Focus. Take a calm minute:'); }
  }

  function openDlg() {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.id = 'me-dialog'; dlg.setAttribute('aria-labelledby', 'me-title');
      dlg.innerHTML = '<div class="me-sheet"><div class="me-head"><h2 id="me-title">My Streak &amp; Progress</h2><button type="button" class="me-close" data-act="close" aria-label="Close">✕</button></div><div id="me-body" style="padding: 4px 18px calc(20px + env(safe-area-inset-bottom, 0px)); overflow-y: auto;"></div></div>';
      document.body.appendChild(dlg);
      dlg.addEventListener('click', onClick);
    }
    $('#me-body').innerHTML = renderProgressView();
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
  }

  /* ---------- cloud snapshot -> cache ---------- */
  function cloudSnapshot(tok, uid) {
    var H = { apikey: KEY, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' };
    function get(p) { return fetch(BASE + p, { headers: H }).then(parse).catch(function (e) { console.error('[cnf] fetch failed', p, e); return null; }); }
    return Promise.all([
      get('/rest/v1/scores?user_id=eq.' + uid + '&select=game,value'),
      get('/rest/v1/daily_scores?user_id=eq.' + uid + '&day=eq.' + utcDay() + '&select=game,value'),
      get('/rest/v1/streaks?user_id=eq.' + uid + '&select=*')
    ]).then(function (r) {
      var sn = { pb: {}, daily: {}, days: [], bestStreak: 0, ok: !!(r[0] && r[1]) };
      (r[0] || []).forEach(function (x) { sn.pb[x.game] = +x.value; });
      (r[1] || []).forEach(function (x) { sn.daily[x.game] = +x.value; });
      var st = r[2] && r[2][0];
      if (st) {
        var cur = +st.current_streak || 0; sn.bestStreak = +st.best_streak || cur;
        var last = st.last_day || (st.updated_at || '').slice(0, 10);
        if (cur > 0 && /^\d{4}-\d{2}-\d{2}$/.test(last)) for (var i = cur - 1; i >= 0; i--) sn.days.push(addDays(last, -i));
      }
      return sn;
    });
  }
  /* login: build this account's cache from the database, then merge in the guest cache ONCE.
     The guest cache is claimed (read + deleted) by whoever logs in first, so its scores are never added twice
     and never reach a second account. Called by leaderboard.html after a successful login. */
  function better(g, a, b) { var lo = gameInfo(g) && gameInfo(g)[2]; return b == null || (lo ? a < b : a > b); }
  window.cnfLoginLoad = function (tok, uid) {
    return cloudSnapshot(tok, uid).then(function (sn) {
      var o = blank(); o.pb = sn.pb; o.daily = { day: utcDay(), best: sn.daily }; o.days = sn.days; o.bestStreak = sn.bestStreak; o.fetched = sn.ok;
      var own = jget('cnf-cache:' + uid, null), guest = jget('cnf-cache:guest', null);
      try { localStorage.removeItem('cnf-cache:guest'); } catch (e) { }          // claim: gone for everyone else
      var allT = {}, dayT = {};
      [own, guest].forEach(function (src) {
        if (!src || src.v !== 1) return;
        Object.keys(src.pb || {}).forEach(function (g) { if (gameInfo(g) && better(g, src.pb[g], o.pb[g])) { o.pb[g] = src.pb[g]; allT[g] = src.pb[g]; } });
        if (src.daily && src.daily.day === utcDay()) Object.keys(src.daily.best || {}).forEach(function (g) {
          if (gameInfo(g) && better(g, src.daily.best[g], o.daily.best[g])) { o.daily.best[g] = src.daily.best[g]; dayT[g] = src.daily.best[g]; }
        });
        Object.keys(src.hist || {}).forEach(function (g) { o.hist[g] = (o.hist[g] || []).concat(src.hist[g]).slice(-30); });
        (src.days || []).forEach(function (d) { if (o.days.indexOf(d) < 0) o.days.push(d); });
        o.days.sort(); if ((src.bestStreak || 0) > o.bestStreak) o.bestStreak = src.bestStreak;
        Object.keys(src.pending || {}).forEach(function (k) { o.pending[k] = src.pending[k]; });
      });
      Object.keys(dayT).forEach(function (g) { o.pending[pkey(g, true)] = { g: g, v: dayT[g], day: utcDay(), daily: true }; });
      Object.keys(allT).forEach(function (g) { if (allT[g] !== dayT[g]) o.pending[pkey(g, false)] = { g: g, v: allT[g], day: utcDay(), daily: false }; });
      jset('cnf-cache:' + uid, o); writeMirror(o, uid);
      var sends = Object.keys(o.pending).map(function (k) {                      // upload what beat the account's records
        var p = o.pending[k]; return submit(p.g, p.v, p.daily, true).then(function (ok) { if (ok) delete o.pending[k]; });
      });
      return Promise.all(sends).then(function () { jset('cnf-cache:' + uid, o); return o; });
    });
  };
  /* logout: reset this account's cache and the guest cache (called by leaderboard.html) */
  window.cnfLogoutClear = function () {
    try { localStorage.removeItem('cnf-cache:' + myId()); localStorage.removeItem('cnf-cache:guest'); } catch (e) { }
    writeMirror(null);
  };
  /* logged-in but no cloud data cached yet (new browser / cleared cache): fetch once */
  function fetchIfNeeded() {
    if (ID === 'guest' || C.fetched || !joined()) return;
    token().then(function (tok) {
      if (!tok) return;
      return cloudSnapshot(tok, ID).then(function (sn) {
        if (!sn.ok) return;
        Object.keys(sn.pb).forEach(function (g) { var lo = gameInfo(g) && gameInfo(g)[2]; if (pbs[g] == null || (lo ? sn.pb[g] < pbs[g] : sn.pb[g] > pbs[g])) pbs[g] = sn.pb[g]; });
        Object.keys(sn.daily).forEach(function (g) { var lo = gameInfo(g) && gameInfo(g)[2], d0 = C.daily.best[g]; if (d0 == null || (lo ? sn.daily[g] < d0 : sn.daily[g] > d0)) C.daily.best[g] = sn.daily[g]; });
        sn.days.forEach(function (d) { if (days.indexOf(d) < 0) days.push(d); });
        if (sn.bestStreak > (C.bestStreak || 0)) C.bestStreak = sn.bestStreak;
        C.fetched = true; saveC(); writeMirror(C, ID); badge();
      });
    });
  }

  function syncAll() {
    if (!joined()) return;
    fetchIfNeeded();
    rollDaily();
    Object.keys(C.pending).forEach(function (k) {   // scores that could not be sent earlier
      var p = C.pending[k]; submit(p.g, p.v, p.daily, true).then(function (ok) { if (ok) { delete C.pending[k]; saveC(); } });
    });
    syncStreak();
  }
  window.cnfSyncAll = syncAll;
  syncAll();

  /* ---------- wiring ---------- */
  badge();
  var me = $('#me-btn'); if (me) me.addEventListener('click', function () { openDlg(); });
  document.addEventListener('visibilitychange', badge);
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#breath-toggle,#shred-btn,#ground-btn,.sound-card,.bubble-btn')) markActive(); });

  function addShare(anchorId, id, build) {
    var a = document.getElementById(anchorId); if (!a) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn ghost'; b.id = id; b.textContent = 'Share result';
    a.parentNode.appendChild(b); b.addEventListener('click', function () { share(build()); });
  }
  addShare('reset-reflex', 'share-reflex', function () {
    var l = $('#stat-last').textContent, b = $('#stat-best').textContent;
    return l && l !== '–' ? 'My reaction time on Calm & Focus: ' + l + ' (best ' + b + '). Can you beat it?' : 'Test your reaction time on Calm & Focus.';
  });
  addShare('schulte-reset', 'share-schulte', function () {
    var b = $('#schulte-best').textContent;
    return b && b !== '–' ? 'My fastest Schulte grid on Calm & Focus: ' + b + '. Can you beat it?' : 'Try the Schulte grid focus test on Calm & Focus.';
  });

  var stop = document.getElementById('stop-sounds');
  if (stop) {
    var wrap = document.createElement('label'); wrap.className = 'sleep-timer';
    wrap.innerHTML = '<span>Sleep timer</span><select id="sleep-select" aria-label="Sleep timer"><option value="0">Off</option><option value="15">15 min</option><option value="30">30 min</option><option value="60">1 hour</option><option value="120">2 hours</option></select>';
    stop.parentNode.insertBefore(wrap, stop);
    var sel = wrap.querySelector('select'), st, fade;
    sel.addEventListener('change', function () {
      clearTimeout(st); clearInterval(fade);
      var m = +sel.value; if (!m) return;
      toast('Sounds will fade out in ' + (m >= 60 ? m / 60 + ' h' : m + ' min'));
      st = setTimeout(function () {
        var vol = $('#master-vol'), orig = vol.value, i = 0;
        fade = setInterval(function () {
          i++; vol.value = Math.round(orig * (1 - i / 20)); vol.dispatchEvent(new Event('input', { bubbles: true }));
          if (i >= 20) { clearInterval(fade); stop.click(); vol.value = orig; vol.dispatchEvent(new Event('input', { bubbles: true })); sel.value = '0'; }
        }, 1000);
      }, m * 60000);
    });
  }

  $$('.seq-pad').forEach(function (p, i) {
    p.tabIndex = 0; p.setAttribute('role', 'button'); p.setAttribute('aria-label', 'Pad ' + (i + 1));
    p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.click(); } });
  });
})();