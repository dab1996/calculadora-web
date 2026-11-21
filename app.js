(function () {
  'use strict';

  const elExpr = document.getElementById('expressao');
  const elRes = document.getElementById('resultado');
  const elLista = document.getElementById('lista-historico');
  const elVazio = document.getElementById('historico-vazio');
  const btnLimparHist = document.getElementById('limpar-historico');

  const OPERADORES = '+-*/';
  const CHAVE_HIST = 'calculadora.historico';
  const MAX_HIST = 50;

  let expressao = '';
  let acabouDeCalcular = false;
  let historico = carregarHistorico();

  const simbolos = { '*': '×', '/': '÷', '-': '−', '.': ',' };
  const formatarExpr = (s) => s.replace(/[*/\-.]/g, (c) => simbolos[c]);
  const formatarNum = (n) =>
    n.toLocaleString('pt-PT', { maximumFractionDigits: 10 });

  function carregarHistorico() {
    try {
      const dados = JSON.parse(localStorage.getItem(CHAVE_HIST));
      return Array.isArray(dados) ? dados : [];
    } catch {
      return [];
    }
  }

  function guardarHistorico() {
    try { localStorage.setItem(CHAVE_HIST, JSON.stringify(historico)); } catch { /* ignorado */ }
  }

  function inserir(v) {
    const ultimo = expressao.slice(-1);

    // Depois de "=", um número começa nova conta; um operador continua sobre o resultado.
    if (acabouDeCalcular) {
      if (/[0-9.(]/.test(v)) expressao = '';
      acabouDeCalcular = false;
    }

    if (OPERADORES.includes(v)) {
      if (expressao === '' && v !== '-') return;
      if (expressao === '-' ) return;
      if (OPERADORES.includes(ultimo)) {
        // Permite "×−" (número negativo); caso contrário substitui o operador.
        if (v === '-' && (ultimo === '*' || ultimo === '/')) { expressao += v; render(); return; }
        expressao = expressao.replace(/[+\-*/]+$/, '') + v;
        render();
        return;
      }
      if (ultimo === '(' && v !== '-') return;
    }

    if (v === '.') {
      const numeroAtual = expressao.split(/[+\-*/()%]/).pop();
      if (numeroAtual.includes('.')) return;
      if (numeroAtual === '') v = '0.';
    }

    if (v === '%' && !/[0-9)%]/.test(ultimo)) return;

    if (v === ')') {
      const abertos = (expressao.match(/\(/g) || []).length;
      const fechados = (expressao.match(/\)/g) || []).length;
      if (abertos <= fechados || !/[0-9)%]/.test(ultimo)) return;
    }

    // Multiplicação implícita: "2(" -> "2*(" e ")3" -> ")*3"
    if (v === '(' && /[0-9)%]/.test(ultimo)) v = '*(';
    if (/[0-9]/.test(v) && /[)%]/.test(ultimo)) v = '*' + v;

    expressao += v;
    render();
  }

  function apagar() {
    if (acabouDeCalcular) { limpar(); return; }
    expressao = expressao.slice(0, -1);
    render();
  }

  function limpar() {
    expressao = '';
    acabouDeCalcular = false;
    render();
  }

  // Fecha parênteses em falta para pré-visualização/cálculo.
  function completar(s) {
    const falta = (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length;
    return s + ')'.repeat(Math.max(0, falta));
  }

  function calcular() {
    if (!expressao) return;
    const completa = completar(expressao);
    try {
      const r = Calc.avaliar(completa);
      adicionarHistorico(completa, r);
      expressao = String(r);
      acabouDeCalcular = true;
      elExpr.textContent = formatarExpr(completa) + ' =';
      mostrarResultado(formatarNum(r), '');
      elRes.classList.add('pulse');
      setTimeout(() => elRes.classList.remove('pulse'), 150);
    } catch (e) {
      mostrarResultado(e.message, 'erro');
    }
  }

  function mostrarResultado(texto, classe) {
    elRes.textContent = texto;
    elRes.className = 'resultado' + (classe ? ' ' + classe : '');
  }

  function render() {
    elExpr.textContent = formatarExpr(expressao);
    if (!expressao) { mostrarResultado('0', ''); return; }

    // Pré-visualização dinâmica do resultado enquanto se escreve.
    try {
      const r = Calc.avaliar(completar(expressao));
      mostrarResultado(formatarNum(r), 'preview');
    } catch {
      mostrarResultado(formatarExpr(expressao), 'preview');
    }
  }

  function adicionarHistorico(expr, res) {
    historico.unshift({ expr, res });
    historico = historico.slice(0, MAX_HIST);
    guardarHistorico();
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
        expressao = String(item.res);
        acabouDeCalcular = true;
        render();
      });
      elLista.appendChild(li);
    }
    elVazio.hidden = historico.length > 0;
  }

  // Cliques nos botões
  document.querySelector('.teclas').addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const { valor, acao } = btn.dataset;
    if (valor !== undefined) inserir(valor);
    else if (acao === 'limpar') limpar();
    else if (acao === 'apagar') apagar();
    else if (acao === 'igual') calcular();
  });

  // Teclado
  const mapaTeclas = { ',': '.', 'x': '*', 'X': '*' };
  document.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    let k = mapaTeclas[ev.key] || ev.key;
    let seletor = null;

    if (/^[0-9+\-*/%().]$/.test(k)) { inserir(k); seletor = `[data-valor="${CSS.escape(k)}"]`; }
    else if (k === 'Enter' || k === '=') { calcular(); seletor = '[data-acao="igual"]'; }
    else if (k === 'Backspace') { apagar(); seletor = '[data-acao="apagar"]'; }
    else if (k === 'Escape' || k === 'Delete') { limpar(); seletor = '[data-acao="limpar"]'; }
    else return;

    ev.preventDefault();
    const btn = seletor && document.querySelector('.teclas ' + seletor);
    if (btn) {
      btn.classList.add('ativo');
      setTimeout(() => btn.classList.remove('ativo'), 100);
    }
  });

  btnLimparHist.addEventListener('click', () => {
    historico = [];
    guardarHistorico();
    renderHistorico();
  });

  render();
  renderHistorico();
})();
