// Page logic for Калькулятор СС: converter rows, switch panel, worked examples. Needs convert.js first.
(() => {
  const { DIGITS, GROUP_SIZE, NAMES, nameOf, nameIn, nameTo, abs, bitLen, num, plural, groupStr, fmt, clampBase, gcd, makeRat, digitsVal, FRAC_LIMIT, expand, fmtRat, digitRange, digitsOf, parsePositional, toRoman, parseRoman, balTernary, zeckendorf, factoradic } = window.Convert;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WIDTHS = [8, 16, 32, 64];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const state = { num: 1958n, den: 1n, empty: false, width: 16, group: 4, custom: 12, ex: 12 };

  const HINTS = {
    3: 'Обычная троичная. Сбалансированный вариант, как у «Сетуни», внизу среди необычных систем.',
    5: 'Счёт по пальцам одной руки.',
    12: 'Дюжинная: 12 делится на 2, 3, 4 и 6. Отсюда дюжины, гроссы и 12 часов на циферблате.',
    20: 'Двадцатеричной системой пользовались майя: пальцы рук и ног.',
    32: 'Основание кодировки Base32.',
    36: 'Все десять цифр и все 26 латинских букв. Так часто кодируют короткие ссылки.'
  };
  const cap = s => s[0].toUpperCase() + s.slice(1);

  /* ---------- the current value as parts ---------- */
  const intOf = () => state.num / state.den;
  const intMag = () => abs(state.num) / state.den;
  const fracNum = () => abs(state.num) % state.den;
  const isNeg = () => state.num < 0n;
  const withInt = mag => { const n = mag * state.den + fracNum(); return makeRat(isNeg() ? -n : n, state.den); };

  /* ---------- converter rows ---------- */
  const COPY_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  const COPY_HTML = COPY_SVG + '<span class="copy-t">Копировать</span>';
  const ROWS = [
    { id: 'f2', base: '2', name: 'Двоичная', ph: 'например, 101101' },
    { id: 'f8', base: '8', name: 'Восьмеричная', ph: 'например, 755' },
    { id: 'f10', base: '10', name: 'Десятичная', ph: 'например, 2026' },
    { id: 'f16', base: '16', name: 'Шестнадцатеричная', ph: 'например, 1F4' },
    { id: 'fc', base: 'c', custom: true }
  ];
  $('#rows').innerHTML = ROWS.map(r => `
    <div class="row">
      <div class="badge">${r.custom
        ? `<input type="number" id="cb" min="2" max="36" value="${state.custom}" inputmode="numeric" aria-label="Своё основание от 2 до 36">`
        : `<span aria-hidden="true">${r.base}</span>`}</div>
      <div class="row-main">
        <label class="row-name" for="${r.id}"${r.custom ? ' id="fcName"' : ''}>${r.custom ? '' : `${r.name} <span class="lc">· цифры ${digitsOf(+r.base)}</span>`}</label>
        <textarea id="${r.id}" class="num" data-base="${r.base}" rows="1" spellcheck="false" autocomplete="off" autocapitalize="characters" placeholder="${r.ph || ''}" aria-describedby="${r.id}e"></textarea>
        <p class="err" id="${r.id}e" hidden></p>
        ${r.custom ? '<p class="hint" id="cbHint"></p>' : ''}
      </div>
      <div class="row-side">
        ${r.custom ? '<div class="step"><button type="button" data-step="-1" aria-label="Основание на 1 меньше">−</button><button type="button" data-step="1" aria-label="Основание на 1 больше">+</button></div>' : ''}
        <span class="count" data-count></span>
        <button type="button" class="copy" data-copy="${r.id}" aria-label="Копировать">${COPY_HTML}</button>
      </div>
    </div>`).join('');
  $$('.exo .copy').forEach(b => { b.innerHTML = COPY_HTML; b.setAttribute('aria-label', 'Копировать'); });

  const baseOf = el => (el.dataset.base === 'c' ? state.custom : +el.dataset.base);
  function autosize(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
  function setError(el, msg) {
    const box = $('#' + el.id + 'e');
    box.textContent = msg || '';
    box.hidden = !msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    el.closest('.row, .card').classList.toggle('bad', !!msg);
  }
  function renderCustomLabel() {
    $('#fcName').innerHTML = `Своё основание <span class="lc">· ${nameOf(state.custom)}, цифры ${digitsOf(state.custom)}</span>`;
    $('#fc').placeholder = 'например, ' + (2026n).toString(state.custom).toUpperCase();
    $('#cbHint').textContent = HINTS[state.custom] || '';
    const cb = $('#cb');
    if (+cb.value !== state.custom) cb.value = state.custom;
  }
  function flash(row) {
    if (reduceMotion.matches) return;
    row.classList.remove('flash');
    void row.offsetWidth;
    row.classList.add('flash');
  }
  function renderRows(source, quiet) {
    $$('textarea.num').forEach(el => {
      const b = baseOf(el);
      if (el !== source) {
        const txt = state.empty ? '' : fmtRat(state.num, state.den, b);
        if (el.value !== txt && txt && !quiet) flash(el.closest('.row'));
        el.value = txt;
        setError(el, null);
      }
      const e = expand(state.num, state.den, b), len = e.int.length, fl = e.pre.length + e.rep.length;
      let count = `${num(len)} ${plural(len, 'разряд', 'разряда', 'разрядов')}`;
      if (e.rep) count += `<br>период из ${e.rep.length}`;
      else if (e.cut) count += `<br>первые ${fl} после запятой`;
      else if (fl) count += `<br>${fl} после запятой`;
      el.closest('.row').querySelector('[data-count]').innerHTML = state.empty ? '' : count;
      autosize(el);
    });
  }

  /* ---------- panel ---------- */
  const bank = $('#bank');
  let panelKey = '';
  function effWidth() {
    const need = Math.max(state.width, bitLen(intMag()));
    return WIDTHS.find(w => w >= need) || 64;
  }
  function buildPanel(w, g) {
    const groups = [];
    for (let lo = 0; lo < w; lo += g) groups.push([lo, Math.min(w, lo + g)]);
    const rows = w <= 16 ? 1 : w <= 32 ? 2 : 4;
    const perRow = Math.ceil(groups.length / rows);
    bank.textContent = '';
    const rowEls = [];
    groups.forEach(([lo, hi], gi) => {
      const ri = Math.floor(gi / perRow);
      if (!rowEls[ri]) { rowEls[ri] = document.createElement('div'); rowEls[ri].className = 'brow'; }
      const el = document.createElement('div');
      el.className = 'group ' + (gi % 2 ? 'gb' : 'ga');
      el.dataset.lo = lo;
      el.dataset.hi = hi;
      let html = '<div class="sw-row">';
      for (let i = hi - 1; i >= lo; i--) {
        const weight = i <= 20 ? num(2 ** i) : `2 в степени ${i}`;
        html += `<div class="bit" style="--i:${i}"><span class="idx">${i}</span><span class="led"></span>` +
          `<button type="button" class="sw" data-bit="${i}" aria-pressed="false" aria-label="Бит ${i}, вес ${weight}" title="Бит ${i}, вес ${weight}"><span class="paddle"></span></button></div>`;
      }
      html += '</div><span class="gline"></span><output class="gdigit"></output>';
      el.innerHTML = html;
      rowEls[ri].prepend(el);
    });
    rowEls.reverse().forEach(r => bank.append(r));
  }
  function updatePanel(mag = intMag()) {
    const w = effWidth(), key = w + '/' + state.group;
    if (key !== panelKey) {
      const focused = document.activeElement && document.activeElement.dataset.bit;
      buildPanel(w, state.group);
      panelKey = key;
      if (focused != null) { const b = bank.querySelector(`[data-bit="${focused}"]`); if (b) b.focus(); }
    }
    $$('.sw', bank).forEach(b => {
      const on = ((mag >> BigInt(b.dataset.bit)) & 1n) === 1n;
      b.setAttribute('aria-pressed', on);
      b.previousElementSibling.classList.toggle('on', on);
    });
    $$('.group', bank).forEach(gr => {
      const lo = BigInt(gr.dataset.lo), n = BigInt(gr.dataset.hi - gr.dataset.lo);
      gr.querySelector('.gdigit').textContent = ((mag >> lo) & ((1n << n) - 1n)).toString(16).toUpperCase();
    });
    $$('#widthSeg button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.w === w));
    $$('#groupSeg button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.g === state.group));
    $('#signLed').classList.toggle('on', isNeg());
    const vfd = $('#vfd');
    vfd.textContent = fmtRat(state.num, state.den, 10);
    vfd.classList.toggle('long', vfd.textContent.length > 26);
    const len = bitLen(intMag()), note = $('#pnote'), msgs = [];
    if (len > 64) msgs.push(`Показаны младшие 64 бита из ${len}.`);
    else if (w > state.width) msgs.push(`Число не помещается в ${state.width} бит, пульт расширен до ${w}.`);
    if (fracNum() !== 0n) msgs.push(`Тумблеры показывают целую часть. Дробная часть в двоичной: ${fmtRat(fracNum(), state.den, 2)}.`);
    note.textContent = msgs.join(' ');
    note.hidden = !msgs.length;
  }

  /* ---------- exotic ---------- */
  function renderExotic(source) {
    const fr = $('#fr');
    const r = state.empty ? { text: '', note: 'Значения цифр складываются. Меньшая цифра перед большей вычитается: IV = 4.' } : toRoman(intOf());
    if (fr !== source) { fr.value = r.text; setError(fr, null); }
    $('#frNote').textContent = r.note;
    autosize(fr);

    const iv = intOf(), z = zeckendorf(iv), f = factoradic(iv), dash = '—';
    const exoNote = $('#exoNote');
    exoNote.hidden = state.empty || fracNum() === 0n;
    exoNote.textContent = `Эти системы записывают только целые числа, поэтому здесь показана целая часть: ${fmt(iv, 10)}.`;
    $('#xSetun').textContent = state.empty ? dash : balTernary(iv);
    $('#xFib').textContent = state.empty ? dash : z.text;
    $('#xFact').textContent = state.empty ? dash : f.text;

    const zt = z.terms.slice(0, 7).map(num).join(' + ') + (z.terms.length > 7 ? ' + …' : '');
    $('#xFibCap').innerHTML = 'Сумма разных чисел Фибоначчи, и две единицы подряд не встречаются (теорема Цекендорфа).' +
      (z.terms.length && !state.empty ? `<span class="mono">${num(abs(iv))} = ${zt}</span>` : '');
    const ft = f.terms.slice(0, 6).map(([d, k]) => `${d}·${k}!`).join(' + ') + (f.terms.length > 6 ? ' + …' : '');
    $('#xFactCap').innerHTML = 'Вес разряда с номером k равен k!, а цифра в нём не больше k. Последняя цифра всегда 0.' +
      (f.terms.length && !state.empty ? `<span class="mono">${num(abs(iv))} = ${ft}</span>` : '');
  }

  /* ---------- methods ---------- */
  function renderExplain() {
    const b = state.ex, B = BigInt(b), n = intMag(), s = n.toString(b).toUpperCase();
    const preset = [2, 8, 16].includes(b);
    $$('#exChips .chip').forEach(c => c.setAttribute('aria-pressed', +c.dataset.ex === b));
    $('#exOwnWrap').classList.toggle('on', !preset);
    const exB = $('#exB');
    if (document.activeElement !== exB && !preset) exB.value = b;

    $('#exToT').textContent = `Из десятичной в ${nameTo(b)} (b = ${b})`;
    $('#exFromT').textContent = `Из ${nameIn(b)} в десятичную (b = ${b})`;
    const notes = [];
    if (!state.empty && isNeg()) notes.push('Число отрицательное: переводим модуль, а минус переносим без изменений.');
    if (!state.empty && fracNum() !== 0n) notes.push('Целую и дробную части переводят отдельно: целая ниже, дробная в карточке «Дробная часть».');
    $('#exNeg').textContent = notes.join(' ');
    $('#exNeg').hidden = !notes.length;
    renderFrac(b);

    const ladder = $('#ladder'), tiles = $('#tiles'), sum = $('#sumline'), horner = $('#horner'), chunks = $('#chunks');
    if (state.empty) {
      $('#exToEx').textContent = $('#exFromEx').textContent = 'Пример';
      const msg = '<p class="muted">Впишите число в конвертер наверху, и здесь появится пример.</p>';
      ladder.innerHTML = tiles.innerHTML = chunks.innerHTML = msg;
      sum.textContent = horner.textContent = '';
      return;
    }
    $('#exToEx').innerHTML = `Пример: ${num(n)}<sub>10</sub> → ${b}-ичная`;
    $('#exFromEx').innerHTML = `Пример: ${s}<sub>${b}</sub> → десятичная`;

    // 10 → b: division ladder
    if (n === 0n) ladder.innerHTML = '<p class="muted">Ноль в любой системе записывается как 0.</p>';
    else if (s.length > 40) ladder.innerHTML = `<p class="muted">Понадобится ${num(s.length)} делений. Лесенку показываем для чисел до 40 разрядов.</p>`;
    else {
      const rows = [];
      for (let x = n; x > 0n; x /= B) rows.push([x, x / B, Number(x % B)]);
      ladder.innerHTML = `<table class="ladder"><thead><tr><th>Делимое</th><th></th><th>Частное</th><th>Остаток</th><th><span class="sr">Порядок чтения</span></th></tr></thead><tbody>` +
        rows.map(([x, q, r], i) => `<tr><td>${num(x)}</td><td class="op">: ${b} =</td><td>${num(q)}</td>` +
          `<td class="rem">${r}${r >= 10 ? ` <span class="as">→ ${DIGITS[r]}</span>` : ''}</td>` +
          (i === 0 ? `<td class="arrow" rowspan="${rows.length}" aria-hidden="true"></td>` : '') + '</tr>').join('') +
        `</tbody></table><p class="result" style="margin-top:12px">Остатки снизу вверх: <b class="mono">${s}<sub>${b}</sub></b></p>`;
    }

    // b → 10: tiles + Horner
    if (s.length > 32) {
      tiles.innerHTML = `<p class="muted">В ${nameIn(b)} записи ${num(s.length)} разрядов. Плитки показываем для чисел до 32 разрядов.</p>`;
      sum.textContent = '';
    } else {
      const parts = [];
      tiles.innerHTML = [...s].map((ch, k) => {
        const p = s.length - 1 - k, d = DIGITS.indexOf(ch), prod = BigInt(d) * B ** BigInt(p);
        if (d) parts.push(num(prod));
        return `<div class="tile${d ? '' : ' zero'}"><span class="t-d">${ch}${d >= 10 ? `<small>${d}</small>` : ''}</span>` +
          `<span class="t-w">× ${b}<sup>${p}</sup></span><span class="t-p">${num(prod)}</span></div>`;
      }).join('');
      sum.innerHTML = `<span class="mono">${s}<sub>${b}</sub></span> = <span class="mono">${parts.join(' + ') || '0'}</span> = <b class="mono">${num(n)}<sub>10</sub></b>`;
    }
    if (s.length > 20) horner.innerHTML = `<li class="muted">Шагов будет ${num(s.length)}, показываем схему для чисел до 20 разрядов.</li>`;
    else {
      let acc = 0n;
      horner.innerHTML = [...s].map((ch, k) => {
        const d = BigInt(DIGITS.indexOf(ch));
        if (k === 0) { acc = d; return `<li>начинаем с ${ch}${d >= 10n ? ` = ${d}` : ''}: <b>${num(acc)}</b></li>`; }
        const prev = acc;
        acc = acc * B + d;
        return `<li>${num(prev)} · ${b} + ${d} = <b>${num(acc)}</b></li>`;
      }).join('');
    }

    // 2 ↔ 8 ↔ 16 via bit groups
    const bits = n.toString(2);
    if (bits.length > 64) { chunks.innerHTML = '<p class="muted">Группы показываем для чисел до 64 бит.</p>'; return; }
    const row = size => {
      const padded = bits.padStart(Math.ceil(bits.length / size) * size, '0');
      const parts = padded.match(new RegExp(`.{${size}}`, 'g'));
      const to = size === 3 ? 8 : 16;
      return `<p class="lbl">Группы по ${size} → ${to === 8 ? 'восьмеричная' : 'шестнадцатеричная'}${fracNum() ? ', целая часть' : ''}</p><div class="chunks">` +
        parts.map(p => `<div class="chunk"><span class="cb">${p}</span><span class="cd">${parseInt(p, 2).toString(16).toUpperCase()}</span></div>`).join('') +
        `</div><p class="result">${groupStr(bits, size)}<sub>2</sub> = <b class="mono">${n.toString(to).toUpperCase()}<sub>${to}</sub></b></p>`;
    };
    chunks.innerHTML = row(3) + row(4);
  }

  /* ---------- fractional part ---------- */
  function renderFrac(b) {
    const B = BigInt(b), den = state.den, F = fracNum();
    $('#frT').textContent = `Дробная часть: из десятичной в ${nameTo(b)} и обратно (b = ${b})`;
    const mul = $('#fracMul'), tiles = $('#fracTiles'), sum = $('#fracSum');
    if (state.empty || F === 0n) {
      $('#frToEx').textContent = $('#frFromEx').textContent = 'Пример';
      mul.innerHTML = `<p class="muted">${state.empty ? 'Впишите число в конвертер наверху.' : 'У этого числа нет дробной части.'}</p>` +
        '<p style="margin:10px 0 0"><button type="button" class="ghost" data-demo>Подставить 12,375</button></p>';
      tiles.innerHTML = '<p class="muted">Пример появится, когда у числа будет дробная часть.</p>';
      sum.textContent = '';
      return;
    }
    const fd = fmtRat(F, den, 10), e = expand(F, den, b);
    const digitsStr = e.pre + (e.rep ? `(${e.rep})` : '') + (e.cut ? '…' : '');

    // 10 → b: repeated multiplication
    $('#frToEx').innerHTML = `Пример: ${fd}<sub>10</sub> → ${b}-ичная`;
    const rows = [], seen = new Map();
    let r = F, rep = -1;
    while (r !== 0n && rows.length < 16) {
      if (seen.has(r)) { rep = seen.get(r); break; }
      seen.set(r, rows.length);
      const p = r * B;
      rows.push([r, p, Number(p / den)]);
      r = p % den;
    }
    mul.innerHTML = '<table class="ladder"><thead><tr><th>Дробь</th><th></th><th>Произведение</th><th>Цифра</th></tr></thead><tbody>' +
      rows.map(([x, p, d], i) => `<tr${i === rep ? ' class="loop"' : ''}><td>${fmtRat(x, den, 10)}</td><td class="op">· ${b} =</td>` +
        `<td>${fmtRat(p, den, 10)}</td><td class="rem">${DIGITS[d]}${d >= 10 ? ` <span class="as">(${d})</span>` : ''}</td></tr>`).join('') +
      '</tbody></table>' +
      (rep >= 0 ? `<p class="muted" style="margin-top:10px">Дробь ${fmtRat(r, den, 10)} уже была в строке ${rep + 1}, поэтому дальше цифры пойдут по кругу. Это период, его пишут в скобках.</p>` : '') +
      (r !== 0n && rep < 0 ? `<p class="muted" style="margin-top:10px">Показаны первые ${rows.length} шагов, дробь продолжается.</p>` : '') +
      `<p class="result" style="margin-top:12px">Цифры сверху вниз: <b class="mono">0,${digitsStr}<sub>${b}</sub></b></p>`;

    // b → 10: negative powers, or the period formula
    $('#frFromEx').innerHTML = `Пример: 0,${digitsStr}<sub>${b}</sub> → десятичная`;
    if (e.rep) {
      const m = e.pre.length, k = e.rep.length;
      const R = digitsVal(e.pre + e.rep, b), P = digitsVal(e.pre, b), D = B ** BigInt(m) * (B ** BigInt(k) - 1n);
      tiles.innerHTML = `<p class="muted">В ${nameIn(b)} записи эта дробь бесконечная, поэтому сумма степеней тоже бесконечна. Сворачиваем её формулой для периода: m = ${m}, n = ${k}.</p>`;
      sum.innerHTML = `<span class="mono">0,${digitsStr}<sub>${b}</sub></span> = <span class="mono">(${num(R)} − ${num(P)}) / (${b}<sup>${m}</sup> · (${b}<sup>${k}</sup> − 1)) = ${num(R - P)} / ${num(D)}</span> = <b class="mono">${fd}<sub>10</sub></b>`;
    } else if (e.cut || e.pre.length > 16) {
      tiles.innerHTML = `<p class="muted">После запятой ${e.cut ? 'больше 60' : num(e.pre.length)} цифр. Плитки показываем для дробей до 16 цифр.</p>`;
      sum.textContent = '';
    } else {
      const parts = [];
      tiles.innerHTML = [...e.pre].map((ch, i) => {
        const d = DIGITS.indexOf(ch), q = makeRat(BigInt(d), B ** BigInt(i + 1)), val = fmtRat(q.num, q.den, 10);
        if (d) parts.push(val);
        return `<div class="tile${d ? '' : ' zero'}"><span class="t-d">${ch}${d >= 10 ? `<small>${d}</small>` : ''}</span>` +
          `<span class="t-w">× ${b}<sup>−${i + 1}</sup></span><span class="t-p">${val}</span></div>`;
      }).join('');
      sum.innerHTML = `<span class="mono">0,${e.pre}<sub>${b}</sub></span> = <span class="mono">${parts.join(' + ')}</span> = <b class="mono">${fd}<sub>10</sub></b>`;
    }
  }

  /* ---------- memory: last number and settings, per browser ---------- */
  const STORE_KEY = 'kalkulyator-ss-v2';
  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({
          n: state.num.toString(), d: state.den.toString(), empty: state.empty, custom: state.custom,
          ex: state.ex, width: state.width, group: state.group
        }));
      } catch (err) { /* storage unavailable: nothing to remember */ }
    }, 250);
  }
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(STORE_KEY));
      if (!d || !/^-?\d+$/.test(d.n) || !/^[1-9]\d*$/.test(d.d)) return false;
      const r = makeRat(BigInt(d.n), BigInt(d.d));
      state.num = r.num;
      state.den = r.den;
      state.empty = !!d.empty;
      state.custom = clampBase(d.custom) || state.custom;
      state.ex = clampBase(d.ex) || state.ex;
      if (WIDTHS.includes(d.width)) state.width = d.width;
      if (d.group === 3 || d.group === 4) state.group = d.group;
      return true;
    } catch (err) { return false; }
  }

  /* ---------- wiring ---------- */
  function setValue(v, source, empty = false) {
    state.num = v.num;
    state.den = v.den;
    state.empty = empty;
    $('#exNote').hidden = true;
    updatePanel();
    renderRows(source);
    renderExotic(source);
    renderExplain();
    save();
  }
  function setCustom(b) {
    state.custom = b;
    renderCustomLabel();
    renderRows(null);
    if (lastSource === 'c') { state.ex = b; renderExplain(); }
    save();
  }
  let lastSource = null;

  document.addEventListener('input', e => {
    const el = e.target;
    if (el.matches('textarea.num') || el.id === 'fr') {
      const res = el.id === 'fr' ? parseRoman(el.value) : parsePositional(el.value, baseOf(el));
      autosize(el);
      if (res.error) { setError(el, res.error); return; }
      setError(el, null);
      // The worked example follows the system the person is typing in (decimal keeps the chosen b).
      if (el.matches('textarea.num')) {
        lastSource = el.dataset.base;
        const b = baseOf(el);
        if (b !== 10) state.ex = b;
      }
      setValue(res, el, !!res.empty);
    } else if (el.id === 'cb') {
      const b = clampBase(+el.value);
      if (b) setCustom(b);
    } else if (el.id === 'exB') {
      const b = clampBase(+el.value);
      if (b) { state.ex = b; renderExplain(); save(); }
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('textarea')) { e.preventDefault(); e.target.blur(); }
  });
  document.addEventListener('focusout', e => {
    const el = e.target;
    if (el.matches('textarea.num') && el.getAttribute('aria-invalid') !== 'true') {
      el.value = state.empty ? '' : fmtRat(state.num, state.den, baseOf(el));
      autosize(el);
    }
    if (el.id === 'fr' && el.getAttribute('aria-invalid') !== 'true') {
      el.value = state.empty ? '' : toRoman(intOf()).text;
      autosize(el);
    }
    if (el.id === 'cb') el.value = state.custom;
    if (el.id === 'exB' && ![2, 8, 16].includes(state.ex)) el.value = state.ex;
  });

  $('#rows').addEventListener('click', e => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    const next = Math.min(36, Math.max(2, state.custom + +b.dataset.step));
    if (next !== state.custom) setCustom(next);
  });
  $('#clearBtn').addEventListener('click', () => {
    setValue({ num: 0n, den: 1n }, null, true);
    $('#f10').focus();
  });
  bank.addEventListener('click', e => {
    const b = e.target.closest('.sw');
    if (!b) return;
    setValue(withInt(intMag() ^ (1n << BigInt(b.dataset.bit))), null);
  });
  $('#widthSeg').addEventListener('click', e => {
    const b = e.target.closest('[data-w]');
    if (!b) return;
    state.width = +b.dataset.w;
    updatePanel();
    save();
  });
  $('#groupSeg').addEventListener('click', e => {
    const b = e.target.closest('[data-g]');
    if (!b) return;
    state.group = +b.dataset.g;
    updatePanel();
    save();
  });
  const OPS = {
    clr: () => ({ num: 0n, den: 1n }),
    inc: () => makeRat(state.num + state.den, state.den),
    dec: () => makeRat(state.num - state.den, state.den),
    shl: () => makeRat(state.num * 2n, state.den),
    shr: () => makeRat(state.num, state.den * 2n),
    not: () => withInt(intMag() ^ ((1n << BigInt(effWidth())) - 1n)),
    neg: () => makeRat(-state.num, state.den)
  };
  document.addEventListener('click', e => {
    if (e.target.closest('[data-demo]')) setValue(makeRat(12375n, 1000n), null);
  });
  $('#keys').addEventListener('click', e => {
    const b = e.target.closest('[data-op]');
    if (b) setValue(OPS[b.dataset.op](), null);
  });
  $('#exChips').addEventListener('click', e => {
    const b = e.target.closest('[data-ex]');
    if (!b) return;
    state.ex = +b.dataset.ex;
    renderExplain();
    save();
  });

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const t = $('#' + btn.dataset.copy);
    const text = (t.tagName === 'TEXTAREA' ? t.value : t.textContent).replace(/\s/g, '');
    if (!text || text === '—') return;
    const label = btn.querySelector('.copy-t');
    const done = msg => {
      label.textContent = msg;
      btn.classList.add('done');
      setTimeout(() => { label.textContent = 'Копировать'; btn.classList.remove('done'); }, 1400);
    };
    let p;
    try { p = navigator.clipboard.writeText(text); } catch (err) { p = Promise.reject(err); }
    p.then(() => done('Скопировано'), () => {
      if (t.tagName === 'TEXTAREA') { t.focus(); t.select(); }
      else { const r = document.createRange(); r.selectNodeContents(t); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
      done('Выделено, нажмите Ctrl+C');
    });
  });

  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => $$('textarea').forEach(autosize), 120); });

  /* ---------- boot: switches ripple from bit 0 up to the starting value ---------- */
  if (load()) $('#exNote').hidden = true;
  renderCustomLabel();
  renderRows(null, true);
  renderExotic(null);
  renderExplain();
  if (reduceMotion.matches) {
    updatePanel();
  } else {
    updatePanel(0n);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bank.classList.add('intro');
      updatePanel();
      setTimeout(() => bank.classList.remove('intro'), 1100);
    }));
  }
  if (document.fonts) document.fonts.ready.then(() => $$('textarea').forEach(autosize));
})();
