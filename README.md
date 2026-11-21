# Calculadora Web

Calculadora científica com frontend dinâmico em HTML, CSS e JavaScript puro, sem dependências.

## Funcionalidades

- Soma, subtração, multiplicação, divisão, percentagem e parênteses
- Funções científicas: `sin`, `cos`, `tan` e inversas, `ln`, `log`, `√`, `∛`, `eˣ`, `10ˣ`, `|x|`, `x²`, `xʸ`, `x⁻¹`, `n!`
- Constantes `π` e `e`, e `Ans` (último resultado)
- Modo de ângulo DEG/RAD (fica guardado)
- Multiplicação implícita (`2π`, `3(4+1)`)
- Erros claros: divisão por zero, fora do domínio (`√(-1)`, `tan(90°)`), resultado demasiado grande
- Pré-visualização do resultado enquanto escreves
- Suporte a teclado (`0-9`, `+ - * /`, `^`, `!`, `%`, `( )`, `,`/`.`, `p` para π, `Enter`, `Backspace`, `Esc`)
- Histórico guardado no browser (clica num item para reutilizar o resultado)
- Tema claro/escuro automático e layout responsivo
- Avaliador de expressões próprio (sem `eval`)

## Usar

Abre `index.html` no browser, ou serve a pasta localmente:

```bash
npm start
```

## Testes

Requer Node.js 18+.

```bash
npm test
```

## Estrutura

| Ficheiro | Função |
|---|---|
| `index.html` | Estrutura da página |
| `style.css` | Estilos e temas |
| `calc.js` | Parser e avaliador de expressões |
| `app.js` | Interação (botões, teclado, histórico) |
| `test/` | Testes unitários do avaliador |
