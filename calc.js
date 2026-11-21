// Avaliador de expressões sem eval(): tokenização + descida recursiva.
// Gramática (por ordem crescente de precedência):
//   expr     := termo (('+' | '-') termo)*
//   termo    := unario (('*' | '/') unario | <multiplicação implícita>)*
//   unario   := ('+' | '-') unario | potencia
//   potencia := postfix ('^' unario)?          // associativa à direita: 2^3^2 = 2^9
//   postfix  := primario ('!' | '%')*
//   primario := numero | constante | funcao '(' expr ')' | '(' expr ')'
// Nota: -2^2 = -4 (o sinal aplica-se depois da potência, como na matemática).
(function (global) {
  'use strict';

  const CONSTANTES = {
    pi: () => Math.PI,
    e: () => Math.E,
    ans: (ctx) => ctx.ans,
  };

  // Converte o ângulo de entrada/saída conforme o modo (graus ou radianos).
  const paraRad = (x, ctx) => (ctx.angulo === 'deg' ? (x * Math.PI) / 180 : x);
  const deRad = (x, ctx) => (ctx.angulo === 'deg' ? (x * 180) / Math.PI : x);

  // Elimina resíduos como sin(180°) = 1.2e-16.
  const limparTrig = (x) => (Math.abs(x) < 1e-12 ? 0 : x);

  const FUNCOES = {
    sin: (x, ctx) => limparTrig(Math.sin(paraRad(x, ctx))),
    cos: (x, ctx) => limparTrig(Math.cos(paraRad(x, ctx))),
    tan: (x, ctx) => {
      // tan(90°), tan(270°)... são indefinidas; em vírgula flutuante dariam ~1e16.
      if (ctx.angulo === 'deg' && Math.abs(x % 180) === 90) throw new Error('Fora do domínio');
      const c = Math.cos(paraRad(x, ctx));
      if (Math.abs(c) < 1e-15) throw new Error('Fora do domínio');
      return limparTrig(Math.tan(paraRad(x, ctx)));
    },
    asin: (x, ctx) => deRad(Math.asin(x), ctx),
    acos: (x, ctx) => deRad(Math.acos(x), ctx),
    atan: (x, ctx) => deRad(Math.atan(x), ctx),
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    ln: Math.log,
    log: Math.log10,
    exp: Math.exp,
    abs: Math.abs,
  };

  function tokenizar(texto) {
    const tokens = [];
    let i = 0;
    while (i < texto.length) {
      const c = texto[i];
      if (c === ' ') { i++; continue; }

      if (/[0-9.]/.test(c)) {
        // Número, incluindo notação científica (1.5e-7) vinda de resultados anteriores.
        const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(texto.slice(i));
        if (!m || texto[i + m[0].length] === '.') throw new Error('Número inválido');
        const num = m[0];
        tokens.push({ tipo: 'num', valor: parseFloat(num) });
        i += num.length;
        continue;
      }

      if (/[a-z]/i.test(c)) {
        let nome = '';
        while (i < texto.length && /[a-z]/i.test(texto[i])) nome += texto[i++];
        nome = nome.toLowerCase();
        if (Object.hasOwn(FUNCOES, nome)) tokens.push({ tipo: 'fn', valor: nome });
        else if (Object.hasOwn(CONSTANTES, nome)) tokens.push({ tipo: 'const', valor: nome });
        else throw new Error('Desconhecido: ' + nome);
        continue;
      }

      if ('+-*/%^!()'.includes(c)) {
        tokens.push({ tipo: 'op', valor: c });
        i++;
        continue;
      }

      throw new Error('Carácter inválido: ' + c);
    }
    return tokens;
  }

  function fatorial(n) {
    if (!Number.isInteger(n) || n < 0) throw new Error('Fatorial só para inteiros ≥ 0');
    if (n > 170) throw new Error('Resultado demasiado grande');
    let r = 1;
    for (let k = 2; k <= n; k++) r *= k;
    return r;
  }

  function avaliar(texto, opcoes) {
    const ctx = { angulo: 'rad', ans: 0, ...opcoes };
    const tokens = tokenizar(texto);
    if (tokens.length === 0) throw new Error('Expressão vazia');
    let pos = 0;

    const espiar = () => tokens[pos];
    const eOp = (t, v) => t && t.tipo === 'op' && t.valor === v;
    const consumir = (v) => {
      if (!eOp(espiar(), v)) throw new Error('Esperado "' + v + '"');
      pos++;
    };
    // Um token que pode iniciar um operando (para a multiplicação implícita: 2π, 3(4), 2sin(30)).
    const iniciaOperando = (t) => t && (t.tipo === 'num' || t.tipo === 'const' || t.tipo === 'fn' || eOp(t, '('));

    function expr() {
      let v = termo();
      while (eOp(espiar(), '+') || eOp(espiar(), '-')) {
        const op = tokens[pos++].valor;
        const d = termo();
        v = op === '+' ? v + d : v - d;
      }
      return v;
    }

    function termo() {
      let v = unario();
      for (;;) {
        const t = espiar();
        if (eOp(t, '*') || eOp(t, '/')) {
          pos++;
          const d = unario();
          if (t.valor === '/' && d === 0) throw new Error('Divisão por zero');
          v = t.valor === '*' ? v * d : v / d;
        } else if (iniciaOperando(t)) {
          v *= unario();
        } else {
          return v;
        }
      }
    }

    function unario() {
      const t = espiar();
      if (eOp(t, '+') || eOp(t, '-')) {
        pos++;
        const v = unario();
        return t.valor === '-' ? -v : v;
      }
      return potencia();
    }

    function potencia() {
      const base = postfix();
      if (!eOp(espiar(), '^')) return base;
      pos++;
      const exp = unario();
      if (base === 0 && exp < 0) throw new Error('Divisão por zero');
      const r = Math.pow(base, exp);
      if (Number.isNaN(r)) throw new Error('Fora do domínio');
      return r;
    }

    function postfix() {
      let v = primario();
      for (;;) {
        if (eOp(espiar(), '!')) { pos++; v = fatorial(v); }
        else if (eOp(espiar(), '%')) { pos++; v = v / 100; }
        else return v;
      }
    }

    function primario() {
      const t = espiar();
      if (!t) throw new Error('Expressão incompleta');
      if (t.tipo === 'num') { pos++; return t.valor; }
      if (t.tipo === 'const') { pos++; return CONSTANTES[t.valor](ctx); }
      if (t.tipo === 'fn') {
        pos++;
        consumir('(');
        const arg = expr();
        consumir(')');
        const r = FUNCOES[t.valor](arg, ctx);
        if (!Number.isFinite(r)) throw new Error('Fora do domínio');
        return r;
      }
      if (eOp(t, '(')) {
        pos++;
        const v = expr();
        consumir(')');
        return v;
      }
      throw new Error('Inesperado "' + t.valor + '"');
    }

    const resultado = expr();
    if (pos < tokens.length) throw new Error('Inesperado "' + tokens[pos].valor + '"');
    if (Number.isNaN(resultado)) throw new Error('Resultado inválido');
    if (!Number.isFinite(resultado)) throw new Error('Resultado demasiado grande');
    return arredondar(resultado);
  }

  // Remove ruído de vírgula flutuante (0.1 + 0.2 -> 0.3)
  function arredondar(n) {
    return parseFloat(n.toPrecision(12));
  }

  const api = { avaliar, tokenizar, FUNCOES: Object.keys(FUNCOES), CONSTANTES: Object.keys(CONSTANTES) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Calc = api;
})(typeof window !== 'undefined' ? window : globalThis);
