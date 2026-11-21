const test = require('node:test');
const assert = require('node:assert');
const { avaliar } = require('../calc.js');

const deg = { angulo: 'deg' };
const rad = { angulo: 'rad' };

test('operações básicas', () => {
  assert.strictEqual(avaliar('2+3'), 5);
  assert.strictEqual(avaliar('10-4'), 6);
  assert.strictEqual(avaliar('6*7'), 42);
  assert.strictEqual(avaliar('9/3'), 3);
});

test('precedência e parênteses', () => {
  assert.strictEqual(avaliar('2+3*4'), 14);
  assert.strictEqual(avaliar('(2+3)*4'), 20);
  assert.strictEqual(avaliar('2*(3+(4-1))'), 12);
});

test('sinais unários e percentagem', () => {
  assert.strictEqual(avaliar('-5+2'), -3);
  assert.strictEqual(avaliar('3*-2'), -6);
  assert.strictEqual(avaliar('50%'), 0.5);
  assert.strictEqual(avaliar('200*10%'), 20);
});

test('vírgula flutuante', () => {
  assert.strictEqual(avaliar('0.1+0.2'), 0.3);
});

test('potências', () => {
  assert.strictEqual(avaliar('2^10'), 1024);
  assert.strictEqual(avaliar('2^3^2'), 512); // associativa à direita
  assert.strictEqual(avaliar('-2^2'), -4);
  assert.strictEqual(avaliar('(-2)^2'), 4);
  assert.strictEqual(avaliar('2^-1'), 0.5);
  assert.strictEqual(avaliar('4^(-1)'), 0.25);
  assert.strictEqual(avaliar('10^3'), 1000);
});

test('trigonometria em graus', () => {
  assert.strictEqual(avaliar('sin(30)', deg), 0.5);
  assert.strictEqual(avaliar('cos(60)', deg), 0.5);
  assert.strictEqual(avaliar('tan(45)', deg), 1);
  assert.strictEqual(avaliar('sin(180)', deg), 0);
  assert.strictEqual(avaliar('asin(1)', deg), 90);
  assert.strictEqual(avaliar('atan(1)', deg), 45);
  assert.throws(() => avaliar('tan(90)', deg), /domínio/);
  assert.throws(() => avaliar('tan(-270)', deg), /domínio/);
});

test('trigonometria em radianos', () => {
  assert.strictEqual(avaliar('sin(pi/2)', rad), 1);
  assert.strictEqual(avaliar('cos(pi)', rad), -1);
  assert.strictEqual(avaliar('sin(pi)', rad), 0);
  assert.strictEqual(avaliar('acos(-1)', rad), avaliar('pi'));
});

test('logaritmos, raízes e exponencial', () => {
  assert.strictEqual(avaliar('ln(e)'), 1);
  assert.strictEqual(avaliar('log(1000)'), 3);
  assert.strictEqual(avaliar('sqrt(16)'), 4);
  assert.strictEqual(avaliar('cbrt(-27)'), -3);
  assert.strictEqual(avaliar('exp(0)'), 1);
  assert.strictEqual(avaliar('abs(-7)'), 7);
});

test('fatorial', () => {
  assert.strictEqual(avaliar('5!'), 120);
  assert.strictEqual(avaliar('0!'), 1);
  assert.strictEqual(avaliar('3!+1'), 7);
  assert.strictEqual(avaliar('(2+1)!'), 6);
  assert.throws(() => avaliar('2.5!'), /inteiros/);
  assert.throws(() => avaliar('(-1)!'), /inteiros/);
  assert.throws(() => avaliar('171!'), /grande/);
});

test('constantes, Ans e multiplicação implícita', () => {
  assert.strictEqual(avaliar('2pi'), avaliar('2*pi'));
  assert.strictEqual(avaliar('2(3+1)'), 8);
  assert.strictEqual(avaliar('(1+1)(2+2)'), 8);
  assert.strictEqual(avaliar('2sqrt(9)'), 6);
  assert.strictEqual(avaliar('ans*2', { ans: 21 }), 42);
  assert.strictEqual(avaliar('2e'), avaliar('2*e'));
});

test('notação científica nos números', () => {
  assert.strictEqual(avaliar('1e3+1'), 1001);
  assert.strictEqual(avaliar('1.5e-3*1000'), 1.5);
});

test('erros', () => {
  assert.throws(() => avaliar('1/0'), /Divisão por zero/);
  assert.throws(() => avaliar('0^-1'), /Divisão por zero/);
  assert.throws(() => avaliar(''), /vazia/);
  assert.throws(() => avaliar('2+'), /incompleta/);
  assert.throws(() => avaliar('1..2'), /inválido/);
  assert.throws(() => avaliar('1.2.3'), /inválido/);
  assert.throws(() => avaliar('(2+3'), /Esperado/);
  assert.throws(() => avaliar('sin 30'), /Esperado/);
  assert.throws(() => avaliar('sqrt(-1)'), /domínio/);
  assert.throws(() => avaliar('ln(0)'), /domínio/);
  assert.throws(() => avaliar('asin(2)'), /domínio/);
  assert.throws(() => avaliar('(-8)^(1/3)'), /domínio/);
  assert.throws(() => avaliar('10^400'), /grande/);
  assert.throws(() => avaliar('alert(1)'), /Desconhecido/);
  assert.throws(() => avaliar('constructor'), /Desconhecido/);
  assert.throws(() => avaliar('2;3'), /inválido/);
});
