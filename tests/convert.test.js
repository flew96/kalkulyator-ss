const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../convert.js');

const parse = (s, b) => C.parsePositional(s, b);
const show = (s, from, to) => { const r = parse(s, from); return C.fmtRat(r.num, r.den, to); };
const rat = (n, d) => C.makeRat(BigInt(n), BigInt(d));
const same = (a, b) => assert.deepEqual({ num: a.num, den: a.den }, { num: b.num, den: b.den });

test('integers between the main bases', () => {
  assert.equal(show('1958', 10, 2), '111 1010 0110');
  assert.equal(show('1958', 10, 8), '3 646');
  assert.equal(show('1958', 10, 16), '7A6');
  assert.equal(show('1958', 10, 12), '1172');
  assert.equal(show('7a6', 16, 10), '1 958');
  assert.equal(show('0', 10, 2), '0');
});

test('input tolerates spaces, underscores, prefixes and a minus', () => {
  same(parse('1 000_000', 10), rat(1000000, 1));
  same(parse('0xFF', 16), rat(255, 1));
  same(parse('0b1010', 2), rat(10, 1));
  same(parse('0o17', 8), rat(15, 1));
  same(parse('-42', 10), rat(-42, 1));
  same(parse('−42', 10), rat(-42, 1));
});

test('finite fractions', () => {
  same(parse('12,375', 10), rat(99, 8));
  same(parse('12.375', 10), rat(99, 8));
  assert.equal(show('12,375', 10, 2), '1100,011');
  assert.equal(show('12,375', 10, 16), 'C,6');
  assert.equal(show('FF.8', 16, 10), '255,5');
  assert.equal(show('-2,5', 10, 2), '−10,1');
  assert.equal(show(',5', 10, 2), '0,1');
});

test('periodic fractions are found and printed in brackets', () => {
  assert.equal(show('0,1', 10, 2), '0,0(0011)');
  assert.equal(show('0,1', 10, 16), '0,1(9)');
  assert.equal(show('0,1', 3, 10), '0,(3)');
  assert.equal(show('1,1', 10, 3), '1,(0022)');
  assert.equal(show('0,5', 10, 3), '0,(1)');
});

test('periodic input in brackets is read back exactly', () => {
  same(parse('0,(3)', 10), rat(1, 3));
  same(parse('0,1(6)', 10), rat(1, 6));
  same(parse('0,0(0011)', 2), rat(1, 10));
  same(parse('0,(9)', 10), rat(1, 1));
});

test('long periods are cut at FRAC_LIMIT digits', () => {
  const r = rat(1, 97);
  const e = C.expand(r.num, r.den, 10);
  assert.equal(e.cut, true);
  assert.equal(e.pre.length, C.FRAC_LIMIT);
  assert.ok(C.fmtRat(r.num, r.den, 10).endsWith('…'));
  // a truncated value can be pasted back without an error
  assert.equal(parse(C.fmtRat(r.num, r.den, 10), 10).error, undefined);
});

test('invalid input explains what is wrong', () => {
  assert.match(parse('19', 8).error, /«9».*восьмеричной.*0–7/);
  assert.match(parse('G', 16).error, /0–9 и A–F/);
  assert.ok(parse('1,2,3', 10).error);
  assert.ok(parse('1,(2', 10).error);
  assert.ok(parse('-', 10).error);
  assert.deepEqual(parse('', 10), { num: 0n, den: 1n, empty: true });
});

test('huge integers keep every digit', () => {
  const big = (2n ** 200n).toString();
  const r = parse(big, 10);
  assert.equal(r.num, 2n ** 200n);
  assert.equal(C.fmtRat(r.num, r.den, 2).replace(/ /g, ''), '1' + '0'.repeat(200));
});

