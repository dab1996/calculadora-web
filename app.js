(function () {
  'use strict';

  const elExpr = document.getElementById('expressao');
  const elRes = document.getElementById('resultado');
  const elModo = document.getElementById('modo-angulo');
  const elLista = document.getElementById('lista-historico');
  const elVazio = document.getElementById('historico-vazio');
  const btnLimparHist = document.getElementById('limpar-historico');

  const BINARIOS = '+-*/^';
  const CHAVE_HIST = 'calculadora.historico';
  const CHAVE_MODO = 'calculadora.angulo';
  const MAX_HIST = 50;

  let expressao = '';
  let acabouDeCalcular = false;
  let historico = carregar(CHAVE_HIST, []);
  let angulo = carregar(CHAVE_MODO, 'deg') === 'rad' ? 'rad' : 'deg';
  let ans = historico.length ? historico[0].res : 0;

  // ---------- Formatação ----------

  const NOMES = {
    pi: 'π', ans: 'Ans', sqrt: '√', cbrt: '∛', ln: 'ln', log: 'log', exp: 'exp', abs: 'abs',
    asin: 'sin⁻¹', acos: 'cos⁻¹', atan: 'tan⁻¹',
  };
  const SIMBOLOS = { '*': '×', '/': '÷', '-': '−', '.': ',' };

  function formatarExpr(s) {
    return s
      .replace(/[a-z]+/g, (m) => NOMES[m] || m)
      .replace(/[*/\-.]/g, (c) => SIMBOLOS[c]);
  }

  function formatarNum(n) {
    const a = Math.abs(n);
    if (a !== 0 && (a >= 1e15 || a < 1e-9)) {
      // Notação científica: 1,23456789 × 10^-12
      const [m, e] = n.toExponential(9).split('e');
      const mant = parseFloat(m).toString().replace('.', ',');
      return mant + ' × 10^' + Number(e);
    }
    return n.toLocaleString('pt-PT', { maximumFractionDigits: 10 });
  }

  // ---------- Persistência ----------

  function carregar(chave, padrao) {
    try {
      const v = JSON.parse(localStorage.getItem(chave));
      return v ?? padrao;
    } catch {
      return padrao;
    }
  }

  function guardar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* ignorado */ }
  }

  // ---------- Edição da expressão ----------

  const ultimo = () => expressao.slice(-1);
  // A expressão termina num operando completo (número, constante, ')' ou postfix)?
  const terminaOperando = () => /([0-9.)%!]|pi|e|ans)$/.test(expressao) && !/[a-z]+\($/.test(expressao);
  const terminaNumero = () => /[0-9.]$/.test(expressao) && !/(pi|e|ans)$/.test(expressao);
  const parentesesAbertos = () =>
    (expressao.match(/\(/g) || []).length - (expressao.match(/\)/g) || []).length;

  // v pode ser: dígito, '.', operador binário, '%', '!', '(', ')',
  // uma função terminada em '(' (ex.: 'sin(') ou uma constante ('pi', 'e', 'ans').
  function inserir(v) {
    // Depois de "=", um operando começa nova conta; um operador continua sobre o resultado.
    if (acabouDeCalcular) {
      if (!BINARIOS.includes(v) && v !== '%' && v !== '!') expressao = '';
      acabouDeCalcular = false;
    }

    const ehDigito = /^[0-9]$/.test(v);
    const ehFuncao = /^[a-z]+\($/.test(v);
    const ehConstante = /^(pi|e|ans)$/.test(v);

    if (BINARIOS.includes(v)) {
      const u = ultimo();
      if (expressao === '' || u === '(') {
        if (v !== '-') return; // só o sinal negativo pode abrir uma expressão
      } else if (BINARIOS.includes(u)) {
        // Permite "×−" / "÷−" / "^−" (número negativo); caso contrário substitui o operador.
        if (v === '-' && '*/^'.includes(u)) { expressao += v; render(); return; }
        expressao = expressao.replace(/[+\-*/^]+$/, '');
        if (expressao === '' || ultimo() === '(') { if (v !== '-') { render(); return; } }
      }
      expressao += v;
      render();
      return;
    }

    if (v === '.') {
      const numeroAtual = (/[0-9.]*$/.exec(expressao) || [''])[0];
      if (numeroAtual.includes('.')) return;
      if (numeroAtual === '') v = terminaOperando() ? '*0.' : '0.';
      expressao += v;
      render();
      return;
    }

    if (v === '%' || v === '!') {
      if (!terminaOperando()) return;
      expressao += v;
      render();
      return;
    }

    if (v === ')') {
      if (parentesesAbertos() <= 0 || !terminaOperando()) return;
      expressao += v;
      render();
      return;
    }

    // Operandos: dígito, '(', função, constante.
    if (ehDigito && terminaNumero()) {
      expressao += v;
    } else if (ehDigito || v === '(' || ehFuncao || ehConstante) {
      // Multiplicação implícita visível: 2π -> 2×π, )( -> )×(
      expressao += (terminaOperando() ? '*' : '') + v;
    } else {
      return;
    }
    render();
  }

  function apagar() {
    if (acabouDeCalcular) { limpar(); return; }
    // Remove um "bloco" inteiro: 'sin(', 'pi', 'ans' ou um único carácter.
    expressao = expressao.replace(/([a-z]+\(?|.)$/, '');
    render();
  }

  function limpar() {
    expressao = '';
    acabouDeCalcular = false;
    render();
  }

  // Fecha parênteses em falta para pré-visualização/cálculo.
  const completar = (s) => s + ')'.repeat(Math.max(0, parentesesAbertos()));

  const avaliar = (s) => Calc.avaliar(s, { angulo, ans });

  // Resultado reutilizado como início da próxima conta; negativos entre parênteses
  // para que "(-5)^2" dê 25 e não -25.
  const comoOperando = (n) => (n < 0 ? '(' + n + ')' : String(n));

  function calcular() {
    if (!expressao) return;
    const completa = completar(expressao);
    try {
      const r = avaliar(completa);
      adicionarHistorico(completa, r);
      ans = r;
      expressao = comoOperando(r);
      acabouDeCalcular = true;
      elExpr.textContent = formatarExpr(completa) + ' =';
      mostrarResultado(formatarNum(r), '');
      elRes.classList.add('pulse');
      setTimeout(() => elRes.classList.remove('pulse'), 150);
    } catch (e) {
      mostrarResultado(e.message, 'erro');
    }
  }

  function alternarAngulo() {
    angulo = angulo === 'deg' ? 'rad' : 'deg';
    guardar(CHAVE_MODO, angulo);
    if (acabouDeCalcular) { renderModo(); return; }
    render();
  }

  // ---------- Renderização ----------

  function mostrarResultado(texto, classe) {
    elRes.textContent = texto;
    elRes.className = 'resultado' + (classe ? ' ' + classe : '');
  }

  function renderModo() {
    elModo.textContent = angulo === 'deg' ? 'DEG' : 'RAD';
    elModo.title = angulo === 'deg' ? 'Ângulos em graus (clica para radianos)' : 'Ângulos em radianos (clica para graus)';
  }

  function render() {
    renderModo();
    elExpr.textContent = formatarExpr(expressao);
    if (!expressao) { mostrarResultado('0', ''); return; }

    // Pré-visualização dinâmica do resultado enquanto se escreve.
    try {
      mostrarResultado(formatarNum(avaliar(completar(expressao))), 'preview');
    } catch {
      mostrarResultado(formatarExpr(expressao), 'preview');
    }
  }

  function adicionarHistorico(expr, res) {
    historico.unshift({ expr, res });
    historico = historico.slice(0, MAX_HIST);
    guardar(CHAVE_HIST, historico);
    renderHistorico();
  }

  function renderHistorico() {
    elLista.innerHTML = '';
    for (const item of historico) {
      const li = document.createElement('li');
      li.title = 'Reutilizar resultado';
      const e = document.createElement('div');
      e.className = 'h-expr';
      e.textContent = formatarExpr(item.expr) + ' =';
      const r = document.createElement('div');
      r.className = 'h-res';
      r.textContent = formatarNum(item.res);
      li.append(e, r);
      li.addEventListener('click', () => {
        expressao = comoOperando(item.res);
        acabouDeCalcular = true;
        render();
      });
      elLista.appendChild(li);
    }
    elVazio.hidden = historico.length > 0;
  }

  // ---------- Eventos ----------

  document.querySelector('.calc').addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const { valor, acao } = btn.dataset;
    if (valor !== undefined) inserir(valor);
    else if (acao === 'limpar') limpar();
    else if (acao === 'apagar') apagar();
    else if (acao === 'igual') calcular();
    else if (acao === 'angulo') alternarAngulo();
    else if (acao === 'quadrado') { if (terminaOperando()) { inserir('^'); inserir('2'); } }
    else if (acao === 'inverso') { if (terminaOperando()) { inserir('^'); inserir('('); inserir('-'); inserir('1'); inserir(')'); } }
    else if (acao === 'dez') { inserir('1'); inserir('0'); inserir('^'); }
  });

  // Teclado
  const mapaTeclas = { ',': '.', 'x': '*', 'X': '*', 'p': 'pi' };
  document.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = mapaTeclas[ev.key] || ev.key;
    let seletor = null;

    if (/^[0-9+\-*/%^!().]$/.test(k) || k === 'pi') { inserir(k); seletor = `[data-valor="${CSS.escape(k)}"]`; }
    else if (k === 'Enter' || k === '=') { calcular(); seletor = '[data-acao="igual"]'; }
    else if (k === 'Backspace') { apagar(); seletor = '[data-acao="apagar"]'; }
    else if (k === 'Escape' || k === 'Delete') { limpar(); seletor = '[data-acao="limpar"]'; }
    else return;

    ev.preventDefault();
    const btn = seletor && document.querySelector('.calc ' + seletor);
    if (btn) {
      btn.classList.add('ativo');
      setTimeout(() => btn.classList.remove('ativo'), 100);
    }
  });

  btnLimparHist.addEventListener('click', () => {
    historico = [];
    guardar(CHAVE_HIST, historico);
    renderHistorico();
  });

  render();
  renderHistorico();
})();
