const test = require('node:test');
const assert = require('node:assert');
const { avaliar } = require('../calc.js');

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

test('erros', () => {
  assert.throws(() => avaliar('1/0'), /Divisão por zero/);
  assert.throws(() => avaliar(''), /vazia/);
  assert.throws(() => avaliar('2+'), /incompleta/);
  assert.throws(() => avaliar('1..2'), /inválido/);
  assert.throws(() => avaliar('(2+3'), /Esperado/);
  assert.throws(() => avaliar('alert(1)'), /inválido/);
});
