# CLAUDE.md

Este é o projeto da Lia, feito no hackathon UNMUTE by Agora (21 e 22/11/2026). A Lia é uma assistente de voz que conversa todo dia com o idoso que mora sozinho, anota como ele está e avisa a família quando algo sai do normal.

Antes de começar qualquer tarefa, leia a base de conhecimento do time, na pasta `conhecimento/`. Ela diz o que estamos construindo, pra quem, com quem e até quando.

## Base de conhecimento

| Arquivo | O que tem | Quando ler |
|---|---|---|
| [conhecimento/tese.md](conhecimento/tese.md) | O problema, o público, a solução, os números e quem já faz parecido | Sempre, antes de decidir qualquer coisa de produto |
| [conhecimento/time.md](conhecimento/time.md) | No que cada pessoa do time é boa e quem cuida de quê | Ao dividir trabalho ou pedir ajuda |
| [conhecimento/recursos.md](conhecimento/recursos.md) | O que temos na mão: contas, ferramentas, contatos, exemplos da Agora | Antes de propor algo que dependa de recurso novo |
| [conhecimento/hackathon.md](conhecimento/hackathon.md) | Regras, entregas, prazo e como a banca dá nota | Ao priorizar: o que não conta ponto fica pra depois |
| [conhecimento/decisoes.md](conhecimento/decisoes.md) | O que o time já decidiu, com data | Antes de reabrir um assunto |

Quando uma decisão for tomada ou um fato novo aparecer, atualize o arquivo da base no mesmo envio do código. Escreva o que vale hoje, com a data.

## Regras que não mudam

1. **A Lia diz que é assistente virtual.** Ela nunca finge ser gente, parente, médica ou banco. A saudação e as instruções em `lib/persona.ts` garantem isso, e `testes/dados.test.ts` confere.
2. **Segurança não depende só da IA.** Queda, dor no peito, vontade de morrer e pedido de dinheiro ou senha disparam aviso por regra fixa em `lib/regras.ts`. Regra nova entra com um caso em `testes/regras.test.ts`.
3. **A conversa inteira não é guardada.** O servidor guarda a ficha do dia, as lembranças, os avisos e o resumo. A fala só fica registrada dentro de um aviso de segurança.
4. **A Lia não é médica.** Ela não dá diagnóstico e não muda remédio. Em emergência, manda ligar pro 192 e avisa a família.
5. **O repositório é público.** Nada de chave, senha, dado de pessoa real ou gravação de conversa aqui dentro. As chaves ficam em `.env.local` e os dados em `dados/`, os dois fora do GitHub.
6. **Texto de tela em português simples.** A tela do idoso tem letra grande, um botão por vez e nenhuma palavra técnica.

## Onde fica cada coisa

- `app/page.tsx` e `components/TelaDoIdoso.tsx`, `Conversa.tsx`, `Rosto.tsx`: a tela do idoso.
- `app/familia/` e `components/familia/`: o painel da família.
- `app/api/invite-agent/route.ts`: começa a conversa na Agora (escuta, modelo, voz e ações).
- `app/api/mcp/route.ts` e `lib/ferramentas.ts`: as ações que a Lia faz durante a conversa (anotar, lembrar, avisar, resumir).
- `app/api/conversa/route.ts` e `lib/regras.ts`: as regras fixas de segurança em cima de cada fala.
- `app/api/familia/route.ts` e `lib/dados.ts`: a ficha e o que o painel mostra.
- `lib/persona.ts`: o jeito de a Lia falar e o que ela sabe antes de cada conversa.
- `lib/tipos.ts`: o formato dos dados. Quem muda a ficha ou o painel começa por aqui.
- `lib/exemplo.ts`: a pessoa inventada da demonstração.

## Comandos

```bash
pnpm install        # instala
pnpm dev            # sobe em http://localhost:3000 (idoso) e /familia (família)
pnpm test           # confere ficha, regras de segurança e ações
pnpm typecheck      # confere os tipos
pnpm lint           # confere o estilo do código
```

Antes de enviar código, rode `pnpm test` e `pnpm typecheck`.

## O que já existia e o que é nosso

A primeira gravação do repositório é o projeto de partida oficial da Agora (`agent-quickstart-nextjs`, licença MIT). Tudo depois dela foi feito no hackathon. O regulamento pede essa separação, então não reescreva o histórico.
