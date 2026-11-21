# CLAUDE.md

Este é o projeto da Dona Leda, feito no hackathon UNMUTE by Agora (21 e 22/11/2026). A Dona Leda é a camada de cuidado de quem envelhece: uma assistente virtual que traz companhia e apoia com necessidades do dia a dia, como segurança, saúde, comunicação e rotina. Hoje ela liga todo dia, por chamada de vídeo, pro idoso que mora sozinho, anota como ele está e avisa a família quando algo sai do normal. O produto gira em torno de a assistente começar a ligação: o idoso só atende. O nome provisório era Lia, e ele ainda aparece em pastas, variáveis e trechos do código.

Antes de começar qualquer tarefa, leia a base de conhecimento do time, na pasta `conhecimento/`. Ela diz o que estamos construindo, pra quem, com quem e até quando.

## Base de conhecimento

| Arquivo | O que tem | Quando ler |
|---|---|---|
| [conhecimento/tese.md](conhecimento/tese.md) | O problema, o público, a solução, os números e quem já faz parecido | Sempre, antes de decidir qualquer coisa de produto |
| [conhecimento/time.md](conhecimento/time.md) | No que cada pessoa do time é boa e quem cuida de quê | Ao dividir trabalho ou pedir ajuda |
| [conhecimento/recursos.md](conhecimento/recursos.md) | O que temos na mão: contas, ferramentas, contatos, exemplos da Agora | Antes de propor algo que dependa de recurso novo |
| [conhecimento/hackathon.md](conhecimento/hackathon.md) | Regras, entregas, prazo e como a banca dá nota | Ao priorizar: o que não conta ponto fica pra depois |
| [conhecimento/decisoes.md](conhecimento/decisoes.md) | O que o time já decidiu, com data | Antes de reabrir um assunto |
| [conhecimento/infraestrutura.md](conhecimento/infraestrutura.md) | O que está de pé, o que falta pra virar aplicativo e a ordem | Antes de mexer em servidor, banco, login ou app |
| [conhecimento/proposta-de-valor.md](conhecimento/proposta-de-valor.md) | A narrativa aprovada (o sonho, o que a Dona Leda é, o dinheiro e a assinatura), a camada de cuidado por dentro, quem usa, quem compra e por onde vende, as premissas, os formatos e as frases já reprovadas | Antes de escrever pitch, slide, tela ou texto de venda |
| [conhecimento/concorrentes.md](conhecimento/concorrentes.md) | Quem faz parecido no mundo e no Brasil, como cada um se vende, quem paga e o que a ciência diz | Ao comparar com outro produto ou responder a banca |
| [conhecimento/ideias.md](conhecimento/ideias.md) | Ideias e conselhos de mentores que ainda não viraram decisão | Ao pensar no que vem depois ou montar o pitch |
| [conhecimento/teste-de-voz.md](conhecimento/teste-de-voz.md) | O roteiro de teste da conversa por voz e as falhas achadas | Antes de mexer na voz, na escuta ou no tempo de resposta |
| [conhecimento/validacao.md](conhecimento/validacao.md) | O kit das ligações com idosos de verdade e os resultados sem nome | Ao montar a validação ou o pitch |
| [conhecimento/segundo-cerebro.md](conhecimento/segundo-cerebro.md) | O desenho do que a Dona Leda aprende da vida do idoso, como a conversa lê e grava, o que a família vê e o que o idoso controla por voz (aguardando aprovação do Breno) | Antes de mexer nas lembranças, na instrução da conversa ou no painel da família |
| [conhecimento/verificacao.md](conhecimento/verificacao.md) | A Dona Leda conferida contra o regulamento: regras que eliminam, nota provável por critério, as ações que mais sobem a nota e a análise do Gemini Live | Ao priorizar o que falta até a entrega |

Quando uma decisão for tomada ou um fato novo aparecer, atualize o arquivo da base no mesmo envio do código. Escreva o que vale hoje, com a data.

## Regras que não mudam

1. **A Dona Leda diz que é assistente virtual.** Ela nunca finge ser gente, parente, médica ou banco. A saudação e as instruções em `lib/persona.ts` garantem isso, e `testes/dados.test.ts` confere.
2. **Segurança não depende só da IA.** Queda, dor no peito, vontade de morrer e pedido de dinheiro ou senha disparam aviso por regra fixa em `lib/regras.ts`. Regra nova entra com um caso em `testes/regras.test.ts`.
3. **A conversa inteira não é guardada.** O servidor guarda a ficha do dia, as lembranças, os avisos e o resumo. A fala só fica registrada dentro de um aviso de segurança.
4. **A Dona Leda não é médica.** Ela não dá diagnóstico e não muda remédio. Em emergência, manda ligar pro 192 e avisa a família.
5. **O repositório é público.** Nada de chave, senha, dado de pessoa real ou gravação de conversa aqui dentro. As chaves ficam em `.env.local` e os dados em `dados/`, os dois fora do GitHub.
6. **Texto de tela em português simples.** A tela do idoso tem letra grande, um botão por vez e nenhuma palavra técnica.

## Onde fica cada coisa

- `app/page.tsx`, `components/` e `hooks/`: o aparelho do idoso, que espera a ligação, toca, atende e mostra a chamada de vídeo.
- `app/api/chamada/route.ts`, `lib/chamadas.ts` e `lib/relogio.ts`: as ligações que a assistente faz (hora marcada, pedido da família, segunda tentativa e aviso de não atendida).
- `app/familia/` e `components/familia/`: o painel da família.
- `app/api/invite-agent/route.ts`: começa a conversa na Agora (escuta, modelo, voz e ações).
- `app/api/mcp/route.ts` e `lib/ferramentas.ts`: as ações que a Dona Leda faz durante a conversa (anotar, lembrar, avisar, resumir).
- `app/api/conversa/route.ts` e `lib/regras.ts`: as regras fixas de segurança em cima de cada fala.
- `app/api/familia/route.ts` e `lib/dados.ts`: a ficha e o que o painel mostra.
- `lib/persona.ts`: o jeito de a Dona Leda falar e o que ela sabe antes de cada conversa.
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
