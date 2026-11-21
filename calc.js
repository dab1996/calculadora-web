// Avaliador de expressões sem eval(): tokenização + descida recursiva.
// Gramática:
//   expr   := termo (('+' | '-') termo)*
//   termo  := fator (('*' | '/') fator)*
//   fator  := ('+' | '-') fator | postfix
//   postfix:= primario '%'*
//   primario := numero | '(' expr ')'
(function (global) {
  'use strict';

  function tokenizar(texto) {
    const tokens = [];
    let i = 0;
    while (i < texto.length) {
      const c = texto[i];
      if (c === ' ') { i++; continue; }
      if (/[0-9.]/.test(c)) {
        let num = '';
        while (i < texto.length && /[0-9.]/.test(texto[i])) num += texto[i++];
        if ((num.match(/\./g) || []).length > 1 || num === '.') {
          throw new Error('Número inválido');
        }
        tokens.push({ tipo: 'num', valor: parseFloat(num) });
        continue;
      }
      if ('+-*/%()'.includes(c)) {
        tokens.push({ tipo: 'op', valor: c });
        i++;
        continue;
      }
      throw new Error('Carácter inválido: ' + c);
    }
    return tokens;
  }

  function avaliar(texto) {
    const tokens = tokenizar(texto);
    if (tokens.length === 0) throw new Error('Expressão vazia');
    let pos = 0;

    const espiar = () => tokens[pos];
    const consumir = (v) => {
      const t = tokens[pos];
      if (!t || t.valor !== v) throw new Error('Esperado "' + v + '"');
      pos++;
    };

    function expr() {
      let v = termo();
      while (espiar() && (espiar().valor === '+' || espiar().valor === '-')) {
        const op = tokens[pos++].valor;
        const d = termo();
        v = op === '+' ? v + d : v - d;
      }
      return v;
    }

    function termo() {
      let v = fator();
      while (espiar() && (espiar().valor === '*' || espiar().valor === '/')) {
        const op = tokens[pos++].valor;
        const d = fator();
        if (op === '/' && d === 0) throw new Error('Divisão por zero');
        v = op === '*' ? v * d : v / d;
      }
      return v;
    }

    function fator() {
      const t = espiar();
      if (t && (t.valor === '+' || t.valor === '-')) {
        pos++;
        const v = fator();
        return t.valor === '-' ? -v : v;
      }
      return postfix();
    }

    function postfix() {
      let v = primario();
      while (espiar() && espiar().valor === '%') { pos++; v = v / 100; }
      return v;
    }

    function primario() {
      const t = espiar();
      if (!t) throw new Error('Expressão incompleta');
      if (t.tipo === 'num') { pos++; return t.valor; }
      if (t.valor === '(') {
        pos++;
        const v = expr();
        consumir(')');
        return v;
      }
      throw new Error('Inesperado "' + t.valor + '"');
    }

    const resultado = expr();
    if (pos < tokens.length) throw new Error('Inesperado "' + tokens[pos].valor + '"');
    if (!Number.isFinite(resultado)) throw new Error('Resultado inválido');
    return arredondar(resultado);
  }

  // Remove ruído de vírgula flutuante (0.1 + 0.2 -> 0.3)
  function arredondar(n) {
    return parseFloat(n.toPrecision(12));
  }

  const api = { avaliar, tokenizar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Calc = api;
})(typeof window !== 'undefined' ? window : globalThis);
