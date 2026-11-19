/*
  ИХС panel mockups — students of a run (admin-students.html).
  - [data-doc-ok]    accept a document → badge «✓ принято», the row's pill turns green
  - [data-doc-ret]   opens the reason; [data-doc-send] returns the document with the reason
                     (the student sees it in the site cabinet «Документы слушателя» and gets an e-mail)
  - [data-reg-filter]  registry of all students (admin-students-all.html): search + course / year / specialty /
                       city selects + quick chips [data-rtag]; all combine (AND); «Сбросить фильтры»
  - #att [data-day]     run documents (admin-run-docs.html): attendance -> attestation («не допущен» if a day is missed)
  - [data-rdoc]         documents in the legal order: «Сформировать» -> «Отправить на подпись» -> «Подписать ЭЦП»;
                        signing a document opens the next step
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

  /* registry filters */
  var reg = document.getElementById('reg');
  if (reg) {
    var rtag = '';
    var val = function (k) { var e = document.querySelector('[data-rf="' + k + '"]'); return e ? e.value.trim() : ''; };
    var has = function (tr, attr, v) { return !v || (' ' + tr.getAttribute(attr) + ' ').indexOf(' ' + v + ' ') > -1; };
    var apply = function () {
      var q = val('q').toLowerCase(), n = 0;
      reg.querySelectorAll(':scope > tbody > tr:not(.row-edit)').forEach(function (tr) {
        var ok = has(tr, 'data-courses', val('course')) && has(tr, 'data-years', val('year')) && has(tr, 'data-spec', val('spec')) &&
          (!val('city') || tr.getAttribute('data-city') === val('city')) && has(tr, 'data-tags', rtag) &&
          (!q || (tr.textContent + tr.nextElementSibling.textContent).toLowerCase().indexOf(q) > -1);
        tr.hidden = !ok; if (!ok) tr.nextElementSibling.hidden = true; if (ok) n++;
      });
      document.querySelector('[data-rf-count]').textContent = 'Показано: ' + n + ' из ' + reg.querySelectorAll(':scope > tbody > tr:not(.row-edit)').length;
      document.querySelector('[data-rf-empty]').hidden = n > 0;
    };
    document.querySelectorAll('[data-rf]').forEach(function (e) { e.addEventListener(e.tagName === 'SELECT' ? 'change' : 'input', apply); });
    document.querySelector('[data-rf-chips]').addEventListener('click', function (e) {
      var b = e.target.closest('[data-rtag]'); if (!b) return; rtag = b.getAttribute('data-rtag');
      this.querySelectorAll('[data-rtag]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); apply();
    });
    document.querySelector('[data-rf-reset]').addEventListener('click', function () {
      document.querySelectorAll('[data-rf]').forEach(function (e) { e.value = ''; });
      rtag = ''; document.querySelectorAll('[data-rtag]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-rtag') === '' ? 'true' : 'false'); }); apply();
    });
    apply();
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
})();
