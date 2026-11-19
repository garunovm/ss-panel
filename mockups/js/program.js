/*
  ИХС panel mockups — interactive programme editor (admin-program.html). Wanted also for the RF panel
  (congress / webinar programmes), user's sketch 2026-11-19:
  - course start date + default slot («регламент», 15 min) → dates and times of all items are CALCULATED;
  - items are reordered by drag-and-drop (also ↑/↓ buttons for keyboard and touch), times recalculated live;
  - an item may have its own slot length;
  - «+ Пункт» adds the item at once, opened for editing;
  - editing opens the item in place with all fields (no side drawer);
  - mentors are dragged from the list onto an item (also «Добавить докладчика» in the open item).
  Times are never typed: an item only has a duration; the day start comes from the day settings.
  Data: the real programme of the advanced course 23–24 Oct 2026 converted to order + durations.
*/
(function () {
  var SP = {
    kachesov: { n: 'Качесов А. В.', ini: 'КА' }, cherevcov: { n: 'Черевцов В. Н.', img: '../img/cherevcov.jpg' },
    protsko: { n: 'Процко В. Г.', ini: 'ПВ' }, kuznetsov: { n: 'Кузнецов В. В.', ini: 'КВ' }, skrebtsovA: { n: 'Скребцов А. В.', ini: 'СА' },
    skrebtsovV: { n: 'Скребцов В. В.', ini: 'СВ' }, ziatdinov: { n: 'Зиатдинов Б. Г.', img: '../img/ziatdinov.jpg' },
    ketov: { n: 'Кетов М. С.', ini: 'КМ', warn: 'карточка не заполнена' }, yakushev: { n: 'Якушев Д. С.', ini: 'ЯД' },
    gorohov: { n: 'Горохов А. В.', img: '../img/gorohov.jpg' }, tamoev: { n: 'Тамоев С. К.', img: '../img/tamoev.jpg' },
    pakhomov: { n: 'Пахомов И. А.', img: '../img/pakhomov.jpg' }
  };
  var TYPES = { lecture: 'Лекция', demo: 'Демонстрация', practice: 'Выполнение курсантами', org: 'Организационное', break: 'Перерыв' };
  var BLOCKS = { hall: 'Лекционный зал', lab: 'Кадаверная лаборатория' };
  var WD = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  var MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  // real programme (day, from, to, type, topic, speakers, block) → order + duration
  var RAW = [
    [1, '09:50', '10:00', 'org', 'Вступительное слово руководителя курса', ['kachesov'], 'hall'],
    [1, '10:00', '10:10', 'lecture', 'Хирургическая анатомия стопы', ['cherevcov'], 'hall'],
    [1, '10:10', '10:25', 'lecture', 'Клинический осмотр стопы', ['cherevcov'], 'hall'],
    [1, '10:25', '10:40', 'lecture', 'Импланты FootDoctor, индустриальная лекция', ['protsko'], 'hall'],
    [1, '10:40', '10:50', 'break', 'Перерыв', [], 'hall'],
    [1, '10:50', '11:05', 'lecture', 'Остеотомии первой плюсневой кости', ['kachesov'], 'hall'],
    [1, '11:05', '11:20', 'lecture', 'Hallux abductus', ['kuznetsov'], 'hall'],
    [1, '11:20', '11:30', 'lecture', 'Варианты Akin-остеотомии', ['skrebtsovA'], 'hall'],
    [1, '11:30', '11:45', 'lecture', 'Нюансы, резюме по первому лучу', ['protsko'], 'hall'],
    [1, '11:45', '12:00', 'break', 'Кофе-брейк, переодевание в хирургические костюмы', [], 'hall'],
    [1, '12:00', '12:10', 'demo', 'Хейлэктомия, SCARF', ['protsko'], 'lab'],
    [1, '12:10', '12:30', 'practice', 'Выполнение курсантами', [], 'lab'],
    [1, '13:15', '14:00', 'break', 'Обед', [], 'hall'],
    [1, '14:00', '14:20', 'lecture', 'Хирургия «малых» лучей', ['ziatdinov'], 'hall'],
    [1, '14:20', '14:35', 'lecture', 'Реконструкция плантарной пластинки «малых» лучей', ['cherevcov'], 'hall'],
    [1, '14:35', '14:45', 'break', 'Переодевание в хирургические костюмы', [], 'hall'],
    [1, '14:55', '15:10', 'demo', 'Неврома Мортона, тыльный и подошвенный доступы', ['cherevcov'], 'lab'],
    [1, '15:10', '15:15', 'practice', 'Выполнение курсантами', [], 'lab'],
    [1, '15:15', '15:30', 'demo', 'Шов плантарной пластинки с анкерной фиксацией', ['protsko'], 'lab'],
    [1, '16:05', '16:25', 'practice', 'Выполнение курсантами', [], 'lab'],
    [1, '16:30', '16:55', 'demo', 'Weil, Helal, Hohmann (вариант артродеза PIP)', ['ziatdinov'], 'lab'],
    [1, '16:55', '17:35', 'practice', 'Выполнение курсантами', [], 'lab'],
    [1, '17:35', '17:55', 'org', 'Обсуждение, вопросы', [], 'lab'],
    [2, '09:50', '10:00', 'org', 'Подведение итогов первого дня, слово ректора института', ['protsko'], 'hall'],
    [2, '10:00', '10:15', 'lecture', 'Техника Slide Down', ['ketov'], 'hall'],
    [2, '10:15', '10:30', 'lecture', 'Элевация первого луча', ['yakushev'], 'hall'],
    [2, '10:30', '10:45', 'lecture', 'Деформирующий артроз первого плюснефалангового сустава', ['kachesov'], 'hall'],
    [2, '10:45', '11:00', 'lecture', 'Hallux varus', ['protsko'], 'hall'],
    [2, '11:00', '11:20', 'break', 'Переодевание, кофе-брейк', [], 'hall'],
    [2, '11:00', '11:15', 'demo', 'Slide Down: отработка на пластиковой модели стопы', ['ketov'], 'lab'],
    [2, '11:15', '11:30', 'practice', 'Выполнение курсантами', [], 'lab'],
    [2, '11:35', '11:55', 'lecture', 'Варианты операций при элевации 1 пальца стопы', ['yakushev'], 'lab'],
    [2, '11:55', '12:10', 'demo', 'Операция при элевации 1 пальца стопы', ['yakushev'], 'lab'],
    [2, '12:25', '12:35', 'demo', 'Артродез первого плюснефалангового сустава', ['kachesov'], 'lab'],
    [2, '12:35', '12:45', 'demo', 'Артродез медиального плюснеклиновидного сустава (Альбрехт-Lapidus)', ['kuznetsov'], 'lab'],
    [2, '12:45', '13:10', 'practice', 'Выполнение курсантами', [], 'lab'],
    [2, '13:10', '13:40', 'break', 'Обед', [], 'hall'],
    [2, '13:40', '14:10', 'demo', 'Гемипротезирование плюснефаланговых суставов. Технология Vencer', ['skrebtsovV'], 'lab'],
    [2, '14:50', '15:05', 'demo', 'Артроз 2–3 предплюсне-плюсневых суставов стопы', ['kuznetsov'], 'lab'],
    [2, '15:05', '15:20', 'practice', 'Выполнение курсантами', [], 'lab'],
    [2, '15:20', '15:30', 'lecture', 'Синдром Haglund, варианты лечения', ['kachesov'], 'lab'],
    [2, '15:30', '15:45', 'demo', 'Анкерная фиксация ахиллова сухожилия к пяточной кости', ['protsko'], 'lab'],
    [2, '15:45', '16:00', 'practice', 'Выполнение курсантами', [], 'lab'],
    [2, '16:00', '16:15', 'break', 'Перерыв', [], 'lab'],
    [2, '16:15', '16:30', 'demo', 'Выделение нерва Бакстера', ['kachesov'], 'lab'],
    [2, '16:30', '16:50', 'practice', 'Выполнение курсантами', [], 'lab'],
    [2, '16:50', '17:05', 'lecture', 'Плосковальгусная деформация стопы, подтаранный артроэрез', ['gorohov'], 'lab'],
    [2, '17:10', '17:25', 'demo', 'Демонстрация артроэреза', ['gorohov', 'ketov'], 'lab'],
    [2, '17:25', '17:40', 'lecture', 'Техники Evans, Cotton, имплантация WPT (никелид титана)', ['ketov'], 'lab'],
    [2, '17:40', '18:00', 'demo', 'Демонстрация', ['ketov', 'gorohov'], 'lab']
  ];
  var min = function (t) { var a = t.split(':'); return +a[0] * 60 + +a[1]; };
  var hm = function (m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var S = { start: '2026-10-23', slot: 15, days: [{ start: '09:50', end: '18:00', items: [] }, { start: '09:50', end: '18:00', items: [] }] };
  var nextId = 1, openId = null, filter = '', locked = false;
  RAW.forEach(function (r) {
    var d = min(r[2]) - min(r[1]);
    S.days[r[0] - 1].items.push({ id: nextId++, type: r[3], topic: r[4], sp: r[5].slice(), block: r[6], dur: d === S.slot ? null : d });
  });

  var root = document.querySelector('[data-program]');
  var live = document.querySelector('[data-live]');
  var say = function (t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 30); };
  var dur = function (it) { return it.dur || S.slot; };
  var dayDate = function (i) { var d = new Date(S.start + 'T12:00:00'); d.setDate(d.getDate() + i); return d; };
  var dayTitle = function (i) { var d = dayDate(i); return 'День ' + (i + 1) + ' · ' + WD[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()]; };
  var ava = function (k) { var s = SP[k]; return '<span class="p-ava" aria-hidden="true">' + (s.img ? '<img src="' + s.img + '" alt="">' : s.ini) + '</span>'; };
  var find = function (id) { for (var d = 0; d < S.days.length; d++) { var i = S.days[d].items.findIndex(function (x) { return x.id === id; }); if (i > -1) return { d: d, i: i, it: S.days[d].items[i] }; } return null; };

  function times(day) { var t = min(day.start); return day.items.map(function (it) { var a = t; t += dur(it); return [a, t]; }); }

  function itemHTML(it, tm, dIdx) {
    var open = it.id === openId, hide = filter && it.sp.indexOf(filter) < 0;
    var warn = it.sp.filter(function (k) { return SP[k].warn; }).map(function (k) { return '<span class="badge badge--warn">' + SP[k].n + ': ' + SP[k].warn + '</span>'; }).join('');
    if ((it.type === 'lecture' || it.type === 'demo') && !it.sp.length) warn += '<span class="badge badge--warn">не указан докладчик</span>';
    var h = '<li class="pi pi--' + it.type + (open ? ' is-open' : '') + '" data-id="' + it.id + '" draggable="' + (!locked || dIdx !== 1) + '"' + (hide ? ' hidden' : '') + '>' +
      '<span class="pi__handle" aria-hidden="true" title="Перетащите">⋮⋮</span>' +
      '<span class="pi__time" data-time>' + hm(tm[0]) + '–' + hm(tm[1]) + '</span>' +
      '<span class="pi__main"><span class="pi__line"><span class="prog-type">' + TYPES[it.type] + '</span>' +
      '<button class="pi__dur' + (it.dur ? ' is-own' : '') + '" type="button" data-open="' + it.id + '" title="Длительность">' + dur(it) + ' мин' + (it.dur ? ' · свой' : '') + '</button></span>' +
      '<b class="pi__topic" data-topic>' + (esc(it.topic) || '<span class="muted">Новый пункт — введите тему</span>') + '</b>' +
      (it.sp.length ? '<span class="prog-sp">' + it.sp.map(function (k) { return '<span class="prog-chip">' + ava(k) + SP[k].n + '<button class="pi__x" type="button" data-unsp="' + it.id + ':' + k + '" aria-label="Убрать ' + SP[k].n + ' из пункта">✕</button></span>'; }).join('') + '</span>' : '') +
      (warn ? '<span class="prog-issues">' + warn + '</span>' : '') + '</span>' +
      '<span class="pi__tools"><button class="iconbtn pi__mv" type="button" data-mv="-1" data-mvid="' + it.id + '" aria-label="Выше: ' + esc(it.topic) + '">↑</button><button class="iconbtn pi__mv" type="button" data-mv="1" data-mvid="' + it.id + '" aria-label="Ниже: ' + esc(it.topic) + '">↓</button>' +
      '<button class="btn btn--outline btn--sm" type="button" data-open="' + it.id + '" aria-expanded="' + open + '">' + (open ? 'Свернуть' : 'Изменить') + '</button></span>';
    if (open) {
      h += '<div class="pi__edit">' +
        '<div class="field pi__f-topic"><label for="e-topic">Тема</label><input class="input" id="e-topic" data-f="topic" value="' + esc(it.topic) + '" placeholder="Тема пункта"></div>' +
        '<div class="field"><label for="e-type">Тип</label><select class="select" id="e-type" data-f="type">' + Object.keys(TYPES).map(function (k) { return '<option value="' + k + '"' + (k === it.type ? ' selected' : '') + '>' + TYPES[k] + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="e-block">Где</label><select class="select" id="e-block" data-f="block">' + Object.keys(BLOCKS).map(function (k) { return '<option value="' + k + '"' + (k === it.block ? ' selected' : '') + '>' + BLOCKS[k] + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><span class="label">Длительность</span><label class="check"><input type="checkbox" data-f="own"' + (it.dur ? ' checked' : '') + '><span>Свой регламент</span></label>' +
        '<span class="pi__durbox"><input class="input" id="e-dur" type="number" min="5" max="240" step="5" data-f="dur" value="' + dur(it) + '"' + (it.dur ? '' : ' disabled') + ' aria-label="Минут"> мин</span>' +
        '<span class="hint">' + (it.dur ? 'не зависит от общего регламента' : 'по общему регламенту: ' + S.slot + ' мин') + '</span></div>' +
        '<div class="field"><label for="e-sp">Добавить докладчика</label><select class="select" id="e-sp" data-f="sp"><option value="">— выберите —</option>' + Object.keys(SP).filter(function (k) { return it.sp.indexOf(k) < 0; }).map(function (k) { return '<option value="' + k + '">' + SP[k].n + '</option>'; }).join('') + '</select><span class="hint">или перетащите из списка менторов справа</span></div>' +
        '<div class="pi__editfoot"><button class="btn btn--danger btn--sm" type="button" data-del="' + it.id + '">Удалить пункт</button><button class="btn btn--primary btn--sm" type="button" data-open="' + it.id + '">Готово</button></div>' +
        '</div>';
    }
    return h + '</li>';
  }

  function render(focusSel) {
    var html = '';
    S.days.forEach(function (day, d) {
      var tm = times(day), endM = tm.length ? tm[tm.length - 1][1] : min(day.start), over = endM - min(day.end);
      var teach = day.items.reduce(function (s, it) { return s + (it.type === 'break' ? 0 : dur(it)); }, 0);
      var isLocked = locked && d === 1;
      html += '<section class="card prog-day' + (isLocked ? ' is-locked-day' : '') + '" data-day="' + d + '" aria-labelledby="hd' + d + '">' +
        '<div class="card__head"><div><h2 id="hd' + d + '">' + dayTitle(d) + '</h2><p class="muted" data-daysum="' + d + '">' + day.start + '–' + hm(endM) + ' · учебное время ' + Math.floor(teach / 60) + ' ч ' + (teach % 60) + ' мин · ' + day.items.length + ' пунктов</p></div>' +
        '<div class="prog-dayset"><label>Начало <input class="input" type="time" value="' + day.start + '" data-daystart="' + d + '"' + (isLocked ? ' disabled' : '') + '></label><label>Конец дня <input class="input" type="time" value="' + day.end + '" data-dayend="' + d + '"' + (isLocked ? ' disabled' : '') + '></label></div>' +
        (isLocked ? '<span class="lock"><span class="p-ava" style="background:#0068B0;color:#fff">ПА</span>Петрова А. правит этот день</span>' : '') +
        '</div>' +
        '<div class="prog-over" data-over="' + d + '"' + (over > 0 ? '' : ' hidden') + '>⚠ День заканчивается в ' + hm(endM) + ' — на ' + over + ' мин позже конца дня (' + day.end + '). Сократите пункты или регламент.</div>' +
        '<ol class="prog-list" data-list="' + d + '">';
      var block = '';
      day.items.forEach(function (it, i) {
        if (it.block !== block && it.type !== 'break') { block = it.block; html += '<li class="prog-block prog-block--' + block + '" aria-hidden="true">' + BLOCKS[block] + '</li>'; }
        html += itemHTML(it, tm[i], d);
      });
      html += '<li class="prog-drop-end" data-dropend="' + d + '" aria-hidden="true">перетащите сюда, чтобы поставить в конец дня</li></ol>' +
        '<div class="prog-add"><button class="btn btn--outline btn--sm" type="button" data-add="' + d + '"' + (isLocked ? ' disabled' : '') + '>+ Пункт</button><button class="btn btn--outline btn--sm" type="button" data-add="' + d + '" data-addtype="break"' + (isLocked ? ' disabled' : '') + '>+ Перерыв</button></div></section>';
    });
    root.innerHTML = html;
    renderSpeakers();
    document.querySelector('[data-count-items]').textContent = S.days.reduce(function (s, d) { return s + d.items.length; }, 0);
    if (focusSel) { var f = root.querySelector(focusSel); if (f) f.focus(); }
  }

  function retime() { // live update without rebuilding (keeps focus while typing)
    S.days.forEach(function (day, d) {
      var tm = times(day), endM = tm.length ? tm[tm.length - 1][1] : min(day.start), over = endM - min(day.end);
      var teach = day.items.reduce(function (s, it) { return s + (it.type === 'break' ? 0 : dur(it)); }, 0);
      day.items.forEach(function (it, i) {
        var li = root.querySelector('.pi[data-id="' + it.id + '"]'); if (!li) return;
        li.querySelector('[data-time]').textContent = hm(tm[i][0]) + '–' + hm(tm[i][1]);
        var b = li.querySelector('.pi__dur'); b.textContent = dur(it) + ' мин' + (it.dur ? ' · свой' : ''); b.classList.toggle('is-own', !!it.dur);
      });
      root.querySelector('[data-daysum="' + d + '"]').textContent = day.start + '–' + hm(endM) + ' · учебное время ' + Math.floor(teach / 60) + ' ч ' + (teach % 60) + ' мин · ' + day.items.length + ' пунктов';
      var o = root.querySelector('[data-over="' + d + '"]');
      o.hidden = over <= 0; o.textContent = '⚠ День заканчивается в ' + hm(endM) + ' — на ' + over + ' мин позже конца дня (' + day.end + '). Сократите пункты или регламент.';
    });
  }

  function renderSpeakers() {
    var cnt = {}; S.days.forEach(function (d) { d.items.forEach(function (it) { it.sp.forEach(function (k) { cnt[k] = (cnt[k] || 0) + 1; }); }); });
    document.querySelector('[data-speakers]').innerHTML = Object.keys(SP).sort(function (a, b) { return (cnt[b] || 0) - (cnt[a] || 0); }).map(function (k) {
      return '<li><button type="button" class="prog-spbtn" draggable="true" data-spdrag="' + k + '" data-sp="' + k + '" aria-pressed="' + (filter === k) + '" title="Перетащите на пункт или нажмите, чтобы показать его пункты">' +
        '<span class="pi__handle" aria-hidden="true">⋮⋮</span>' + ava(k) + '<span>' + SP[k].n + (SP[k].warn ? ' <span class="badge badge--warn">!</span>' : '') + '</span><span class="muted">' + (cnt[k] || '—') + '</span></button></li>';
    }).join('');
    document.querySelector('[data-sp-reset]').hidden = !filter;
  }

  function move(id, toDay, toIdx) {
    var f = find(id); if (!f) return;
    S.days[f.d].items.splice(f.i, 1);
    if (f.d === toDay && toIdx > f.i) toIdx--;
    toIdx = Math.max(0, Math.min(toIdx, S.days[toDay].items.length));
    S.days[toDay].items.splice(toIdx, 0, f.it);
    render();
    var tm = times(S.days[toDay])[toIdx];
    say('«' + (f.it.topic || 'Новый пункт') + '» — день ' + (toDay + 1) + ', ' + hm(tm[0]) + '–' + hm(tm[1]) + '. Время пересчитано.');
  }

  /* ---- clicks ---- */
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-open]'))) { var id = +t.getAttribute('data-open'); openId = openId === id ? null : id; render(openId ? '#e-topic' : '[data-open="' + id + '"]'); return; }
    if ((t = e.target.closest('[data-mv]'))) {
      var f = find(+t.getAttribute('data-mvid')), dir = +t.getAttribute('data-mv'), to = f.i + dir, td = f.d;
      if (to < 0) { if (f.d === 0) return; td = f.d - 1; to = S.days[td].items.length; }
      else if (to >= S.days[f.d].items.length) { if (f.d === S.days.length - 1) return; td = f.d + 1; to = 0; }
      else if (dir > 0) to++;
      move(f.it.id, td, to);
      var b = root.querySelector('[data-mvid="' + f.it.id + '"][data-mv="' + dir + '"]'); if (b) b.focus();
      return;
    }
    if ((t = e.target.closest('[data-add]'))) {
      var d = +t.getAttribute('data-add'), brk = t.getAttribute('data-addtype') === 'break';
      var it = { id: nextId++, type: brk ? 'break' : 'lecture', topic: brk ? 'Перерыв' : '', sp: [], block: (S.days[d].items.slice(-1)[0] || {}).block || 'hall', dur: null };
      S.days[d].items.push(it); openId = brk ? null : it.id;
      render(brk ? null : '#e-topic');
      say((brk ? 'Перерыв' : 'Пункт') + ' добавлен в конец дня ' + (d + 1) + '.');
      return;
    }
    if ((t = e.target.closest('[data-del]'))) {
      var g = find(+t.getAttribute('data-del')); S.days[g.d].items.splice(g.i, 1); openId = null; render(); say('Пункт удалён, время пересчитано.'); return;
    }
    if ((t = e.target.closest('[data-unsp]'))) {
      var p = t.getAttribute('data-unsp').split(':'), h = find(+p[0]); h.it.sp = h.it.sp.filter(function (k) { return k !== p[1]; }); render(); say(SP[p[1]].n + ' убран из пункта.'); return;
    }
    if ((t = e.target.closest('[data-sp]'))) { var k = t.getAttribute('data-sp'); filter = filter === k ? '' : k; render(); return; }
    if (e.target.closest('[data-sp-reset]')) { filter = ''; render(); return; }
  });

  /* ---- live edits ---- */
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.matches('[data-slot]')) { var v = +t.value; if (v >= 5) { S.slot = v; retime(); } return; }
    if (t.matches('[data-daystart]')) { if (t.value) { S.days[+t.getAttribute('data-daystart')].start = t.value; retime(); } return; }
    if (t.matches('[data-dayend]')) { if (t.value) { S.days[+t.getAttribute('data-dayend')].end = t.value; retime(); } return; }
    if (t.matches('[data-startdate]')) { if (t.value) { S.start = t.value; S.days.forEach(function (d, i) { root.querySelector('#hd' + i).textContent = dayTitle(i); }); } return; }
    var li = t.closest('.pi'); if (!li) return; var it = find(+li.getAttribute('data-id')).it;
    if (t.matches('[data-f="topic"]')) { it.topic = t.value; li.querySelector('[data-topic]').textContent = t.value || 'Новый пункт — введите тему'; }
    if (t.matches('[data-f="dur"]')) { var m = +t.value; if (m >= 5) { it.dur = m; retime(); } }
  });
  document.addEventListener('change', function (e) {
    var t = e.target, li = t.closest('.pi'); if (!li) return; var it = find(+li.getAttribute('data-id')).it;
    if (t.matches('[data-f="type"]')) { it.type = t.value; render('#e-type'); }
    if (t.matches('[data-f="block"]')) { it.block = t.value; render('#e-block'); }
    if (t.matches('[data-f="own"]')) { it.dur = t.checked ? dur(it) : null; render(t.checked ? '#e-dur' : '[data-f="own"]'); }
    if (t.matches('[data-f="sp"]') && t.value) { it.sp.push(t.value); var n = SP[t.value].n; render('#e-sp'); say(n + ' добавлен в пункт.'); }
  });

  /* ---- drag and drop: items between positions/days, mentors onto items ---- */
  var drag = null; // {kind:'item', id} | {kind:'sp', key}
  var clearMarks = function () { root.querySelectorAll('.is-drop-before,.is-drop-after,.is-drop-sp,.is-drop-end').forEach(function (x) { x.classList.remove('is-drop-before', 'is-drop-after', 'is-drop-sp', 'is-drop-end'); }); };
  document.addEventListener('dragstart', function (e) {
    var sp = e.target.closest && e.target.closest('[data-spdrag]');
    if (sp) { drag = { kind: 'sp', key: sp.getAttribute('data-spdrag') }; e.dataTransfer.setData('text/plain', SP[drag.key].n); e.dataTransfer.effectAllowed = 'copy'; document.body.classList.add('is-sp-dragging'); return; }
    var li = e.target.closest && e.target.closest('.pi');
    if (li && !e.target.closest('.pi__edit')) { drag = { kind: 'item', id: +li.getAttribute('data-id') }; e.dataTransfer.setData('text/plain', 'item'); e.dataTransfer.effectAllowed = 'move'; setTimeout(function () { li.classList.add('is-dragging'); }, 0); }
  });
  document.addEventListener('dragend', function () { drag = null; clearMarks(); document.body.classList.remove('is-sp-dragging'); root.querySelectorAll('.is-dragging').forEach(function (x) { x.classList.remove('is-dragging'); }); });
  root.addEventListener('dragover', function (e) {
    if (!drag) return;
    var day = e.target.closest('.prog-day'); if (!day || (locked && day.getAttribute('data-day') === '1')) return;
    var li = e.target.closest('.pi'), end = e.target.closest('[data-dropend]');
    clearMarks();
    if (drag.kind === 'sp') { if (li) { e.preventDefault(); li.classList.add('is-drop-sp'); } return; }
    e.preventDefault();
    if (li) { var r = li.getBoundingClientRect(); li.classList.add(e.clientY < r.top + r.height / 2 ? 'is-drop-before' : 'is-drop-after'); }
    else if (end) end.classList.add('is-drop-end');
  });
  root.addEventListener('drop', function (e) {
    if (!drag) return; e.preventDefault();
    var li = e.target.closest('.pi'), end = e.target.closest('[data-dropend]'), day = e.target.closest('.prog-day');
    if (drag.kind === 'sp') {
      if (li) { var it = find(+li.getAttribute('data-id')).it; if (it.sp.indexOf(drag.key) < 0) it.sp.push(drag.key); var n = SP[drag.key].n; drag = null; render(); say(n + ' добавлен в «' + it.topic + '».'); }
      return;
    }
    var d = +day.getAttribute('data-day');
    if (li) { var tgt = find(+li.getAttribute('data-id')); if (tgt.it.id === drag.id) return; move(drag.id, d, tgt.i + (li.classList.contains('is-drop-after') ? 1 : 0)); }
    else if (end) move(drag.id, d, S.days[d].items.length);
    drag = null;
  });

  /* ---- presence demo: a colleague edits day 2 ---- */
  var pd = document.querySelector('[data-presence-demo]');
  if (pd) pd.addEventListener('click', function () {
    locked = !locked; pd.setAttribute('aria-pressed', locked ? 'true' : 'false');
    document.querySelector('[data-presence]').hidden = !locked; render();
  });

  window.__prog = { S: S, move: move, render: render }; // for the mockup tests
  render();
})();
