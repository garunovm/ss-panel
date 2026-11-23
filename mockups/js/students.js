/*
  ИХС panel mockups — students of a run (admin-run-master.html).
  - [data-doc-ok]    accept a document → badge «✓ принято», the row's pill turns green
  - [data-doc-ret]   opens the reason; [data-doc-send] returns the document with the reason
                     (the student sees it in the site cabinet «Документы слушателя» and gets an e-mail)
  - #reg                registry of all students (admin-students-all.html): all / new / old + run, course, year,
                       specialty, city + quick chips — all combine; a row opens the student card in the right
                       side panel (#stuCard) from window.STUDENTS; #id in the address opens that card
  - #att [data-day]     run documents (admin-run-adv.html): attendance -> attestation («не допущен» if a day is missed)
  - [data-rdoc]         documents in the legal order: «Сформировать» -> «Отправить на подпись» -> «Подписать ЭЦП»;
                        signing a document opens the next step
  - [data-frdo-build]   ФИС ФРДО batch (admin-run-adv.html): build file for ready rows -> «отправлено» -> «принято»
  Row open/close is dicts.js ([data-row-toggle]).
*/
(function () {
  var NAMES = { 'Дата рождения': 0, 'СНИЛС': 1, 'Диплом': 2 };
  function setPill(dcheck, cls, sym, label) {
    var tr = dcheck.closest('tr.row-edit').previousElementSibling;
    var name = dcheck.querySelector('.dcheck__head b').textContent;
    var pill = tr.querySelectorAll('.dk')[NAMES[name]];
    if (pill) { pill.className = 'dk dk--' + cls; pill.firstChild.textContent = sym; pill.querySelector('.vh').textContent = ': ' + label; pill.title = name + ': ' + label; }
    var all = [].map.call(tr.querySelectorAll('.dk'), function (p) { return p.className; });
    var stage = all.some(function (c) { return /bad/.test(c); }) ? 'bad' : all.some(function (c) { return /none/.test(c); }) ? 'none' : all.some(function (c) { return /check/.test(c); }) ? 'check' : 'ready';
    tr.setAttribute('data-tags', stage); tr.classList.toggle('is-bad', stage === 'bad');
    var done = document.querySelectorAll('#stu tbody tr[data-tags="ready"]').length, now = document.querySelector('.pipe .is-now b');
    if (now) now.textContent = done + ' из ' + now.textContent.split(' из ')[1];
  }
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-doc-ok]'))) {
      var d = t.closest('[data-dcheck]');
      d.querySelector('[data-dstate]').className = 'badge badge--ok'; d.querySelector('[data-dstate]').textContent = '✓ принято';
      d.querySelector('.dcheck__acts').remove(); var r = d.querySelector('.dcheck__reason'); if (r) r.remove();
      setPill(d, 'ok', '✓', 'принято');
      window.panelToast(d.querySelector('b').textContent + ': принято. Курсант увидит это в кабинете.');
      return;
    }
    if ((t = e.target.closest('[data-doc-ret]'))) { var box = t.closest('[data-dcheck]').querySelector('.dcheck__reason'); box.hidden = false; box.querySelector('textarea').focus(); return; }
    if ((t = e.target.closest('[data-doc-send]'))) {
      var dc = t.closest('[data-dcheck]'), ta = dc.querySelector('textarea');
      if (!ta.value.trim()) { ta.setAttribute('aria-invalid', 'true'); ta.focus(); return; }
      dc.querySelector('[data-dstate]').className = 'badge badge--bad'; dc.querySelector('[data-dstate]').textContent = '✕ возвращено';
      var note = document.createElement('p'); note.className = 'dcheck__note'; note.textContent = 'Возвращено сейчас: ' + ta.value.trim();
      dc.querySelector('.dcheck__acts').replaceWith(note); t.closest('.dcheck__reason').remove();
      setPill(dc, 'bad', '✕', 'нужно исправить');
      window.panelToast('Возвращено курсанту — письмо и отметка в кабинете.');
    }
  });

  /* registry: filters (all / new / old, run, course, year, specialty, city, quick chips) — all combine */
  var reg = document.getElementById('reg');
  if (reg) {
    var rtag = '', kind = '';
    var val = function (k) { var e = document.querySelector('[data-rf="' + k + '"]'); return e ? e.value.trim() : ''; };
    var has = function (tr, attr, v) { return !v || (' ' + tr.getAttribute(attr) + ' ').indexOf(' ' + v + ' ') > -1; };
    var DATA = window.STUDENTS || {};
    var apply = function () {
      var q = val('q').toLowerCase(), n = 0, all = reg.querySelectorAll(':scope > tbody > tr');
      all.forEach(function (tr) {
        var d = DATA[tr.getAttribute('data-id')] || { runs: [] };
        var hay = (tr.textContent + ' ' + d.runs.map(function (r) { return r.order + ' ' + r.cert; }).join(' ')).toLowerCase();
        var ok = has(tr, 'data-runs', val('run')) && has(tr, 'data-courses', val('course')) && has(tr, 'data-years', val('year')) && has(tr, 'data-spec', val('spec')) &&
          (!val('city') || tr.getAttribute('data-city') === val('city')) && has(tr, 'data-tags', rtag) && has(tr, 'data-tags', kind) && (!q || hay.indexOf(q) > -1);
        tr.hidden = !ok; if (ok) n++;
      });
      document.querySelector('[data-rf-count]').textContent = 'Показано: ' + n + ' из ' + all.length;
      document.querySelector('[data-rf-empty]').hidden = n > 0;
    };
    var press = function (box, attr, b) { box.querySelectorAll('[' + attr + ']').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); };
    document.querySelectorAll('[data-rf]').forEach(function (e) { e.addEventListener(e.tagName === 'SELECT' ? 'change' : 'input', apply); });
    document.querySelector('[data-rf-chips]').addEventListener('click', function (e) { var b = e.target.closest('[data-rtag]'); if (!b) return; rtag = b.getAttribute('data-rtag'); press(this, 'data-rtag', b); apply(); });
    document.querySelector('[data-rf-kind]').addEventListener('click', function (e) { var b = e.target.closest('[data-kind]'); if (!b) return; kind = b.getAttribute('data-kind'); press(this, 'data-kind', b); apply(); });
    document.querySelector('[data-rf-reset]').addEventListener('click', function () {
      document.querySelectorAll('[data-rf]').forEach(function (e) { e.value = ''; });
      rtag = ''; kind = '';
      press(document.querySelector('[data-rf-chips]'), 'data-rtag', document.querySelector('[data-rtag=""]'));
      press(document.querySelector('[data-rf-kind]'), 'data-kind', document.querySelector('[data-kind=""]'));
      apply();
    });
    apply();

    /* student card in the right side panel */
    var card = document.getElementById('stuCard'), back = document.querySelector('[data-card-close]'), opener = null;
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var DOCL = { ok: ['dk--ok', '✓ приняты'], check: ['dk--check', '● на проверке'], bad: ['dk--bad', '✕ нужно исправить'], none: ['dk--none', '— не загружены'] };
    var RS = { done: ['cr--done', 'прошёл'], paid: ['cr--paid', 'записан'], wait: ['cr--wait', 'ждёт оплаты'], cancel: ['cr--cancel', 'отменена'] };
    var FRL = { sent: '<span class="badge badge--ok">передано</span>', ready: '<span class="badge badge--warn">к выгрузке</span>', no: '<span class="badge badge--bad">нет удостоверения</span>', '-': '<span class="muted">—</span>' };
    var EV = { order: ['+', 'ev--order'], pay: ['₽', 'ev--pay'], doc: ['↑', 'ev--doc'], ok: ['✓', 'ev--ok'], course: ['★', 'ev--course'], cert: ['№', 'ev--cert'], frdo: ['⇪', 'ev--frdo'], cancel: ['✕', 'ev--cancel'],
      mail: ['✉', 'ev--mail'], call: ['☎', 'ev--call'], note: ['✎', 'ev--note'], edit: ['✎', 'ev--edit'] };
    /* card in two columns (2026-11-23): «Курсант» — what the student filled in, editable in place; «Взаимодействие» — courses and history */
    var EVG = function (e) { return /^(order|pay|cancel)$/.test(e.t) ? 'orders' : (e.t === 'doc' || e.t === 'edit' || (e.t === 'ok' && /документ/i.test(e.x))) ? 'docs' : /^(mail|call|note)$/.test(e.t) ? 'comm' : 'course'; };
    var FILTERS = [['', 'Все'], ['orders', 'Заявки и оплаты'], ['docs', 'Документы'], ['course', 'Курсы'], ['comm', 'Письма и звонки']];
    var ME = 'Смирнова И. (менеджер)', TODAY = '23.11.2026';
    var dkey = function (s) { var a = s.split('.'); return a[2] + a[1] + a[0]; };
    var fdate = function (iso) { return iso ? iso.split('-').reverse().join('.') : ''; };
    var dash = function (v) { return v ? esc(v) : '<span class="muted">—</span>'; };
    var STATE = {}, cur = null;
    var stateOf = function (id) {
      if (STATE[id]) return STATE[id];
      var d = DATA[id], ev = d.ev.slice(), none = d.doc === 'none';
      d.ev.forEach(function (e) { if (e.t === 'order') { var m = e.x.match(/№ (\d+)/); ev.push({ d: e.d, t: 'mail', x: 'Письмо курсанту (автоматически): заявка' + (m ? ' № ' + m[1] : '') + ' принята, ссылка на оплату' }); } });
      if (d.doc === 'bad') ev.push({ d: '17.11.2026', t: 'mail', x: 'Письмо курсанту (автоматически): документ возвращён с причиной — исправить в кабинете' });
      ev.sort(function (a, b) { return dkey(b.d) < dkey(a.d) ? -1 : dkey(b.d) > dkey(a.d) ? 1 : 0; });
      return (STATE[id] = {
        p: { fio: d.n, dob: '1985-04-12', tel: '+7 (900) 000-00-00', mail: 'пример@example.ru', city: d.city, work: 'место работы (пример)', spec: d.spec },
        k: { snils: none ? '' : '112-233-445 95', inn: id === 'alekseev' ? '770123456703' : '', level: 'Высшее — специалитет', school: none ? '' : 'Медицинский университет (пример)', dspec: 'Лечебное дело', qual: 'Врач',
             ser: (none || d.doc === 'bad') ? '' : 'серия 000000, № 0000000', date: '2008-06-30', st: d.doc },
        ev: ev, f: '' });
    };
    var PF = [['fio', 'ФИО', 'text'], ['dob', 'Дата рождения', 'date'], ['tel', 'Телефон', 'tel'], ['mail', 'E-mail', 'email'], ['city', 'Город', 'text'], ['work', 'Место работы', 'text'], ['spec', 'Специальность', 'text']];
    var FOOT = '<div class="sc-form__foot"><button class="btn btn--outline btn--sm" type="button" data-sc-cancel>Отмена</button><button class="btn btn--primary btn--sm" type="submit">Сохранить</button></div>';
    var fld = function (id, label, inner) { return '<div class="field"><label for="' + id + '">' + label + '</label>' + inner + '</div>'; };
    var persView = function (S) {
      return '<dl class="kv">' + PF.map(function (f) { return '<div><dt>' + f[1] + '</dt><dd>' + (f[2] === 'date' ? dash(fdate(S.p.dob)) + ' <span class="muted">(пример)</span>' : dash(S.p[f[0]])) + '</dd></div>'; }).join('') + '</dl>';
    };
    var persForm = function (S) {
      return '<form class="sc-form" data-sc-form="pers" novalidate><div class="sc-form__grid">' + PF.map(function (f) {
        return fld('sp-' + f[0], f[1], '<input class="input" id="sp-' + f[0] + '" name="' + f[0] + '" type="' + f[2] + '" value="' + esc(S.p[f[0]]) + '">');
      }).join('') + '</div><p class="hint" style="margin:8px 0 0">ФИО меняется только по документу (паспорт, свидетельство о браке) — приложите скан в «Документах».</p>' + FOOT + '</form>';
    };
    var docsView = function (S) {
      var k = S.k, dg = String(k.snils).replace(/\D/g, '');
      return '<dl class="kv">' +
        '<div><dt>СНИЛС</dt><dd>' + (k.snils ? '<span data-pd>•••-•••-••• ' + dg.slice(9) + '</span> <button class="linkbtn" type="button" data-pd-show data-pd-val="' + esc(k.snils) + '">показать</button> · скан есть · <span class="dk dk--ok">✓ контрольное число</span>' : '<span class="muted">не внесён</span>') + '</dd></div>' +
        '<div><dt>ИНН</dt><dd>' + (k.inn ? esc(k.inn.slice(0, 4)) + '••••••' + esc(k.inn.slice(10)) : '<span class="muted">не указан</span>') + ' <span class="muted">· по желанию, для справки на вычет</span></dd></div>' +
        '<div><dt>Диплом</dt><dd>' + (k.school ? esc(k.level) + ' · ' + esc(k.school) + '<br>«' + esc(k.dspec) + '», квалификация «' + esc(k.qual) + '»<br>' + (k.ser ? esc(k.ser) : '<span class="dk dk--bad">серия и номер не указаны</span>') + ' · выдан ' + fdate(k.date) + ' · скан есть' : '<span class="muted">не внесён</span>') + '</dd></div>' +
        '<div><dt>Проверка</dt><dd><span class="dk ' + DOCL[k.st][0] + '">' + DOCL[k.st][1] + '</span></dd></div>' +
        '<div><dt>Выдаём</dt><dd>' + (k.st === 'ok' ? '<span class="badge badge--ok">сертификат + удостоверение</span>' : '<span class="badge badge--warn">сертификат · удостоверение — после принятия СНИЛС и диплома</span>') + '</dd></div></dl>';
    };
    var docsForm = function (S) {
      var k = S.k, inp = function (id, name, v, extra) { return '<input class="input" id="' + id + '" name="' + name + '" value="' + esc(v) + '"' + (extra || '') + '>'; };
      return '<form class="sc-form" data-sc-form="docs" novalidate><p class="muted" style="margin:0 0 10px">Курсант принёс документы или ошибся в кабинете — исправьте за него. Он увидит изменения в кабинете; правка — в журнал.</p><div class="sc-form__grid">' +
        fld('sd-snils', 'СНИЛС', inp('sd-snils', 'snils', k.snils, ' inputmode="numeric" placeholder="123-456-789 01" data-snils aria-describedby="sd-snils-err"') + '<span class="field__err" id="sd-snils-err" hidden></span>') +
        fld('sd-inn', 'ИНН <span class="muted">(по желанию)</span>', inp('sd-inn', 'inn', k.inn, ' inputmode="numeric" maxlength="12" data-inn aria-describedby="sd-inn-err"') + '<span class="field__err" id="sd-inn-err" hidden></span>') +
        fld('sd-level', 'Уровень образования', '<select class="select" id="sd-level" name="level">' + ['Высшее — специалитет', 'Высшее — ординатура', 'Среднее профессиональное'].map(function (o) { return '<option' + (o === k.level ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>') +
        fld('sd-school', 'Учебное заведение', inp('sd-school', 'school', k.school)) +
        fld('sd-spec', 'Специальность / направление', inp('sd-spec', 'dspec', k.dspec)) +
        fld('sd-qual', 'Квалификация', inp('sd-qual', 'qual', k.qual)) +
        fld('sd-ser', 'Серия и номер диплома', inp('sd-ser', 'ser', k.ser)) +
        fld('sd-date', 'Дата выдачи', '<input class="input" id="sd-date" name="date" type="date" value="' + esc(k.date) + '">') +
        fld('sd-f1', 'Скан СНИЛС', '<input id="sd-f1" type="file" accept=".pdf,.jpg,.jpeg,.png">') +
        fld('sd-f2', 'Скан диплома', '<input id="sd-f2" type="file" accept=".pdf,.jpg,.jpeg,.png">') +
        '</div><label class="check" style="margin-top:10px"><input type="checkbox" name="accept" checked> Документы проверены — принять сразу</label>' + FOOT + '</form>';
    };
    var evList = function (S) {
      var shown = 0, html = S.ev.map(function (e) {
        var g = EVG(e), hide = S.f && S.f !== g; if (!hide) shown++;
        return '<li class="' + EV[e.t][1] + '" data-g="' + g + '"' + (hide ? ' hidden' : '') + '><span class="sc-ev__ic" aria-hidden="true">' + EV[e.t][0] + '</span><span><time>' + e.d + '</time>' + esc(e.x) + '</span></li>';
      }).join('');
      return html + (shown ? '' : '<li class="sc-ev__empty muted">В этом разделе пока ничего нет.</li>');
    };
    var sec = function (key, title, body, edit) {
      return '<section class="sc-sec" aria-labelledby="scH-' + key + '"><div class="sc-sec__head"><h3 id="scH-' + key + '">' + title + '</h3>' +
        (edit ? '<button class="btn btn--outline btn--sm" type="button" data-sc-edit="' + key + '">Изменить</button>' : '') + '</div><div data-sc-body="' + key + '">' + body + '</div></section>';
    };
    var openCard = function (id, from) {
      var d = DATA[id]; if (!d) return;
      var S = stateOf(id); cur = id;
      var ini = d.n.split(' ').slice(0, 2).map(function (w) { return w[0]; }).join('');
      var firstOrder = d.ev.filter(function (e) { return e.t === 'order'; }).map(function (e) { return e.d; }).sort(function (a, b) { return dkey(a) < dkey(b) ? -1 : 1; })[0] || '—';
      card.innerHTML =
        '<div class="drawer__head sc-head"><span class="p-ava p-ava--md">' + ini + '</span><div style="min-width:0"><h2 id="scName">' + esc(S.p.fio) + '</h2><p class="muted" style="margin:2px 0 0" data-sc-sub>' + esc(S.p.city) + ' · ' + esc(S.p.spec) + ' · ' + (d.kind === 'new' ? 'новый курсант' : 'проходил курсы') + '</p></div>' +
        '<button class="iconbtn" type="button" data-card-close aria-label="Закрыть карточку">×</button></div>' +
        '<div class="drawer__body sc-body"><div class="sc-cols">' +
        '<div class="sc-col"><p class="sc-col__t">Курсант — что он заполнил</p>' +
          sec('pers', 'Личные данные', persView(S), true) +
          sec('docs', 'Документы', docsView(S), true) +
          sec('acc', 'Кабинет и согласия', '<dl class="kv"><div><dt>Кабинет на сайте ИХС</dt><dd>есть · вход по коду из письма</dd></div><div><dt>Согласие на обработку ПДн</dt><dd>дано при первой заявке, ' + firstOrder + '</dd></div><div><dt>Съёмка на курсе</dt><dd>по договору-оферте (уточнить у юриста)</dd></div></dl>', false) +
          '<p class="hint" style="margin:0">Документы — один набор на все курсы. Просмотр личных данных и каждая правка пишутся в журнал.</p>' +
        '</div>' +
        '<div class="sc-col"><p class="sc-col__t">Взаимодействие</p>' +
          '<section class="sc-sec" aria-labelledby="scH-runs"><div class="sc-sec__head"><h3 id="scH-runs">Курсы <span class="muted">' + d.runs.length + '</span></h3></div><ul class="sc-runs">' + d.runs.map(function (r) {
            return '<li><div><b>' + esc(r.c) + '</b> <span class="muted">' + esc(r.d) + '</span><small>заявка № ' + r.order + (r.cert ? ' · удостоверение № ' + r.cert : '') + '</small></div>' +
              '<div class="sc-runs__st"><span class="cr ' + RS[r.st][0] + '">' + RS[r.st][1] + '</span>' + (r.st === 'done' ? FRL[r.frdo] : '') + (r.page ? '<a class="linkbtn" href="' + r.page + '">к запуску</a>' : '') + '</div></li>';
          }).join('') + '</ul></section>' +
          '<section class="sc-sec" aria-labelledby="scH-ev"><div class="sc-sec__head"><h3 id="scH-ev">История</h3><div class="sc-acts">' +
            '<button class="btn btn--outline btn--sm" type="button" data-sc-add="note">+ Заметка</button><button class="btn btn--outline btn--sm" type="button" data-sc-add="call">+ Звонок</button><button class="btn btn--outline btn--sm" type="button" data-sc-add="mail">Написать письмо</button></div></div>' +
            '<form class="sc-form" data-sc-compose hidden novalidate><label class="label" for="scText" data-sc-compose-label></label><textarea class="textarea" id="scText" rows="3"></textarea><span class="field__err" data-sc-compose-err hidden>Напишите текст.</span>' +
            '<div class="sc-form__foot"><button class="btn btn--outline btn--sm" type="button" data-sc-compose-cancel>Отмена</button><button class="btn btn--primary btn--sm" type="submit" data-sc-compose-go>Добавить</button></div></form>' +
            '<div class="chips sc-filter" role="group" aria-label="Что показать в истории" data-sc-filter>' + FILTERS.map(function (f) { return '<button class="chip" type="button" data-scf="' + f[0] + '" aria-pressed="' + (S.f === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div>' +
            '<ol class="sc-ev" data-sc-ev aria-live="polite">' + evList(S) + '</ol></section>' +
        '</div></div></div>' +
        '<div class="drawer__foot"><span class="muted" style="margin-right:auto;font-size:13px">Изменения — в журнал</span><button class="btn btn--primary btn--sm" type="button" data-card-close>Закрыть</button></div>';
      card.hidden = false; back.hidden = false; opener = from || null;
      reg.querySelectorAll('tr.is-open').forEach(function (r) { r.classList.remove('is-open'); });
      var row = reg.querySelector('tr[data-id="' + id + '"]'); if (row) row.classList.add('is-open');
      card.querySelector('[data-card-close]').focus();
      try { history.replaceState(null, '', '#' + id); } catch (err) { /* file:// in some browsers */ }
    };
    var closeCard = function () {
      card.hidden = true; back.hidden = true; reg.querySelectorAll('tr.is-open').forEach(function (r) { r.classList.remove('is-open'); });
      try { history.replaceState(null, '', location.pathname); } catch (err) { /* ignore */ }
      if (opener) opener.focus();
    };
    reg.addEventListener('click', function (e) { var tr = e.target.closest('tr[data-id]'); if (tr && !e.target.closest('a')) openCard(tr.getAttribute('data-id'), tr.querySelector('[data-card]')); });
    reg.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches('tr[data-id]')) openCard(e.target.getAttribute('data-id'), e.target); });
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-card-close]')) closeCard();
      var s = e.target.closest('[data-pd-show]'); if (s) { s.previousElementSibling.textContent = (s.getAttribute('data-pd-val') || '112-233-445 95') + ' (пример)'; s.remove(); window.panelToast('Показано. Просмотр СНИЛС записан в журнал.'); }
    });
    /* documents entered by the manager: SNILS / INN check digits, then save (mockup) */
    var digits = function (v) { return String(v).replace(/\D/g, ''); };
    var snilsOk = function (v) {
      var d = digits(v); if (d.length !== 11) return false;
      if (+d.slice(0, 9) <= 1001998) return true;
      var s = 0; for (var i = 0; i < 9; i++) s += +d[i] * (9 - i);
      var c = s < 100 ? s : (s === 100 || s === 101) ? 0 : (s % 101 === 100 ? 0 : s % 101);
      return c === +d.slice(9);
    };
    var innOk = function (v) {
      var d = digits(v); if (!/^\d{12}$/.test(String(v).trim())) return false;
      var w1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8], w2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8], a = 0, b = 0;
      for (var i = 0; i < 10; i++) a += +d[i] * w1[i];
      for (var j = 0; j < 11; j++) b += +d[j] * w2[j];
      return a % 11 % 10 === +d[10] && b % 11 % 10 === +d[11];
    };
    var idMsg = function (inp) {
      var v = inp.value.trim();
      if (inp.hasAttribute('data-snils')) return !v ? 'Укажите номер СНИЛС.' : digits(v).length !== 11 ? 'СНИЛС — 11 цифр.' : snilsOk(v) ? '' : 'Контрольное число не сходится — проверьте цифры.';
      return !v ? '' : !/^\d{12}$/.test(v) ? 'ИНН — 12 цифр.' : innOk(v) ? '' : 'Контрольные цифры ИНН не сходятся.';
    };
    var showId = function (inp) { var m = idMsg(inp), e = document.getElementById(inp.getAttribute('aria-describedby')); inp.setAttribute('aria-invalid', m ? 'true' : 'false'); e.textContent = m; e.hidden = !m; return !m; };
    document.addEventListener('change', function (e) { var i = e.target.closest('[data-sc-form] [data-snils], [data-sc-form] [data-inn]'); if (i) showId(i); });
    var VIEW = { pers: persView, docs: docsView }, FORM = { pers: persForm, docs: docsForm };
    var setSec = function (key, edit) {
      var S = stateOf(cur), body = card.querySelector('[data-sc-body="' + key + '"]'), btn = card.querySelector('[data-sc-edit="' + key + '"]');
      body.innerHTML = edit ? FORM[key](S) : VIEW[key](S); btn.hidden = edit;
      (edit ? body.querySelector('input, select') : btn).focus();
    };
    var addEv = function (e) { var S = stateOf(cur); S.ev.unshift(e); card.querySelector('[data-sc-ev]').innerHTML = evList(S); };
    var COMPOSE = { note: ['Заметка — видят сотрудники, не курсант', 'Заметка: '], call: ['Звонок — о чём договорились', 'Звонок: '], mail: ['Письмо курсанту — уйдёт на e-mail, копия в историю', 'Письмо курсанту: '] };
    var ctype = 'note';
    card.addEventListener('click', function (e) {
      var ed = e.target.closest('[data-sc-edit]'); if (ed) { setSec(ed.getAttribute('data-sc-edit'), true); return; }
      var cn = e.target.closest('[data-sc-cancel]'); if (cn) { setSec(cn.closest('[data-sc-form]').getAttribute('data-sc-form'), false); return; }
      var ad = e.target.closest('[data-sc-add]');
      if (ad) { ctype = ad.getAttribute('data-sc-add'); var f = card.querySelector('[data-sc-compose]'); f.hidden = false; f.querySelector('[data-sc-compose-label]').textContent = COMPOSE[ctype][0]; f.querySelector('[data-sc-compose-go]').textContent = ctype === 'mail' ? 'Отправить' : 'Добавить'; f.querySelector('textarea').focus(); return; }
      if (e.target.closest('[data-sc-compose-cancel]')) { card.querySelector('[data-sc-compose]').hidden = true; card.querySelector('[data-sc-add="' + ctype + '"]').focus(); return; }
      var fb = e.target.closest('[data-scf]');
      if (fb) {
        var S = stateOf(cur); S.f = fb.getAttribute('data-scf');
        card.querySelectorAll('[data-scf]').forEach(function (x) { x.setAttribute('aria-pressed', x === fb); });
        card.querySelector('[data-sc-ev]').innerHTML = evList(S);
      }
    });
    card.addEventListener('submit', function (e) {
      var f = e.target; e.preventDefault();
      var S = stateOf(cur), key = f.getAttribute('data-sc-form');
      if (f.hasAttribute('data-sc-compose')) {
        var ta = f.querySelector('textarea'), err = f.querySelector('[data-sc-compose-err]'), v = ta.value.trim();
        err.hidden = !!v; ta.setAttribute('aria-invalid', v ? 'false' : 'true'); if (!v) { ta.focus(); return; }
        addEv({ d: TODAY, t: ctype, x: COMPOSE[ctype][1] + v + ' — ' + ME }); ta.value = ''; f.hidden = true;
        window.panelToast(ctype === 'mail' ? 'Письмо отправлено курсанту, копия — в истории.' : 'Добавлено в историю курсанта.'); return;
      }
      if (key === 'pers') {
        PF.forEach(function (x) { S.p[x[0]] = f.elements[x[0]].value.trim(); });
        card.querySelector('#scName').textContent = S.p.fio;
        addEv({ d: TODAY, t: 'edit', x: 'Личные данные изменены в панели — ' + ME });
        setSec('pers', false); window.panelToast('Сохранено. Курсант увидит изменения в кабинете; правка — в журнал.'); return;
      }
      if (key === 'docs') {
        var bad = [].filter.call(f.querySelectorAll('[data-snils], [data-inn]'), function (i) { return !showId(i); });
        if (bad.length) { bad[0].focus(); return; }
        ['snils', 'inn', 'level', 'school', 'dspec', 'qual', 'ser', 'date'].forEach(function (n) { S.k[n] = f.elements[n].value.trim(); });
        S.k.st = f.elements.accept.checked ? 'ok' : 'check';
        addEv({ d: TODAY, t: 'edit', x: 'Документы внесены в панели' + (S.k.st === 'ok' ? ' и приняты' : ', ждут проверки') + ' — ' + ME });
        setSec('docs', false); window.panelToast('Документы сохранены' + (S.k.st === 'ok' ? ' и приняты' : '') + '. Курсант увидит их в кабинете; правка — в журнал.');
      }
    });
    window.panelChecks = { snils: snilsOk, inn: innOk };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !card.hidden) closeCard(); });
    if (location.hash && DATA[location.hash.slice(1)]) openCard(location.hash.slice(1));
  }

  /* run documents: attendance -> attestation */
  var att = document.getElementById('att');
  if (att) att.addEventListener('change', function (e) {
    var cb = e.target.closest('[data-day]'); if (!cb) return;
    var tr = cb.closest('tr'), d = tr.querySelectorAll('[data-day]'), miss = [].filter.call(d, function (x) { return !x.checked; }).map(function (x) { return x.getAttribute('data-day'); });
    var b = tr.querySelector('[data-att]'), c = tr.querySelector('[data-cert]'), gv = tr.querySelector('[data-give]');
    if (gv) { gv.dataset.was = gv.dataset.was || gv.innerHTML; gv.innerHTML = miss.length ? '<span class="badge">сертификат</span>' : gv.dataset.was.indexOf('удостоверение') > -1 ? gv.dataset.was : '<span class="badge badge--ok">сертификат + удостоверение</span>'; }
    if (miss.length) { b.className = 'badge badge--bad'; b.textContent = 'не допущен — пропущен день ' + miss.join(', '); c.dataset.was = c.dataset.was || c.innerHTML; c.innerHTML = '<span class="muted">—</span>'; tr.classList.add('is-bad'); }
    else { b.className = 'badge badge--ok'; b.textContent = 'зачёт'; c.innerHTML = c.dataset.was && c.dataset.was.indexOf('№') > -1 ? c.dataset.was : '<span class="badge badge--warn">номер будет присвоен</span>'; tr.classList.remove('is-bad'); }
    var ok = [].filter.call(att.querySelectorAll('tbody tr'), function (r) { return !r.classList.contains('is-bad'); }).length;
    var pl = document.querySelectorAll('.pipe li'); pl[3].querySelector('b').textContent = ok + ' из ' + att.querySelectorAll('tbody tr').length; pl[4].querySelector('b').textContent = ok;
    window.panelToast('Отмечено. Ведомость и протокол пересоберутся из отметок.');
  });

  /* run documents: legal order */
  var BTN = {
    ready: '<button class="btn btn--outline btn--sm" type="button" data-toast="Макет: скачается DOCX для проверки">Скачать DOCX</button><button class="btn btn--primary btn--sm" type="button" data-doc-sign>Отправить на подпись</button>',
    sign: '<button class="btn btn--outline btn--sm" type="button" data-toast="Макет: откроется PDF">Открыть</button><button class="btn btn--accent btn--sm" type="button" data-doc-signed>Подписать ЭЦП</button>',
    signed: '<button class="btn btn--outline btn--sm" type="button" data-toast="Макет: откроется подписанный PDF">Открыть</button>',
    draft: '<button class="btn btn--primary btn--sm" type="button" data-doc-make>Сформировать</button>'
  };
  var LBL = { ready: ['badge--blue', '● сформирован'], sign: ['badge--warn', '◐ на подписи'], signed: ['badge--ok', '✓ подписан ЭЦП'], draft: ['badge', 'можно формировать'] };
  function setDoc(li, st, when) {
    var b = li.querySelector('[data-rdoc-st]'); b.className = 'badge ' + LBL[st][0]; b.textContent = LBL[st][1];
    li.querySelector('[data-rdoc-when]').textContent = when; li.querySelector('.rdoc__act').innerHTML = BTN[st];
    var f = li.querySelector('.rdoc__act button:last-child'); if (f) f.focus();
  }
  document.addEventListener('click', function (e) {
    var li = e.target.closest('[data-rdoc]'); if (!li) return;
    if (e.target.closest('[data-doc-make]')) { setDoc(li, 'ready', 'сформирован сейчас из шаблона'); window.panelToast('Сформирован из шаблона Word — проверьте и отправьте на подпись.'); }
    else if (e.target.closest('[data-doc-sign]')) { setDoc(li, 'sign', 'отправлен на подпись сейчас'); window.panelToast('Отправлен на подпись руководителю.'); }
    else if (e.target.closest('[data-doc-signed]')) {
      setDoc(li, 'signed', 'подписан сейчас');
      var next = li.nextElementSibling; if (next && /ждёт/.test(next.querySelector('[data-rdoc-st]').textContent)) setDoc(next, 'draft', 'предыдущий шаг подписан');
      window.panelToast('Подписано ЭЦП. Следующий шаг открыт.');
    }
  });

  /* ФИС ФРДО batch: build -> sent -> accepted */
  var step = function (k, cls) { var li = document.querySelector('[data-fstep="' + k + '"]'); if (li) li.className = cls; };
  var bst = function (cls, txt) { var b = document.querySelector('[data-batch-st]'); if (b) { b.className = 'badge ' + cls; b.textContent = txt; } };
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-frdo-build]'))) {
      step('build', 'is-done'); step('sent', 'is-now'); bst('badge--blue', 'файл собран');
      t.disabled = true; var s2 = document.querySelector('[data-frdo-sent]'); s2.disabled = false; s2.className = 'btn btn--primary'; s2.focus();
      window.panelToast('Файл собран по шаблону ФИС ФРДО — скачайте и загрузите в ФИС ФРДО.');
    } else if ((t = e.target.closest('[data-frdo-sent]'))) {
      step('sent', 'is-done'); step('done', 'is-now'); bst('badge--warn', 'отправлено, ждём ответ');
      t.disabled = true; t.className = 'btn btn--outline'; document.querySelector('[data-frdo-result]').hidden = false; document.querySelector('[data-frdo-ok]').focus();
      window.panelToast('Отмечено: отправлено. Дата и сотрудник записаны в журнал.');
    } else if ((t = e.target.closest('[data-frdo-ok]'))) {
      step('done', 'is-done'); bst('badge--ok', '✓ принято ФИС ФРДО'); t.closest('[data-frdo-result]').hidden = true;
      document.querySelectorAll('#certs tr[data-tags~="frdo-ready"] td:last-child').forEach(function (td) { td.innerHTML = '<span class="badge badge--ok">принято</span>'; });
      var all = document.querySelectorAll('[data-rdoc]'), last = all[all.length - 1];
      if (last) { var lb = last.querySelector('[data-rdoc-st]'); lb.className = 'badge badge--ok'; lb.textContent = '✓ принято ФИС ФРДО'; last.querySelector('[data-rdoc-when]').textContent = 'сейчас'; }
      window.panelToast('Принято. У курсантов в кабинете — «Передано в ФИС ФРДО». Когда все строки приняты, запуск уходит в «Завершённые».');
    }
  });

  /* run photos: cover, hide, publish (admin-run-*.html, tab «Фото и материалы») */
  document.addEventListener('change', function (e) {
    var h = e.target.closest('[data-ph-hide]'); if (h) { h.closest('[data-ph]').classList.toggle('is-hidden', h.checked); return; }
    var c = e.target.closest('[data-ph] input[type=radio]');
    if (c) { document.querySelectorAll('[data-ph]').forEach(function (x) { x.classList.toggle('is-cover', x.contains(c)); }); }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-med-pub]'); if (!b) return;
    var hidden = document.querySelectorAll('[data-ph].is-hidden').length, st = document.querySelector('[data-med-st]');
    st.className = 'badge badge--ok'; st.textContent = '✓ опубликованы';
    window.panelToast('Галерея опубликована' + (hidden ? ', скрыто фото: ' + hidden : '') + '. На сайтах ИХС и FD — при следующем обмене.');
  });
})();
