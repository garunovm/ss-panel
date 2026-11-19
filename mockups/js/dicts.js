/*
  ИХС panel mockups — directories (admin-clinics.html, admin-dicts.html).
  Same editing style as the programme: edit in place, «+» adds an item already open, drag to reorder.
  - [data-row-toggle]           table row: opens/closes the edit row right below it (tr.row-edit)
  - [data-row-add="tplId"]      adds a new row from <template id="tplId"> at the top, open, focused
  - [data-row-save]             copies [data-bind=x] values to [data-show=x] of the row, closes, toast
  - ul[data-dict]               values: drag or ↑/↓ to reorder, «Изменить» edits in place, «В архив»,
                                the input [data-dict-new] + Enter / «Добавить» adds a value
  Used values are archived, not deleted: cards, courses and site orders refer to them.
*/
(function () {
  var say = function (t) { if (window.panelToast) window.panelToast(t); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---- table rows with an edit row ---- */
  function toggle(btn, open) {
    var tr = btn.closest('tr'), ed = tr.nextElementSibling;
    if (open === undefined) open = ed.hidden;
    ed.hidden = !open; tr.classList.toggle('is-editing', open);
    tr.querySelectorAll('[data-row-toggle]').forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); b.textContent = open ? 'Свернуть' : 'Изменить'; });
    if (open) { var f = ed.querySelector('input,select,textarea'); if (f) f.focus(); }
  }
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-row-toggle]'))) { toggle(t); return; }
    if ((t = e.target.closest('[data-row-add]'))) {
      var tpl = document.getElementById(t.getAttribute('data-row-add')), body = document.querySelector(t.getAttribute('data-into'));
      var frag = tpl.content.cloneNode(true); body.insertBefore(frag, body.firstChild);
      toggle(body.querySelector('[data-row-toggle]'), true); return;
    }
    if ((t = e.target.closest('[data-row-save]'))) {
      var ed = t.closest('tr.row-edit'), tr = ed.previousElementSibling;
      ed.querySelectorAll('[data-bind]').forEach(function (i) { var o = tr.querySelector('[data-show="' + i.getAttribute('data-bind') + '"]'); if (o && i.value.trim()) o.textContent = i.value.trim(); });
      tr.classList.remove('is-new'); toggle(tr.querySelector('[data-row-toggle]'), false); tr.querySelector('[data-row-toggle]').focus();
      say(t.getAttribute('data-row-save') || 'Сохранено'); return;
    }
    if ((t = e.target.closest('[data-row-cancel]'))) {
      var ed2 = t.closest('tr.row-edit'), tr2 = ed2.previousElementSibling;
      if (tr2.classList.contains('is-new')) { ed2.remove(); tr2.remove(); return; }
      toggle(tr2.querySelector('[data-row-toggle]'), false); tr2.querySelector('[data-row-toggle]').focus(); return;
    }
    if ((t = e.target.closest('[data-room-add]'))) {
      var ul = t.previousElementSibling, li = document.createElement('li');
      li.innerHTML = '<input class="input" aria-label="Название помещения" placeholder="например, «Учебный класс»"><button class="linkbtn" type="button" data-room-del aria-label="Удалить помещение">✕</button>';
      ul.appendChild(li); li.querySelector('input').focus(); return;
    }
    if ((t = e.target.closest('[data-room-del]'))) { t.closest('li').remove(); return; }

    /* ---- dictionary values ---- */
    if ((t = e.target.closest('[data-dv-edit]'))) {
      var li2 = t.closest('li'), v = li2.querySelector('.dv__val');
      if (li2.classList.contains('is-editing')) { finishEdit(li2); return; }
      li2.classList.add('is-editing'); t.textContent = 'Готово';
      v.innerHTML = '<input class="input" value="' + esc(v.textContent) + '" aria-label="Значение">';
      v.querySelector('input').focus(); v.querySelector('input').select(); return;
    }
    if ((t = e.target.closest('[data-dv-archive]'))) {
      var li3 = t.closest('li'), used = +li3.getAttribute('data-used');
      li3.classList.toggle('is-archived');
      var arch = li3.classList.contains('is-archived');
      t.textContent = arch ? 'Вернуть' : (used ? 'В архив' : 'Удалить');
      if (!used && arch) { li3.remove(); say('Значение удалено — оно нигде не использовалось'); return; }
      say(arch ? 'В архиве: в старых записях остаётся, для новых не предлагается' : 'Значение снова доступно'); return;
    }
    if ((t = e.target.closest('[data-dv-add]'))) { addValue(t.closest('.dict')); return; }
    if ((t = e.target.closest('[data-dv-mv]'))) {
      var li4 = t.closest('li'), dir = +t.getAttribute('data-dv-mv'), sib = dir < 0 ? li4.previousElementSibling : li4.nextElementSibling;
      if (!sib) return;
      if (dir < 0) li4.parentNode.insertBefore(li4, sib); else li4.parentNode.insertBefore(sib, li4);
      t.focus(); say('Порядок изменён — так значения идут в списках на сайтах'); return;
    }
    if ((t = e.target.closest('[data-dict-tab]'))) {
      document.querySelectorAll('[data-dict-tab]').forEach(function (b) { b.setAttribute('aria-current', b === t ? 'true' : 'false'); });
      document.querySelectorAll('.dict').forEach(function (d) { d.hidden = d.id !== t.getAttribute('data-dict-tab'); });
    }
  });
  function finishEdit(li) {
    var v = li.querySelector('.dv__val'), inp = v.querySelector('input');
    v.textContent = inp.value.trim() || '—'; li.classList.remove('is-editing'); li.querySelector('[data-dv-edit]').textContent = 'Изменить';
    li.querySelector('[data-dv-edit]').focus();
    say('Сохранено. Где значение уже выбрано, оно обновится тоже');
  }
  function addValue(dict) {
    var inp = dict.querySelector('[data-dict-new]'), val = inp.value.trim();
    if (!val) { inp.focus(); return; }
    var ul = dict.querySelector('ul[data-dict]'), li = document.createElement('li');
    li.className = 'dv is-new'; li.draggable = true; li.setAttribute('data-used', '0');
    li.innerHTML = '<span class="pi__handle" aria-hidden="true">⋮⋮</span><span class="dv__val">' + esc(val) + '</span><span class="dv__used muted">не используется</span>' +
      '<span class="dv__tools"><button class="iconbtn pi__mv" type="button" data-dv-mv="-1" aria-label="Выше">↑</button><button class="iconbtn pi__mv" type="button" data-dv-mv="1" aria-label="Ниже">↓</button>' +
      '<button class="linkbtn" type="button" data-dv-edit>Изменить</button><button class="linkbtn" type="button" data-dv-archive>Удалить</button></span>';
    ul.appendChild(li); inp.value = ''; inp.focus();
    say('Добавлено: «' + val + '»');
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    if (e.target.matches('[data-dict-new]')) { e.preventDefault(); addValue(e.target.closest('.dict')); }
    else if (e.target.closest('.dv.is-editing')) { e.preventDefault(); finishEdit(e.target.closest('li')); }
  });

  /* ---- drag to reorder dictionary values ---- */
  var dragLi = null;
  document.addEventListener('dragstart', function (e) { var li = e.target.closest && e.target.closest('ul[data-dict] > li'); if (!li) return; dragLi = li; e.dataTransfer.setData('text/plain', 'dv'); setTimeout(function () { li.classList.add('is-dragging'); }, 0); });
  document.addEventListener('dragend', function () { if (dragLi) dragLi.classList.remove('is-dragging'); dragLi = null; document.querySelectorAll('.is-drop-before,.is-drop-after').forEach(function (x) { x.classList.remove('is-drop-before', 'is-drop-after'); }); });
  document.addEventListener('dragover', function (e) {
    if (!dragLi) return; var li = e.target.closest('ul[data-dict] > li'); if (!li || li.parentNode !== dragLi.parentNode) return;
    e.preventDefault(); document.querySelectorAll('.is-drop-before,.is-drop-after').forEach(function (x) { x.classList.remove('is-drop-before', 'is-drop-after'); });
    var r = li.getBoundingClientRect(); li.classList.add(e.clientY < r.top + r.height / 2 ? 'is-drop-before' : 'is-drop-after');
  });
  document.addEventListener('drop', function (e) {
    if (!dragLi) return; var li = e.target.closest('ul[data-dict] > li'); if (!li || li === dragLi) return;
    e.preventDefault(); li.parentNode.insertBefore(dragLi, li.classList.contains('is-drop-after') ? li.nextSibling : li);
    say('Порядок изменён — так значения идут в списках на сайтах');
  });
})();
