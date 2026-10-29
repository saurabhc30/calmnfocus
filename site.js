(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme-btn');
  if (btn) btn.addEventListener('click', function () {
    var next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('cnf-theme', next); } catch (e) { }
  });
  var here = location.pathname.split('/').pop() || 'index.html';
  Array.prototype.forEach.call(document.querySelectorAll('footer nav:not(.foot-tools) a'), function (a) {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-scroll]'), function (b) {
    b.addEventListener('click', function () {
      var t = document.getElementById(b.getAttribute('data-scroll'));
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  var form = document.getElementById('contact-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);
    var body = (d.get('message') || '') + '\n\n— ' + (d.get('name') || '') + ' (' + (d.get('email') || '') + ')';
    location.href = 'mailto:support@calmnfocus.com?subject=' + encodeURIComponent('[Calm & Focus] ' + (d.get('topic') || 'Message')) + '&body=' + encodeURIComponent(body);
  });
})();

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { }); });
}
