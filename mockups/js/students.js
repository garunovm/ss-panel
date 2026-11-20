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
    var EV = { order: ['+', 'ev--order'], pay: ['₽', 'ev--pay'], doc: ['↑', 'ev--doc'], ok: ['✓', 'ev--ok'], course: ['★', 'ev--course'], cert: ['№', 'ev--cert'], frdo: ['⇪', 'ev--frdo'], cancel: ['✕', 'ev--cancel'] };
    var openCard = function (id, from) {
      var d = DATA[id]; if (!d) return;
      var ini = d.n.split(' ').slice(0, 2).map(function (w) { return w[0]; }).join('');
      card.innerHTML =
        '<div class="drawer__head sc-head"><span class="p-ava p-ava--md">' + ini + '</span><div style="min-width:0"><h2 id="scName">' + esc(d.n) + '</h2><p class="muted" style="margin:2px 0 0">' + esc(d.city) + ' · ' + esc(d.spec) + ' · ' + (d.kind === 'new' ? 'новый курсант' : 'проходил курсы') + '</p></div>' +
        '<button class="iconbtn" type="button" data-card-close aria-label="Закрыть карточку">×</button></div>' +
        '<div class="drawer__body sc-body">' +
        '<section><h3>Личные данные</h3><dl class="kv">' +
        '<div><dt>Дата рождения</dt><dd>12.04.1985 (пример)</dd></div>' +
        '<div><dt>СНИЛС</dt><dd><span data-pd>•••-•••-••• 01</span> <button class="linkbtn" type="button" data-pd-show>показать</button></dd></div>' +
        '<div><dt>Телефон, e-mail</dt><dd>+7 (900) 000-00-00 · пример@example.ru</dd></div>' +
        '<div><dt>Место работы</dt><dd>место работы (пример), ' + esc(d.city) + '</dd></div>' +
        '<div><dt>Документ об образовании</dt><dd>высшее — специалитет · 2008 · <span class="dk ' + DOCL[d.doc][0] + '">' + DOCL[d.doc][1] + '</span></dd></div>' +
        '<div><dt>Кабинет на сайте ИХС</dt><dd>есть · вход по коду из письма</dd></div></dl>' +
        '<p class="hint" style="margin:8px 0 0">Документы — один набор на все курсы. Просмотр личных данных пишется в журнал.</p></section>' +
        '<section><h3>Курсы <span class="muted">' + d.runs.length + '</span></h3><ul class="sc-runs">' + d.runs.map(function (r) {
          return '<li><div><b>' + esc(r.c) + '</b> <span class="muted">' + esc(r.d) + '</span><small>заявка № ' + r.order + (r.cert ? ' · удостоверение № ' + r.cert : '') + '</small></div>' +
            '<div class="sc-runs__st"><span class="cr ' + RS[r.st][0] + '">' + RS[r.st][1] + '</span>' + (r.st === 'done' ? FRL[r.frdo] : '') + (r.page ? '<a class="linkbtn" href="' + r.page + '">к запуску</a>' : '') + '</div></li>';
        }).join('') + '</ul></section>' +
        '<section><h3>История</h3><ol class="sc-ev">' + d.ev.map(function (e) {
          return '<li class="' + EV[e.t][1] + '"><span class="sc-ev__ic" aria-hidden="true">' + EV[e.t][0] + '</span><span><time>' + e.d + '</time>' + esc(e.x) + '</span></li>';
        }).join('') + '</ol></section></div>' +
        '<div class="drawer__foot"><button class="btn btn--outline btn--sm" type="button" data-toast="Макет: письмо курсанту из панели, копия — в историю">Написать письмо</button><button class="btn btn--primary btn--sm" type="button" data-card-close>Закрыть</button></div>';
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
      var s = e.target.closest('[data-pd-show]'); if (s) { s.previousElementSibling.textContent = '000-000-000 01 (пример)'; s.remove(); window.panelToast('Показано. Просмотр СНИЛС записан в журнал.'); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !card.hidden) closeCard(); });
    if (location.hash && DATA[location.hash.slice(1)]) openCard(location.hash.slice(1));
  }

  /* run documents: attendance -> attestation */
  var att = document.getElementById('att');
  if (att) att.addEventListener('change', function (e) {
    var cb = e.target.closest('[data-day]'); if (!cb) return;
    var tr = cb.closest('tr'), d = tr.querySelectorAll('[data-day]'), miss = [].filter.call(d, function (x) { return !x.checked; }).map(function (x) { return x.getAttribute('data-day'); });
    var b = tr.querySelector('[data-att]'), c = tr.querySelector('[data-cert]');
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
