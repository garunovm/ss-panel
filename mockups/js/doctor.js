/*
  ИХС panel mockups — doctor.* (doctor-card.html, doctor-slots.html, doctor-visits.html).
  - [data-as]            demo: who is signed in — doctor (Черевцов В. Н.) or assistant (Ольга К.); <body data-as>
                         assistant: works for the doctor (slots, visits), cannot edit the doctor's card
  - card: inputs marked [data-needs-ok] go to the manager's queue on save; others are saved at once
  - slots: weekly template per clinic (day chips, from/to, slot length) + exceptions → two-week preview (#preview)
  - visits: confirm / came / no-show / cancel with a reason; filter chips are panel.js [data-filter]
*/
(function () {
  var toast = function (t) { if (window.panelToast) window.panelToast(t); };

  /* ---- doctor / assistant demo ---- */
  var WHO = { doctor: { n: 'Черевцов В. Н.', r: 'врач', img: '../img/cherevcov.jpg' }, assistant: { n: 'Ольга К.', r: 'ассистент · врач: Черевцов В. Н.', ini: 'ОК' } };
  function setAs(v) {
    document.body.setAttribute('data-as', v);
    document.querySelectorAll('button[data-as]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-as') === v ? 'true' : 'false'); });
    document.querySelectorAll('[data-only]').forEach(function (el) { el.hidden = el.getAttribute('data-only') !== v; });
    var u = document.querySelector('.p-user'); if (u) {
      u.querySelector('b').textContent = WHO[v].n; u.querySelector('small').textContent = WHO[v].r;
      u.querySelector('.p-ava').innerHTML = WHO[v].img ? '<img src="' + WHO[v].img + '" alt="">' : WHO[v].ini;
    }
    var form = document.querySelector('[data-card-form]');
    if (form) form.querySelectorAll('input,textarea,select,button[data-edit]').forEach(function (i) { if (!i.hasAttribute('data-locked')) i.disabled = v === 'assistant'; });
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-as]'); if (b && b.tagName === 'BUTTON') setAs(b.getAttribute('data-as')); });
  if (document.querySelector('button[data-as]')) setAs('doctor');

  /* ---- my card ---- */
  var form = document.querySelector('[data-card-form]');
  if (form) {
    form.addEventListener('input', function (e) { var f = e.target.closest('.field'); if (f) f.classList.add('is-changed'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var changed = form.querySelectorAll('.field.is-changed'), toQ = 0, now = 0;
      changed.forEach(function (f) {
        if (f.querySelector('[data-needs-ok]')) { toQ++; var st = f.querySelector('[data-state]'); if (st) { st.className = 'badge badge--warn'; st.textContent = 'на подтверждении · сейчас'; } }
        else now++;
        f.classList.remove('is-changed');
      });
      if (!changed.length) { toast('Изменений нет.'); return; }
      toast((now ? 'Сохранено сразу: ' + now + '. ' : '') + (toQ ? 'Ушло менеджеру на подтверждение: ' + toQ + ' — на сайтах пока прежнее.' : ''));
    });
  }

  /* ---- slots ---- */
  var preview = document.getElementById('preview');
  if (preview) {
    var DAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
    var BOOKED = { '2026-11-23 10:30': 'Записан', '2026-11-25 11:00': 'Записан', '2026-11-27 11:30': 'Записан', '2026-12-02 12:00': 'Записан' };
    var min = function (t) { var a = t.split(':'); return +a[0] * 60 + +a[1]; };
    var hm = function (m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
    var ymd = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    function rules() {
      return [].map.call(document.querySelectorAll('[data-rule]'), function (r) {
        return { clinic: r.getAttribute('data-clinic'), short: r.getAttribute('data-short'), color: r.getAttribute('data-color'),
          days: [].filter.call(r.querySelectorAll('[data-day]'), function (b) { return b.getAttribute('aria-pressed') === 'true'; }).map(function (b) { return +b.getAttribute('data-day'); }),
          from: r.querySelector('[data-from]').value, to: r.querySelector('[data-to]').value, len: +r.querySelector('[data-len]').value };
      });
    }
    function off(d) {
      return [].some.call(document.querySelectorAll('[data-exc]'), function (x) { var a = x.getAttribute('data-from'), b = x.getAttribute('data-to'); return ymd(d) >= a && ymd(d) <= b; });
    }
    function render() {
      var start = new Date(2026, 10, 23), html = '', total = 0, free = 0;
      for (var i = 0; i < 14; i++) {
        var d = new Date(start); d.setDate(start.getDate() + i);
        var wd = (d.getDay() + 6) % 7, cells = '';
        if (off(d)) cells = '<span class="pv-off">не принимает</span>';
        else rules().forEach(function (r) {
          if (r.days.indexOf(wd) < 0 || !r.from || !r.to || !r.len) return;
          for (var t = min(r.from); t + r.len <= min(r.to); t += r.len) {
            var key = ymd(d) + ' ' + hm(t), b = BOOKED[key]; total++; if (!b) free++;
            cells += '<span class="pv-slot' + (b ? ' is-booked' : '') + '" style="--c:' + r.color + '" title="' + r.clinic + ', ' + hm(t) + (b ? ' — занято' : ' — свободно') + '">' + hm(t) + '</span>';
          }
        });
        html += '<div class="pv-day' + (wd > 4 ? ' is-we' : '') + '"><b>' + DAYS[wd] + ' ' + d.getDate() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '</b><div class="pv-cells">' + (cells || '<span class="pv-none">—</span>') + '</div></div>';
      }
      preview.innerHTML = html;
      document.querySelector('[data-pv-sum]').textContent = 'на 2 недели: ' + total + ' слотов, свободно ' + free;
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-day]'); if (b) { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); render(); return; }
      var x = e.target.closest('[data-exc-del]'); if (x) { x.closest('li').remove(); render(); toast('Исключение убрано — слоты снова открыты.'); return; }
      if (e.target.closest('[data-exc-add]')) {
        var a = document.getElementById('exFrom').value, z = document.getElementById('exTo').value, w = document.getElementById('exWhy').value.trim() || 'не принимает';
        if (!a || !z || z < a) { document.getElementById('exFrom').focus(); toast('Укажите даты: с … по …'); return; }
        var li = document.createElement('li'); li.setAttribute('data-exc', ''); li.setAttribute('data-from', a); li.setAttribute('data-to', z);
        li.innerHTML = '<span><b></b> <span class="muted"></span></span><button class="linkbtn" type="button" data-exc-del>убрать</button>';
        li.querySelector('b').textContent = a.split('-').reverse().join('.') + ' — ' + z.split('-').reverse().join('.'); li.querySelector('.muted').textContent = w;
        document.querySelector('[data-exc-list]').appendChild(li); render(); toast('Исключение добавлено. Записи на эти дни — в «Записях» с пометкой «перенести».');
      }
    });
    document.addEventListener('input', function (e) { if (e.target.closest('[data-rule]')) render(); });
    document.addEventListener('change', function (e) { if (e.target.closest('[data-rule]')) render(); });
    render();
  }

  /* ---- visits ---- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-v]'); if (!t) return;
    var li = t.closest('[data-visit]'), st = li.querySelector('[data-vst]'), act = li.querySelector('.visit__act');
    var set = function (cls, txt, tags) { st.className = 'badge ' + cls; st.textContent = txt; li.setAttribute('data-tags', tags); };
    var k = t.getAttribute('data-v');
    if (k === 'confirm') { set('badge--ok', '✓ подтверждена', 'soon'); act.innerHTML = '<button class="btn btn--outline btn--sm" type="button" data-v="cancel">Отменить</button>'; toast('Подтверждено. Пациенту — SMS/письмо, на сайте в кабинете — «Подтверждена».'); }
    if (k === 'came') { set('badge--ok', 'состоялась', 'past'); act.innerHTML = ''; toast('Отмечено: приём состоялся.'); }
    if (k === 'noshow') { set('badge--bad', 'не пришёл', 'past'); act.innerHTML = ''; toast('Отмечено: не пришёл.'); }
    if (k === 'cancel') { var r = li.querySelector('.visit__reason'); r.hidden = false; r.querySelector('select').focus(); }
    if (k === 'cancel-go') { var why = li.querySelector('.visit__reason select').value; set('badge', '✕ отменена: ' + why, 'past'); act.innerHTML = ''; li.querySelector('.visit__reason').hidden = true; toast('Отменено. Слот освободился; пациенту — сообщение.'); }
  });
})();
