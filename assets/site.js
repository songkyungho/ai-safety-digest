
function _copyFallback(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
}
function _entryCopyText(btn) {
  // 카드 하나의 평문: 제목, 빈 줄, 본문 문단들, 빈 줄, 원문 URL — 주간 하이라이트 복사와 같은 꼴.
  var card = btn.closest('article.entry');
  if (!card) return '';
  var h2 = card.querySelector(':scope > h2');
  var link = h2 ? h2.querySelector('a[href]') : null;
  var title = (link ? link.textContent : (h2 ? h2.textContent : '')).trim();
  var paras = [];
  card.querySelectorAll(':scope > p').forEach(function (p) {
    var c = p.cloneNode(true);
    c.querySelectorAll('.topic-icons').forEach(function (x) { x.parentNode.removeChild(x); });
    var t = c.textContent.trim();
    if (t) paras.push(t);
  });
  var parts = [title];
  if (paras.length) parts.push('', paras.join('\n\n'));
  if (link) parts.push('', link.getAttribute('href'));
  return parts.join('\n');
}
function copyEntry(btn) {
  var text = btn.getAttribute('data-copy');
  if (text === null) text = _entryCopyText(btn);
  var onDone = function () {
    var original = btn.textContent;
    btn.textContent = btn.getAttribute('data-copied') || '복사됨!';
    btn.classList.add('copied');
    setTimeout(function () {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, 1500);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(onDone, function () {
      _copyFallback(text);
      onDone();
    });
  } else {
    _copyFallback(text);
    onDone();
  }
}
function initDigestFilter() {
  var feed = document.querySelector('.digest-feed');
  if (!feed) return;
  var q = document.getElementById('digest-q');
  var chips = document.querySelectorAll('.filter-chip');
  var cards = feed.querySelectorAll('article.entry');
  var topic = '';
  var cat = '';
  function haystack(el) {
    // 제목·배지·출처·본문(관련 보도까지)을 소문자로 — 처음 한 번만 만들어 둔다.
    if (el._hay === undefined) el._hay = (el.textContent || '').toLowerCase();
    return el._hay;
  }
  function apply() {
    var needle = (q && q.value || '').trim().toLowerCase();
    cards.forEach(function (el) {
      var ok = true;
      if (topic && (el.getAttribute('data-topics') || '').split(/\s+/).indexOf(topic) < 0) ok = false;
      if (cat && el.getAttribute('data-cat') !== cat) ok = false;
      if (needle && haystack(el).indexOf(needle) < 0) ok = false;
      el.classList.toggle('digest-hidden', !ok);
    });
  }
  if (q) q.addEventListener('input', apply);
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var t = chip.getAttribute('data-topic') || '';
      var c = chip.getAttribute('data-cat-filter') || '';
      if (t) {
        topic = topic === t ? '' : t;
        chips.forEach(function (x) {
          if (x.getAttribute('data-topic')) x.classList.toggle('active', x.getAttribute('data-topic') === topic);
        });
      }
      if (c) {
        cat = cat === c ? '' : c;
        chips.forEach(function (x) {
          if (x.getAttribute('data-cat-filter')) x.classList.toggle('active', x.getAttribute('data-cat-filter') === cat);
        });
      }
      apply();
    });
  });
}
function initYearNav() {
  var nav = document.getElementById('yearNav');
  if (!nav) return;
  var groups = Array.prototype.slice.call(document.querySelectorAll('.year-group[id^="year-"]'));
  if (groups.length < 2) {
    nav.classList.add('hidden');
    nav.innerHTML = '';
    return;
  }
  nav.classList.remove('hidden');
  nav.innerHTML = groups.map(function (g) {
    var y = g.id.replace(/^year-/, '');
    return '<button type="button" class="year-nav-item" data-year="' + y + '">' + y + '</button>';
  }).join('');
  function setActive(y) {
    nav.querySelectorAll('.year-nav-item').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-year') === y);
    });
  }
  nav.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.year-nav-item');
    if (!btn) return;
    var y = btn.getAttribute('data-year');
    var el = document.getElementById('year-' + y);
    if (!el) return;
    var first = el.querySelector('details.archive-month');
    if (first && !first.open) first.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(y);
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      if (vis[0]) setActive(vis[0].target.id.replace(/^year-/, ''));
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
    groups.forEach(function (g) { io.observe(g); });
  }
}
function openHashTarget() {
  // 메인의 주간 하이라이트 줄은 summary/index.html#week-YYYY-MM-DD 로 온다.
  // 이전 달은 <details>로 접혀 있어 그대로면 앵커가 안 보이니 감싼 details를 연다.
  var id = decodeURIComponent((location.hash || '').slice(1));
  if (!id) return;
  var el = document.getElementById(id);
  if (!el) return;
  for (var p = el.parentElement; p; p = p.parentElement) {
    if (p.tagName === 'DETAILS') p.open = true;
  }
  el.scrollIntoView();
}
window.addEventListener('hashchange', openHashTarget);
document.addEventListener('DOMContentLoaded', function () {
  openHashTarget();
  initDigestFilter();
  initYearNav();
});
