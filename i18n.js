// Interface texts. Russian static texts live in index.html itself (marked with data-i18n);
// `en.static` replaces them by key. `t` holds the texts that app.js builds at run time.
(function () {
  const { num, plural, nameOf, nameIn, nameTo } = window.Convert;
  const cap = s => s[0].toUpperCase() + s.slice(1);

  window.I18N = {
    ru: {
      title: 'Калькулятор СС',
      t: {
        copy: 'Копировать',
        copied: 'Скопировано',
        selected: 'Выделено, нажмите Ctrl+C',
        eg: x => `например, ${x}`,
        rowName: (b, d) => `${cap(nameOf(b))} <span class="lc">· цифры ${d}</span>`,
        customName: (b, d) => `Своё основание <span class="lc">· ${nameOf(b)}, цифры ${d}</span>`,
        customAria: 'Своё основание от 2 до 36',
        stepDown: 'Основание на 1 меньше',
        stepUp: 'Основание на 1 больше',
        count: (len, e) => {
          const fl = e.pre.length + e.rep.length;
          let s = `${num(len)} ${plural(len, 'разряд', 'разряда', 'разрядов')}`;
          if (e.rep) s += `<br>период из ${e.rep.length}`;
          else if (e.cut) s += `<br>первые ${fl} после запятой`;
          else if (fl) s += `<br>${fl} после запятой`;
          return s;
        },
        bit: (i, w) => `Бит ${i}, вес ${w}`,
        pow2: i => `2 в степени ${i}`,
        low64: len => `Показаны младшие 64 бита из ${len}.`,
        wider: (w0, w) => `Число не помещается в ${w0} бит, пульт расширен до ${w}.`,
        fracBits: f => `Тумблеры показывают целую часть. Дробная часть в двоичной: ${f}.`,
        exoInt: v => `Эти системы записывают только целые числа, поэтому здесь показана целая часть: ${v}.`,
        fibCap: 'Сумма разных чисел Фибоначчи, и две единицы подряд не встречаются (теорема Цекендорфа).',
        factCap: 'Вес разряда с номером k равен k!, а цифра в нём не больше k. Последняя цифра всегда 0.',
        exToT: b => `Из десятичной в ${nameTo(b)} (b = ${b})`,
        exFromT: b => `Из ${nameIn(b)} в десятичную (b = ${b})`,
        noteNeg: 'Число отрицательное: переводим модуль, а минус переносим без изменений.',
        noteFrac: 'Целую и дробную части переводят отдельно: целая ниже, дробная в карточке «Дробная часть».',
        example: 'Пример',
        typeFirst: 'Впишите число в конвертер наверху, и здесь появится пример.',
        exTo: (n, b) => `Пример: ${n}<sub>10</sub> → ${b}-ичная`,
        exFrom: (s, b) => `Пример: ${s}<sub>${b}</sub> → десятичная`,
        zero: 'Ноль в любой системе записывается как 0.',
        tooManyDiv: n => `Понадобится ${n} делений. Лесенку показываем для чисел до 40 разрядов.`,
        ladderHead: ['Делимое', 'Частное', 'Остаток', 'Порядок чтения'],
        remUp: 'Остатки снизу вверх:',
        tilesLong: (b, n) => `В ${nameIn(b)} записи ${n} разрядов. Плитки показываем для чисел до 32 разрядов.`,
        hornerLong: n => `Шагов будет ${n}, показываем схему для чисел до 20 разрядов.`,
        hornerStart: x => `начинаем с ${x}`,
        groupsLong: 'Группы показываем для чисел до 64 бит.',
        groupsLbl: (size, to, frac) => `Группы по ${size} → ${nameOf(to)}${frac ? ', целая часть' : ''}`,
        frT: b => `Дробная часть: из десятичной в ${nameTo(b)} и обратно (b = ${b})`,
        fracTypeFirst: 'Впишите число в конвертер наверху.',
        fracNone: 'У этого числа нет дробной части.',
        demo: 'Подставить 12,375',
        fracLater: 'Пример появится, когда у числа будет дробная часть.',
        mulHead: ['Дробь', 'Произведение', 'Цифра'],
        fracRepeat: (f, row) => `Дробь ${f} уже была в строке ${row}, поэтому дальше цифры пойдут по кругу. Это период, его пишут в скобках.`,
        fracCut: n => `Показаны первые ${n} шагов, дробь продолжается.`,
        digitsDown: 'Цифры сверху вниз:',
        fracInf: (b, m, k) => `В ${nameIn(b)} записи эта дробь бесконечная, поэтому сумма степеней тоже бесконечна. Сворачиваем её формулой для периода: m = ${m}, n = ${k}.`,
        fracLong: (cut, n) => `После запятой ${cut ? 'больше 60' : num(n)} цифр. Плитки показываем для дробей до 16 цифр.`,
        hints: {
          3: 'Обычная троичная. Сбалансированный вариант, как у «Сетуни», внизу среди необычных систем.',
          5: 'Счёт по пальцам одной руки.',
          12: 'Дюжинная: 12 делится на 2, 3, 4 и 6. Отсюда дюжины, гроссы и 12 часов на циферблате.',
          20: 'Двадцатеричной системой пользовались майя: пальцы рук и ног.',
          32: 'Основание кодировки Base32.',
          36: 'Все десять цифр и все 26 латинских букв. Так часто кодируют короткие ссылки.'
        }
      }
    },

    en: {
      title: 'Base Calculator',
      static: {
        h1: 'Base Calculator',
        lede: 'Convert numbers between bases. Type a number into any field and the others update at once. Bases 2 to 36, whole numbers and fractions of any length.',
        convAria: 'Number conversion',
        howT: 'Type the number into the row of the base it is written in',
        howP: 'The answer appears in the other rows right away. Write fractions with a point: 12.375. Put a repeating part in brackets: 0.(3).',
        exNote: ' Right now 1958 is filled in as an example: click a field, erase it and type your own.',
        clear: 'Clear',
        hPanel: 'Switch panel',
        panelP: 'The same number in bits. Click a switch to flip one bit and watch the digits above change.',
        plate: 'Base Calculator',
        plateModel: 'R-36',
        vfdLabel: 'Dec',
        sign: 'Sign',
        wLbl: 'Word size',
        gLbl: 'Groups under switches',
        g3: 'by 3 → oct',
        g4: 'by 4 → hex',
        kLbl: 'Operations',
        kClr: 'Clr',
        kNot: 'Not',
        kClrT: 'Reset to zero',
        kIncT: 'Add 1',
        kDecT: 'Subtract 1',
        kShlT: 'Shift left: multiply by 2',
        kShlA: 'Shift left',
        kShrT: 'Shift right: divide by 2',
        kShrA: 'Shift right',
        kNotT: 'Invert all bits within the word size',
        kNegT: 'Change sign',
        hEx: 'How to convert by hand',
        exP: 'First the general method for any base <i class="v">b</i>, then the same method on the number from the converter.',
        exLbl: 'Base <i class="v">b</i>:',
        exOwn: 'own',
        exBA: 'Own base from 2 to 36',
        divLbl: 'General method: division with remainder',
        divOl: '<li>Divide the number <i class="v">N</i> by <i class="v">b</i> with remainder: <span class="f">N = q<sub>1</sub>·b + r<sub>0</sub></span>.</li>' +
          '<li>Divide the quotient by <i class="v">b</i> again: <span class="f">q<sub>1</sub> = q<sub>2</sub>·b + r<sub>1</sub></span>. Repeat until the quotient is 0.</li>' +
          '<li>Every remainder is less than <i class="v">b</i>, so it is a ready digit. Write the remainders in reverse order: <span class="f">(r<sub>k</sub> … r<sub>1</sub> r<sub>0</sub>)<sub>b</sub></span>.</li>' +
          '<li>Remainders of 10 and more are written as letters: 10 = A, 11 = B, …, 35 = Z.</li>',
        powLbl: 'General method: sum of powers',
        powOl: '<li>Number the digits from right to left, starting at zero: the rightmost digit is <span class="f">a<sub>0</sub></span>.</li>' +
          '<li>Replace letters with numbers: A = 10, B = 11 and so on.</li>' +
          '<li>Multiply digit number <i class="v">k</i> by <span class="f">b<sup>k</sup></span> and add up all the products.</li>',
        hornerLbl: 'The same without powers: Horner’s method',
        hornerP: 'Take the first digit on the left, multiply it by <i class="v">b</i> and add the next digit. Repeat until the last digit.',
        fracMulLbl: 'Decimal to base b: multiplication',
        fracMulOl: '<li>Take the fractional part <i class="v">F</i> and multiply it by <i class="v">b</i>: <span class="f">F·b = c<sub>1</sub> + F<sub>1</sub></span>, where <span class="f">c<sub>1</sub></span> is a whole number and <span class="f">F<sub>1</sub></span> is again a fraction below 1.</li>' +
          '<li>The whole number <span class="f">c<sub>1</sub></span> becomes the first digit after the point. Repeat the same with the fraction <span class="f">F<sub>1</sub></span>.</li>' +
          '<li>Read the digits from top to bottom. Stop when the fraction becomes 0. If a fraction repeats, the digits from there on go round in a loop: that is the period, written in brackets.</li>',
        fracPowLbl: 'Base b to decimal: negative powers',
        fracPowF: '0.a<sub>−1</sub>a<sub>−2</sub>…a<sub>−m</sub> = a<sub>−1</sub>·b<sup>−1</sup> + a<sub>−2</sub>·b<sup>−2</sup> + … + a<sub>−m</sub>·b<sup>−m</sup>',
        fracPowOl: '<li>Number the digits after the point from left to right: −1, −2, −3 and so on.</li>' +
          '<li>Divide digit number −k by <span class="f">b<sup>k</sup></span> and add up the results.</li>' +
          '<li>Fold a repeating fraction with the formula <span class="f">0.P(R)<sub>b</sub> = (PR − P) / (b<sup>m</sup>·(b<sup>n</sup> − 1))</span>. Here P and PR are read as whole numbers in base b, m is the length of P and n is the length of the period R.</li>',
        anyT: 'From any base to any base',
        anyP1: 'The general path from base <i class="v">p</i> to base <i class="v">q</i> goes through decimal: first <span class="f">p → 10</span> by the sum of powers, then <span class="f">10 → q</span> by division with remainder.',
        anyP2: 'Between 2, 8 and 16 there is a shortcut. Since 8 = 2<sup>3</sup> and 16 = 2<sup>4</sup>, each octal digit is exactly 3 bits and each hexadecimal digit exactly 4. Cut the binary number into groups from right to left and convert each group separately. The other way works the same: replace every digit with its group of bits.',
        hExo: 'Unusual systems',
        exoP: 'Not every way of writing numbers works like decimal. These four are computed from the same value.',
        roman: 'Roman',
        setunName: 'Balanced ternary',
        setunCap: 'Digits −1, 0 and +1. No sign is needed: for a negative number the pluses and minuses simply swap. The Setun computer (Moscow State University, 1958) ran on this system.',
        fibName: 'Fibonacci',
        factName: 'Factorial',
        foot: 'Numbers are stored as exact BigInt fractions, so length is unlimited and nothing is rounded. An infinite fraction is shown with its period in brackets; if the period is longer than 60 digits, the output is cut with an ellipsis. The panel shows the whole part up to 64 bits.'
      },
      t: {
        copy: 'Copy',
        copied: 'Copied',
        selected: 'Selected, press Ctrl+C',
        eg: x => `e.g. ${x}`,
        rowName: (b, d) => `${cap(nameOf(b))} <span class="lc">· digits ${d}</span>`,
        customName: (b, d) => `Own base <span class="lc">· ${nameOf(b)}, digits ${d}</span>`,
        customAria: 'Own base from 2 to 36',
        stepDown: 'Base minus 1',
        stepUp: 'Base plus 1',
        count: (len, e) => {
          const fl = e.pre.length + e.rep.length;
          let s = `${num(len)} ${len === 1 ? 'digit' : 'digits'}`;
          if (e.rep) s += `<br>period of ${e.rep.length}`;
          else if (e.cut) s += `<br>first ${fl} after the point`;
          else if (fl) s += `<br>${fl} after the point`;
          return s;
        },
        bit: (i, w) => `Bit ${i}, weight ${w}`,
        pow2: i => `2 to the power of ${i}`,
        low64: len => `Showing the low 64 bits of ${len}.`,
        wider: (w0, w) => `The number does not fit in ${w0} bits, so the panel grew to ${w}.`,
        fracBits: f => `The switches show the whole part. Fractional part in binary: ${f}.`,
        exoInt: v => `These systems only write whole numbers, so the whole part is shown here: ${v}.`,
        fibCap: 'A sum of distinct Fibonacci numbers with no two 1s in a row (Zeckendorf’s theorem).',
        factCap: 'Digit number k has weight k!, and the digit in it is at most k. The last digit is always 0.',
        exToT: b => `From decimal to ${nameOf(b)} (b = ${b})`,
        exFromT: b => `From ${nameOf(b)} to decimal (b = ${b})`,
        noteNeg: 'The number is negative: convert its absolute value and keep the minus as it is.',
        noteFrac: 'The whole and fractional parts are converted separately: the whole part below, the fractional part in the “Fractional part” card.',
        example: 'Example',
        typeFirst: 'Type a number into the converter at the top and an example appears here.',
        exTo: (n, b) => `Example: ${n}<sub>10</sub> → base ${b}`,
        exFrom: (s, b) => `Example: ${s}<sub>${b}</sub> → decimal`,
        zero: 'Zero is written as 0 in every base.',
        tooManyDiv: n => `That takes ${n} divisions. The ladder is shown for numbers up to 40 digits.`,
        ladderHead: ['Dividend', 'Quotient', 'Remainder', 'Reading order'],
        remUp: 'Remainders from bottom to top:',
        tilesLong: (b, n) => `In ${nameOf(b)} the number has ${n} digits. Tiles are shown for numbers up to 32 digits.`,
        hornerLong: n => `That takes ${n} steps; the scheme is shown for numbers up to 20 digits.`,
        hornerStart: x => `start with ${x}`,
        groupsLong: 'Groups are shown for numbers up to 64 bits.',
        groupsLbl: (size, to, frac) => `Groups of ${size} → ${nameOf(to)}${frac ? ', whole part' : ''}`,
        frT: b => `Fractional part: decimal to ${nameOf(b)} and back (b = ${b})`,
        fracTypeFirst: 'Type a number into the converter at the top.',
        fracNone: 'This number has no fractional part.',
        demo: 'Try 12.375',
        fracLater: 'An example appears once the number has a fractional part.',
        mulHead: ['Fraction', 'Product', 'Digit'],
        fracRepeat: (f, row) => `Fraction ${f} already appeared in row ${row}, so from here the digits go round in a loop. That is the period, written in brackets.`,
        fracCut: n => `Showing the first ${n} steps; the fraction goes on.`,
        digitsDown: 'Digits from top to bottom:',
        fracInf: (b, m, k) => `In ${nameOf(b)} this fraction is infinite, so the sum of powers is infinite too. Fold it with the period formula: m = ${m}, n = ${k}.`,
        fracLong: (cut, n) => `There are ${cut ? 'more than 60' : num(n)} digits after the point. Tiles are shown for fractions up to 16 digits.`,
        hints: {
          3: 'Plain ternary. The balanced version used by the Setun computer is below, among the unusual systems.',
          5: 'Counting on the fingers of one hand.',
          12: 'Duodecimal: 12 divides by 2, 3, 4 and 6. Hence dozens, grosses and 12 hours on a clock face.',
          20: 'The Maya counted in base 20: fingers and toes.',
          32: 'The base of Base32 encoding.',
          36: 'All ten digits and all 26 Latin letters. Short links are often encoded this way.'
        }
      }
    }
  };
})();
