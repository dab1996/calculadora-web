# Calculadora Web

Calculadora simples com frontend dinâmico em HTML, CSS e JavaScript puro, sem dependências.

## Funcionalidades

- Soma, subtração, multiplicação, divisão, percentagem e parênteses
- Pré-visualização do resultado enquanto escreves
- Suporte a teclado (`0-9`, `+ - * /`, `%`, `( )`, `,`/`.`, `Enter`, `Backspace`, `Esc`)
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
