# Lia

Assistente de voz que conversa todo dia com o idoso que mora sozinho, anota como ele está e avisa a família quando algo sai do normal.

Projeto do hackathon **UNMUTE by Agora** (NewHack e Agora), feito em 21 e 22 de novembro de 2026, na AI House Brasil, em São Paulo.

Versão entregue: **0.1.0** (em construção até 12h de 22/11).

## O problema

Cerca de 6 milhões de brasileiros com 60 anos ou mais moram sozinhos (PNAD Contínua 2025). O filho que mora longe não sabe se a mãe comeu, tomou o remédio ou caiu, e o idoso passa dias sem conversar com ninguém.

## Pra quem

A pessoa idosa que mora sozinha usa. O filho ou a filha que mora longe contrata e acompanha.

## O que a Lia faz

- **Conversa por voz, em português.** O idoso toca num botão, o rosto da Lia aparece e a conversa começa. Ela fala devagar, em frases curtas, e espera quando a pessoa faz uma pausa.
- **Diz que é uma assistente virtual.** Na primeira conversa ela se apresenta como um programa de computador e diz quem pediu a conversa. Nas outras, repete que é a assistente virtual.
- **Pergunta do dia.** Sono, comida, remédio, dor e como a pessoa está se sentindo, no meio da conversa.
- **Lembra.** O que a pessoa conta (o nome do neto, a consulta de quinta) volta nas conversas seguintes.
- **Avisa a família na hora.** Queda, dor no peito, remédio não tomado, dor forte e pedido de dinheiro ou senha por telefone viram aviso no painel.
- **Mostra o dia e a semana.** A família vê a ficha de hoje, a semana, os avisos e o resumo da conversa em `/familia`.

## Como a Agora entra

Toda a conversa passa pela Agora.

1. O navegador do idoso entra numa sala de áudio da Agora (SDK de RTC) e publica o microfone.
2. O servidor chama o **Conversational AI Engine** da Agora, que põe a assistente na mesma sala. A fala vira texto (Deepgram), o modelo responde (OpenAI) e a resposta vira voz (OpenAI TTS), com as chaves gerenciadas pela Agora.
3. A legenda e o estado da assistente (ouvindo, pensando, falando) chegam à tela pelo canal de mensagens da Agora (RTM), e o rosto mexe a boca pelo volume do áudio.
4. Quando o modelo decide agir, a Agora chama as ações da Lia no endereço `/api/mcp` deste servidor (protocolo MCP): `registrar_bem_estar`, `guardar_lembranca`, `avisar_familia` e `resumir_conversa`.
5. A detecção de fim de fala foi ajustada pra quem fala com pausas longas (900 ms de silêncio), e a pessoa pode interromper a Lia no meio da frase.

Além das ações decididas pelo modelo, cada fala do idoso passa por regras fixas do código (`lib/regras.ts`). Um aviso de queda ou de golpe sai mesmo se o modelo não chamar nenhuma ação.

## Como rodar

Precisa de Node 22 ou mais novo, pnpm e uma conta na Agora (console.agora.io).

```bash
pnpm install
cp env.local.example .env.local
```

Abra `.env.local` e preencha `NEXT_PUBLIC_AGORA_APP_ID` e `NEXT_AGORA_APP_CERTIFICATE` com os valores do seu projeto na Agora. Depois:

```bash
pnpm dev
```

- Tela do idoso: http://localhost:3000
- Painel da família: http://localhost:3000/familia

Só com isso a conversa por voz já funciona, e as regras fixas de segurança já avisam a família.

### Ligando as ações (ficha, lembranças, resumo)

A nuvem da Agora precisa alcançar o endereço `/api/mcp` deste servidor. Rodando no seu computador, abra um túnel e ponha o endereço em `LIA_URL_PUBLICA`:

```bash
ngrok http 3000
```

```bash
# em .env.local
LIA_URL_PUBLICA=https://seu-endereco.ngrok-free.dev
```

Reinicie o `pnpm dev`. Publicado na Vercel, o endereço é descoberto sozinho.

### Conferências

```bash
pnpm test
pnpm typecheck
pnpm lint
```

## Dependências

- Next.js 16, React 19, TypeScript, Tailwind CSS
- Da Agora: `agora-agents` (servidor), `agora-rtc-sdk-ng` e `agora-rtc-react` (áudio), `agora-rtm` (mensagens), `agora-agent-client-toolkit` (legenda e estado), `agora-token`
- Vitest pras conferências automáticas

A lista completa com as versões está em `package.json` e `pnpm-lock.yaml`.

## O que já existia e o que foi feito no hackathon

**Já existia:** o projeto de partida oficial da Agora, [`agent-quickstart-nextjs`](https://github.com/AgoraIO-Conversational-AI/agent-quickstart-nextjs) (licença MIT). É a primeira gravação deste repositório. Dele vieram a geração de token, a entrada na sala de áudio, a ligação com o canal de mensagens e a rota que encerra a assistente.

**Feito no hackathon** (tudo depois da primeira gravação):

- a personalidade e os limites da Lia em português, montados a cada conversa com a ficha do dia (`lib/persona.ts`);
- as quatro ações e o servidor MCP que a Agora chama (`lib/ferramentas.ts`, `app/api/mcp`);
- as regras fixas de segurança (`lib/regras.ts`, `app/api/conversa`);
- a ficha do idoso, as lembranças, os avisos e o resumo (`lib/dados.ts`);
- a tela do idoso com o rosto animado (`components/`, `hooks/`);
- o painel da família (`app/familia`, `components/familia`);
- as conferências automáticas (`testes/`);
- a base de conhecimento do time (`conhecimento/`).

O código foi escrito pelo time com ajuda do Claude Code.

## O que é simulação

- **A dona Helena é inventada.** O perfil, as lembranças e os seis dias anteriores do painel são dados de exemplo (`lib/exemplo.ts`). O painel marca esses dias, e um dia deixa de ser exemplo quando recebe uma conversa de verdade.
- **O rosto é um desenho**, sem avatar em vídeo.
- **A conversa acontece pelo navegador.** Ligação pelo telefone comum ainda não existe.

## Privacidade e limites

- A conversa inteira não é guardada. O servidor guarda a ficha do dia, as lembranças, os avisos e o resumo. A fala só fica registrada dentro de um aviso de segurança.
- Os dados ficam num arquivo local (`dados/`), fora do GitHub.
- A Lia não é médica, não dá diagnóstico e não muda remédio. Ela não substitui serviço de emergência: em urgência, orienta ligar pro 192 e avisa a família.
- A Lia nunca pede dinheiro, senha ou dado de banco.
- Esta versão não tem login. O painel da família precisa de login antes de ir pra gente de verdade.
- O remédio é registrado como a pessoa disse. Se ela disser que tomou e não tomou, a Lia não tem como saber.

## Próximos passos

- Testar com avós do time e medir quantos conversam até o fim e quantos voltam no dia seguinte.
- Ligação pelo telefone comum, pra quem não usa celular com internet.
- Aviso à família por WhatsApp, além do painel.
- Banco de dados na nuvem e login da família.
- Avatar em vídeo pela Agora.

## Licença

MIT. O projeto de partida é da Agora, também em MIT (arquivo `LICENSE`).
