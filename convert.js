// Number logic for Калькулятор СС: parsing, exact rational conversion between bases 2–36,
// Roman and other non-positional systems. No DOM; works in the browser (window.Convert) and in Node.
(function (root) {
  'use strict';
  const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const GROUP_SIZE = { 2: 4, 8: 3, 10: 3, 16: 4 };

  const NAMES = {
    2: 'двоичная', 3: 'троичная', 4: 'четверичная', 5: 'пятеричная', 6: 'шестеричная', 7: 'семеричная',
    8: 'восьмеричная', 9: 'девятеричная', 10: 'десятичная', 11: 'одиннадцатеричная', 12: 'двенадцатеричная',
    13: 'тринадцатеричная', 14: 'четырнадцатеричная', 15: 'пятнадцатеричная', 16: 'шестнадцатеричная',
    20: 'двадцатеричная', 32: 'тридцатидвухричная', 36: 'тридцатишестеричная'
  };
  const nameOf = b => NAMES[b] || `${b}-ичная`;
  const nameIn = b => nameOf(b).replace(/ая$/, 'ой');
  const nameTo = b => nameOf(b).replace(/ая$/, 'ую');

  const abs = v => (v < 0n ? -v : v);
  const bitLen = v => (v === 0n ? 0 : v.toString(2).length);
  const num = v => v.toLocaleString('ru-RU');
  function plural(n, one, few, many) {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
    return many;
  }
  function groupStr(s, size) {
    if (!size || s.length <= size) return s;
    const out = [];
    for (let i = s.length; i > 0; i -= size) out.unshift(s.slice(Math.max(0, i - size), i));
    return out.join(' ');
  }
  const fmt = (v, base) => (v < 0n ? '−' : '') + groupStr(abs(v).toString(base).toUpperCase(), GROUP_SIZE[base] || 0);
  const clampBase = v => (Number.isInteger(v) && v >= 2 && v <= 36 ? v : null);

  /* ---------- exact rationals: a value is { num, den }, den > 0, reduced ---------- */
  const gcd = (a, b) => { a = abs(a); b = abs(b); while (b) [a, b] = [b, a % b]; return a; };
  function makeRat(n, d) {
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    return { num: n / g, den: d / g };
  }
  const digitsVal = (s, b) => [...s].reduce((v, ch) => v * BigInt(b) + BigInt(DIGITS.indexOf(ch)), 0n);
  const FRAC_LIMIT = 60;
  // Digits of num/den in base b; a repeating remainder marks the period.
  function expand(num, den, b) {
    const B = BigInt(b), n = abs(num);
    const out = { neg: num < 0n, int: (n / den).toString(b).toUpperCase(), pre: '', rep: '', cut: false };
    const seen = new Map(), digits = [];
    let r = n % den, start = -1;
    while (r !== 0n) {
      if (seen.has(r)) { start = seen.get(r); break; }
      if (digits.length >= FRAC_LIMIT) { out.cut = true; break; }
      seen.set(r, digits.length);
      r *= B;
      digits.push(DIGITS[Number(r / den)]);
      r %= den;
    }
    if (start >= 0) { out.pre = digits.slice(0, start).join(''); out.rep = digits.slice(start).join(''); }
    else out.pre = digits.join('');
    return out;
  }
  function fmtRat(num, den, b) {
    const e = expand(num, den, b);
    let s = (e.neg ? '−' : '') + groupStr(e.int, GROUP_SIZE[b] || 0);
    if (e.pre || e.rep) s += ',' + e.pre + (e.rep ? `(${e.rep})` : '') + (e.cut ? '…' : '');
    return s;
  }

  /* ---------- parsing ---------- */
  const digitRange = b => (b <= 10 ? `0–${b - 1}` : `0–9 и A–${DIGITS[b - 1]}`);
  const digitsOf = b => (b === 2 ? '0 и 1' : digitRange(b));
  // Accepts "12,375", "12.375", "0,1(6)" (period in brackets) and a trailing "…" from truncated output.
  function parsePositional(raw, base) {
    let s = raw.replace(/[\s_'\u00a0\u2009]/g, '').replace(/…$/, '');
    if (s === '') return { num: 0n, den: 1n, empty: true };
    let neg = false;
    if (/^[-−]/.test(s)) { neg = true; s = s.slice(1); }
    const pre = { 2: '0b', 8: '0o', 16: '0x' }[base];
    if (pre && s.toLowerCase().startsWith(pre)) s = s.slice(2);
    const m = s.match(/^([^.,()]*)(?:[.,]([^.,()]*)(?:\(([^.,()]+)\))?)?$/);
    if (!m) return { error: 'Запятая может быть только одна, а период пишется в скобках в самом конце: 0,1(6).' };
    const [, ip, fp = '', rp = ''] = m;
    if (!ip && !fp && !rp) return { error: 'Нужна хотя бы одна цифра.' };
    const bad = [...(ip + fp + rp)].find(ch => { const d = DIGITS.indexOf(ch.toUpperCase()); return d < 0 || d >= base; });
    if (bad) return { error: `«${bad}» не цифра в ${nameIn(base)} системе. Допустимы ${digitRange(base)}.` };
    const B = BigInt(base), up = x => x.toUpperCase();
    const I = digitsVal(up(ip), base), P = digitsVal(up(fp), base), scale = B ** BigInt(fp.length);
    let n, d;
    if (rp) { d = scale * (B ** BigInt(rp.length) - 1n); n = I * d + digitsVal(up(fp + rp), base) - P; }
    else { d = scale; n = I * d + P; }
    return makeRat(neg ? -n : n, d);
  }

  const ROMAN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  const RV = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const ROMAN_RE = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
  function romanSmall(n) {
    let s = '';
    for (const [v, r] of ROMAN) while (n >= v) { s += r; n -= v; }
    return s;
  }
  function romanVal(s) {
    let t = 0;
    for (let i = 0; i < s.length; i++) {
      const a = RV[s[i]], b = RV[s[i + 1]] || 0;
      t += a < b ? -a : a;
    }
    return t;
  }
  function toRoman(v) {
    if (v < 0n) return { text: '—', note: 'Отрицательных чисел римляне не записывали.' };
    if (v === 0n) return { text: 'N', note: 'Нуля в римской записи нет. Средневековые счётчики ставили N, от латинского nulla.' };
    if (v > 3999999n) return { text: '—', note: 'Больше 3 999 999 римскими цифрами не записать даже с чертой.' };
    const n = Number(v);
    if (n < 4000) return { text: romanSmall(n), note: 'Значения цифр складываются. Меньшая цифра перед большей вычитается: IV = 4.' };
    const hi = Math.floor(n / 1000), lo = n % 1000;
    return {
      text: [...romanSmall(hi)].map(c => c + '\u0305').join('') + romanSmall(lo),
      note: 'Черта над цифрой умножает её на 1000. Этот приём называется винкулум.'
    };
  }
  function parseRoman(raw) {
    const s = raw.toUpperCase().replace(/\s/g, '');
    if (s === '') return { num: 0n, den: 1n, empty: true };
    if (s === 'N') return { num: 0n, den: 1n };
    const bad = { error: 'Это не римское число. Пример правильной записи: MCMLVIII.' };
    const m = s.match(/^((?:[IVXLCDM]\u0305)*)([IVXLCDM]*)$/);
    if (!m) return bad;
    const hi = m[1].replace(/\u0305/g, ''), lo = m[2];
    if (!ROMAN_RE.test(hi) || !ROMAN_RE.test(lo)) return bad;
    return { num: BigInt(romanVal(hi) * 1000 + romanVal(lo)), den: 1n };
  }

  /* ---------- non-positional systems ---------- */
  function balTernary(v) {
    if (v === 0n) return '0';
    let n = v, s = '';
    while (n !== 0n) {
      const r = ((n % 3n) + 3n) % 3n;
      if (r === 2n) { s = '−' + s; n = (n + 1n) / 3n; }
      else { s = (r === 1n ? '+' : '0') + s; n = (n - r) / 3n; }
    }
    return s;
  }
  function zeckendorf(v) {
    let n = abs(v);
    if (n === 0n) return { text: '0', terms: [] };
    const f = [1n, 2n];
    while (f[f.length - 1] <= n) f.push(f[f.length - 1] + f[f.length - 2]);
    let s = '';
    const terms = [];
    for (let i = f.length - 1; i >= 0; i--) {
      if (f[i] <= n) { s += '1'; n -= f[i]; terms.push(f[i]); } else s += '0';
    }
    return { text: (v < 0n ? '−' : '') + s.replace(/^0+/, ''), terms };
  }
  function factoradic(v) {
    let n = abs(v);
    if (n === 0n) return { text: '0', terms: [] };
    const d = [];
    for (let i = 1n; n > 0n; i++) { d.push(n % i); n /= i; }
    d.reverse();
    const text = d.some(x => x > 35n) ? d.join(':') : d.map(x => DIGITS[Number(x)]).join('');
    const terms = d.map((x, k) => [x, d.length - 1 - k]).filter(([x]) => x > 0n);
    return { text: (v < 0n ? '−' : '') + text, terms };
  }

  const api = { DIGITS, GROUP_SIZE, NAMES, nameOf, nameIn, nameTo, abs, bitLen, num, plural, groupStr, fmt, clampBase, gcd, makeRat, digitsVal, FRAC_LIMIT, expand, fmtRat, digitRange, digitsOf, parsePositional, toRoman, parseRoman, balTernary, zeckendorf, factoradic };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Convert = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