test('round trip through every base gives the same exact value', () => {
  let seed = 7;
  const rnd = m => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % m; };
  for (let i = 0; i < 400; i++) {
    const x = rat(rnd(2000000) - 1000000, [1, 2, 3, 7, 8, 10, 12, 60, 97, 1000][rnd(10)]);
    const b = 2 + rnd(35);
    const e = C.expand(x.num, x.den, b);
    if (e.cut) continue;
    same(parse(C.fmtRat(x.num, x.den, b), b), x);
  }
});

test('roman numerals', () => {
  assert.equal(C.toRoman(1958n).text, 'MCMLVIII');
  assert.equal(C.toRoman(3999n).text, 'MMMCMXCIX');
  assert.equal(C.toRoman(0n).text, 'N');
  assert.equal(C.toRoman(4000n).text, 'I̅V̅');
  assert.equal(C.toRoman(-1n).text, '—');
  assert.equal(C.toRoman(4000000n).text, '—');
  for (let n = 1n; n <= 3999n; n++) assert.equal(C.parseRoman(C.toRoman(n).text).num, n);
  assert.equal(C.parseRoman('V̅').num, 5000n);
  assert.ok(C.parseRoman('IIII').error);
  assert.ok(C.parseRoman('VX').error);
});

test('balanced ternary evaluates back to the number', () => {
  const val = s => [...s].reduce((v, ch) => v * 3n + ({ '+': 1n, '0': 0n, '−': -1n })[ch], 0n);
  for (let n = -300n; n <= 300n; n++) assert.equal(val(C.balTernary(n)), n);
});

test('fibonacci (Zeckendorf) has no adjacent ones and sums correctly', () => {
  for (let n = 1n; n <= 1000n; n++) {
    const z = C.zeckendorf(n);
    assert.ok(!z.text.includes('11'), `${n}: ${z.text}`);
    assert.equal(z.terms.reduce((a, b) => a + b, 0n), n);
  }
  assert.deepEqual(C.zeckendorf(1958n).terms, [1597n, 233n, 89n, 34n, 5n]);
});

test('factorial base', () => {
  assert.equal(C.factoradic(1958n).text, '2412100');
  const fact = k => (k <= 1 ? 1n : BigInt(k) * fact(k - 1));
  for (let n = 1n; n <= 1000n; n++) {
    const f = C.factoradic(n);
    assert.equal(f.terms.reduce((s, [d, k]) => s + d * fact(k), 0n), n);
    assert.ok(f.terms.every(([d, k]) => d <= BigInt(k)));
  }
});

test('english: point separates the fraction, comma groups thousands', () => {
  C.setLang('en');
  try {
    assert.equal(show('12.375', 10, 2), '1100.011');
    assert.equal(show('0.1', 10, 2), '0.0(0011)');
    same(parse('1,958', 10), rat(1958, 1));
    same(parse('1,234.5', 10), rat(2469, 2));
    assert.equal(C.nameOf(16), 'hexadecimal');
    assert.equal(C.nameOf(23), 'base-23');
    assert.match(parse('19', 8).error, /“9”.*octal.*0–7/);
    assert.match(parse('G', 16).error, /0–9 and A–F/);
    assert.equal(C.num(1958n), '1,958');
    assert.match(C.toRoman(0n).note, /no zero/);
  } finally {
    C.setLang('ru');
  }
  assert.equal(show('12,375', 10, 2), '1100,011');
});

test('helpers', () => {
  assert.equal(C.groupStr('1111010', 4), '111 1010');
  assert.equal(C.plural(1, 'разряд', 'разряда', 'разрядов'), 'разряд');
  assert.equal(C.plural(3, 'разряд', 'разряда', 'разрядов'), 'разряда');
  assert.equal(C.plural(11, 'разряд', 'разряда', 'разрядов'), 'разрядов');
  assert.equal(C.plural(22, 'разряд', 'разряда', 'разрядов'), 'разряда');
  assert.equal(C.nameIn(16), 'шестнадцатеричной');
  assert.equal(C.nameTo(7), 'семеричную');
  assert.equal(C.clampBase(37), null);
  same(C.makeRat(6n, -4n), rat(-3, 2));
});
