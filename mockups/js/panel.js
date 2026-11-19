/*
  ИХС panel mockups — shell and demo behaviour.
  <body data-app="admin|doctor" data-page="..."> → sidebar + header are rendered here.
  - [data-tabs]            tabs: buttons [data-tab="id"] show panels [data-tabpanel="id"]
  - [data-filter="#tbl"]   chips filter rows tr[data-tags~="value"]; [data-search] filters by text
  - [data-presence-demo]   WebSocket demo: «Петрова сейчас редактирует», field lock, live update
  - [data-q-accept] / [data-q-return] confirmation queue
  - [data-drawer-open="id"] / [data-drawer-close]   side form
  - [data-toast="text"]    any button: shows a toast (demo save)
  Data are examples. Menu items with href="#" are later screens.
*/
(function () {
  var ICON = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 6 4.8"/>',
    schema: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
    queue: '<path d="M4 6h16M4 12h10M4 18h7"/><path d="M16 16l2 2 4-4"/>',
    course: '<path d="M2 8l10-4 10 4-10 4z"/><path d="M6 10v5c3 2.5 9 2.5 12 0v-5"/>',
    program: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    clinic: '<path d="M4 21V7l8-4 8 4v14"/><path d="M10 21v-5h4v5M12 8v4M10 10h4"/>',
    dict: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    users: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    log: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    api: '<path d="M8 6l-5 6 5 6M16 6l5 6-5 6M14 4l-4 16"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17a3.5 3.5 0 0 1 7 0M15 10h3M15 14h3"/>',
    slots: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h3M13 14h3M8 17h3"/>',
    visits: '<path d="M9 5h6M9 3h6v4H9z"/><rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 13l2 2 4-4"/>'
  };
  var MENU = {
    admin: [
      { title: 'Работа', items: [
        { id: 'home', t: 'Главная', i: 'home', href: '#' },
        { id: 'queue', t: 'На подтверждение', i: 'queue', href: 'admin-queue.html', badge: '3' }
      ] },
      { title: 'Специалисты', items: [
        { id: 'specialists', t: 'Специалисты', i: 'people', href: 'admin-specialists.html' },
        { id: 'schema', t: 'Схема карточки', i: 'schema', href: 'admin-card-schema.html' }
      ] },
      { title: 'Обучение', items: [
        { id: 'courses', t: 'Курсы и запуски', i: 'course', href: 'admin-courses.html' },
        { id: 'program', t: 'Программы', i: 'program', href: 'admin-program.html' }
      ] },
      { title: 'Справочники', items: [
        { id: 'clinics', t: 'Клиники и места', i: 'clinic', href: 'admin-clinics.html' },
        { id: 'dicts', t: 'Списки значений', i: 'dict', href: 'admin-dicts.html' }
      ] },
      { title: 'Система', items: [
        { id: 'users', t: 'Пользователи и роли', i: 'users', href: '#' },
        { id: 'api', t: 'Сайты и ключи API', i: 'api', href: '#' },
        { id: 'log', t: 'Журнал', i: 'log', href: '#' }
      ] }
    ],
    doctor: [
      { title: 'Кабинет врача', items: [
        { id: 'card', t: 'Моя карточка', i: 'card', href: '#' },
        { id: 'slots', t: 'Слоты', i: 'slots', href: '#' },
        { id: 'visits', t: 'Записи', i: 'visits', href: '#' }
      ] }
    ]
  };
  var USER = {
    admin: { ini: 'ИС', name: 'Смирнова Ирина', role: 'менеджер' },
    doctor: { ini: 'ЧВ', name: 'Черевцов В. Н.', role: 'врач', img: '../img/cherevcov.jpg' }
  };
  var app = document.body.getAttribute('data-app') || 'admin';
  var page = document.body.getAttribute('data-page');
  var svg = function (k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[k] || '') + '</svg>'; };

  var side = document.querySelector('[data-shell="side"]');
  if (side) {
    side.outerHTML = '<aside class="p-side" id="pSide" aria-label="Меню панели">' +
      '<a class="p-brand" href="index.html"><img src="../img/logo.png" alt=""><span><b>Институт хирургии стопы</b><span class="p-brand__app">' + (app === 'doctor' ? 'кабинет врача · doctor' : 'панель · admin') + '</span></span></a>' +
      '<nav class="p-nav">' + MENU[app].map(function (g) {
        return '<div><h2>' + g.title + '</h2><ul>' + g.items.map(function (m) {
          return '<li><a href="' + m.href + '"' + (m.id === page ? ' aria-current="page"' : '') + '>' + svg(m.i) + '<span>' + m.t + '</span>' +
            (m.badge ? '<span class="p-nav__badge" aria-label="' + m.badge + ' ждут">' + m.badge + '</span>' : '') + '</a></li>';
        }).join('') + '</ul></div>';
      }).join('') + '</nav></aside>';
  }
  var head = document.querySelector('[data-shell="head"]');
  if (head) {
    var u = USER[app];
    var ava = function (x) { return '<span class="p-ava">' + (x.img ? '<img src="' + x.img + '" alt="">' : x.ini) + '</span>'; };
    head.outerHTML = '<div class="p-pilot">Макет панели (пилот): данные — примеры; программа — по реальной программе продвинутого курса 23–24 октября 2026.</div>' +
      '<header class="p-head"><div class="p-head__left">' +
      '<button class="iconbtn p-burger" type="button" aria-label="Меню" aria-controls="pSide" aria-expanded="false" data-burger>☰</button>' +
      '<label class="vh" for="pSearch">Поиск по панели</label><input class="p-search" id="pSearch" type="search" placeholder="Поиск: специалист, курс, клиника…"></div>' +
      '<div class="p-head__right">' +
      (app === 'admin' ? '<div class="p-online" title="Сейчас в панели: Петрова А. (учебная часть), Орлов Д. (менеджер)"><span class="vh">Сейчас в панели: Петрова А., Орлов Д.</span><span class="p-ava" aria-hidden="true" style="background:#0068B0;color:#fff">ПА</span><span class="p-ava" aria-hidden="true" style="background:#2A3466;color:#fff">ОД</span></div>' : '') +
      '<div class="p-user">' + ava(u) + '<span><b>' + u.name + '</b><small>' + u.role + '</small></span></div>' +
      '<a class="btn btn--outline btn--sm" href="index.html">Выйти</a></div></header>';
  }
  var burger = document.querySelector('[data-burger]');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = !document.body.classList.contains('is-nav-open');
      document.body.classList.toggle('is-nav-open', open); burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (document.body.classList.contains('is-nav-open') && !e.target.closest('.p-side') && !e.target.closest('[data-burger]')) { document.body.classList.remove('is-nav-open'); burger.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* toast */
  var toastEl;
  window.panelToast = function (text) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = text; toastEl.hidden = false;
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.hidden = true; }, 3500);
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-toast]'); if (b) { e.preventDefault(); window.panelToast(b.getAttribute('data-toast')); }
  });

  /* tabs */
  document.querySelectorAll('[data-tabs]').forEach(function (bar) {
    var root = bar.closest('[data-tabs-root]') || document;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]'); if (!b) return;
      bar.querySelectorAll('[data-tab]').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); x.tabIndex = x === b ? 0 : -1; });
      root.querySelectorAll('[data-tabpanel]').forEach(function (p) { p.hidden = p.getAttribute('data-tabpanel') !== b.getAttribute('data-tab'); });
    });
    bar.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var t = [].slice.call(bar.querySelectorAll('[data-tab]')), i = t.indexOf(document.activeElement); if (i < 0) return;
      var n = t[(i + (e.key === 'ArrowRight' ? 1 : t.length - 1)) % t.length]; n.focus(); n.click();
    });
  });

  /* table filter: chips + search */
  document.querySelectorAll('[data-filter]').forEach(function (bar) {
    var tbl = document.querySelector(bar.getAttribute('data-filter'));
    var search = document.querySelector('[data-search="' + bar.getAttribute('data-filter') + '"]');
    var count = document.querySelector('[data-count="' + bar.getAttribute('data-filter') + '"]');
    var tag = '';
    var apply = function () {
      var q = search ? search.value.trim().toLowerCase() : '', n = 0;
      tbl.querySelectorAll('tbody tr:not(.row-edit)').forEach(function (tr) {
        var ok = (!tag || (' ' + tr.getAttribute('data-tags') + ' ').indexOf(' ' + tag + ' ') > -1) && (!q || tr.textContent.toLowerCase().indexOf(q) > -1);
        tr.hidden = !ok; if (ok) n++;
        var ed = tr.nextElementSibling; // inline edit row (dicts.js): hide with its row, keep closed state
        if (ed && ed.classList.contains('row-edit') && !ok) ed.hidden = true;
      });
      if (count) count.textContent = 'Показано: ' + n;
    };
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tag]'); if (!b) return;
      tag = b.getAttribute('data-tag');
      bar.querySelectorAll('[data-tag]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      apply();
    });
    if (search) search.addEventListener('input', apply);
    apply();
  });

  /* drawer */
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-drawer-open]');
    if (o) { var d = document.getElementById(o.getAttribute('data-drawer-open')); d.hidden = false; d.previousElementSibling.hidden = false; var f = d.querySelector('input,select,textarea'); if (f) f.focus(); d._opener = o; }
    var c = e.target.closest('[data-drawer-close]');
    if (c) { var dr = c.closest('.drawer') || c.nextElementSibling; dr.hidden = true; dr.previousElementSibling.hidden = true; if (dr._opener) dr._opener.focus(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.drawer:not([hidden])').forEach(function (d) { d.hidden = true; d.previousElementSibling.hidden = true; if (d._opener) d._opener.focus(); });
  });

  /* confirmation queue */
  var qLeft = function () {
    var n = document.querySelectorAll('.qitem:not(.is-done)').length, c = document.querySelector('[data-q-count]');
    if (c) c.textContent = n ? 'Ждут: ' + n : 'Очередь пуста';
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-q-accept]');
    if (a) {
      var it = a.closest('.qitem'); it.classList.add('is-done');
      it.querySelector('[data-q-status]').outerHTML = '<span class="badge badge--ok">✓ Принято — уходит на ' + it.getAttribute('data-sites') + ' при следующем обмене</span>';
      window.panelToast('Принято. Врач получит уведомление.'); qLeft();
    }
    var r = e.target.closest('[data-q-return]');
    if (r) { var box = r.closest('.qitem').querySelector('.qitem__reason'); box.hidden = false; box.querySelector('textarea').focus(); }
    var s = e.target.closest('[data-q-send]');
    if (s) {
      var q = s.closest('.qitem'), ta = q.querySelector('.qitem__reason textarea');
      if (!ta.value.trim()) { ta.setAttribute('aria-invalid', 'true'); ta.focus(); return; }
      q.classList.add('is-done'); q.querySelector('.qitem__reason').hidden = true;
      q.querySelector('[data-q-status]').outerHTML = '<span class="badge badge--bad">✕ Возвращено: «' + ta.value.trim().replace(/[<>&]/g, '') + '»</span>';
      window.panelToast('Возвращено врачу с причиной.'); qLeft();
    }
  });
  qLeft();

  /* presence demo (WebSocket, Laravel Reverb): someone else is editing a field */
  var pd = document.querySelector('[data-presence-demo]');
  if (pd) {
    pd.addEventListener('click', function () {
      var banner = document.querySelector('[data-presence]'), f = document.querySelector('[data-lockable]');
      var on = banner.hidden;
      banner.hidden = !on;
      f.classList.toggle('is-locked-field', on);
      f.setAttribute('data-lock', 'Петрова А. правит');
      f.querySelectorAll('input,textarea,button').forEach(function (x) { x.disabled = on; });
      pd.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (!on) {
        var live = document.querySelector('[data-live-target]');
        if (live) { live.value = live.getAttribute('data-live-target'); }
        window.panelToast('Петрова А. сохранила «Регалии» — поле обновилось у вас без перезагрузки.');
      }
    });
  }
})();
