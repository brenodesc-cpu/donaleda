# Dona Leda

A Dona Leda é a assistente de cuidado de quem envelhece: companhia e apoio no dia a dia, com segurança, saúde, comunicação e rotina. No protótipo, ela liga no horário combinado, conversa, anota o que a pessoa contou e avisa a família quando a pessoa conta uma queda, um golpe, uma tristeza que dura ou remédio tomado a mais. Quem age é a família.

Projeto do hackathon **UNMUTE by Agora** (NewHack e Agora), feito em 21 e 22 de novembro de 2026, na AI House Brasil, em São Paulo.

- **No ar:** https://donaleda.vercel.app
- **Versão entregue:** 0.2.0 (a gravação marcada com a etiqueta `entrega` é a que vale pra banca).

## O problema

Ninguém deveria passar os últimos anos da vida parado e sozinho em casa. O nosso sonho é que todo brasileiro envelheça ativo até o fim.

Cerca de 6 milhões de brasileiros com 60 anos ou mais moram sozinhos (PNAD Contínua 2025). A filha que passa a semana sem ver a mãe não sabe se ela comeu, tomou o remédio ou caiu, e o idoso passa dias sem conversar com ninguém. O cuidado de todo dia hoje é feito por gente: a filha, de graça, o cuidador, de R$ 2.800 a 4.500 por mês, ou o residencial, de R$ 6 mil a 11 mil. A aposentadoria da maioria dos brasileiros não paga um cuidador: 62,5% de quem recebe do INSS ganha um salário mínimo (R$ 1.621), menos que o piso do cuidador com carteira (R$ 1.760,44 no Caged). A Dona Leda leva esse cuidado de todo dia por menos de um décimo do preço.

## Pra quem

A pessoa idosa lúcida que mora sozinha usa, e só precisa atender. A filha ou o filho que passa a semana sem ver o pai ou a mãe contrata e acompanha pelo painel. As casas de repouso parceiras indicam a Dona Leda às famílias que as procuram e acompanham os idosos que indicaram. Plano de saúde de idoso e prefeitura compram depois, quando houver resultado medido num piloto.

## O que a Dona Leda faz

- **Ela liga.** O aparelho do idoso toca na hora marcada, ou quando a família toca em "Ligar agora" no painel. O idoso atende com um toque, ou a ligação atende sozinha depois de 10 segundos, se a família ligar essa opção.
- **Ligação não atendida vira aviso.** Sem resposta, ela tenta de novo em 3 minutos e depois avisa a família.
- **Conversa em português do Brasil.** Fala devagar, em frases curtas, e espera 650 milissegundos de silêncio antes de responder, porque quem tem mais idade faz pausas no meio da frase. A pessoa pode interromper.
- **Diz que é uma assistente virtual.** Na primeira conversa ela se apresenta como assistente virtual e diz quem da família pediu as conversas.
- **Pergunta do dia.** Sono, comida, remédio, dor e como a pessoa está se sentindo, no meio da conversa.
- **Lembra.** O que a pessoa conta (o nome do neto, a consulta de quinta) volta nas conversas seguintes.
- **Avisa a família na hora.** Queda, dor no peito, vontade de morrer, remédio não tomado, dor forte e pedido de dinheiro ou senha por telefone viram aviso no painel.
- **Mostra o dia e a semana.** A família vê a ficha de hoje, a semana, os avisos e o resumo da conversa. No topo da semana aparece em quantos dos últimos 7 dias a pessoa saiu de casa e em quantos conversou com alguém.

## Os dois lados do app

- **A família** cria a conta com e-mail e senha, cadastra o idoso (ou vê com a dona Helena de exemplo), acompanha o painel e ajusta horários e remédios.
- **O aparelho do idoso** nunca faz login. A família gera um código de 6 números, ou manda pelo WhatsApp um link `/parear?codigo=`, e o aparelho fica ligado ao idoso.

| Endereço | O que é |
|---|---|
| `/` | Aparelho ligado: a tela do idoso. Sem ligação: a escolha entre família e idoso |
| `/parear` | O aparelho do idoso digita o código |
| `/entrar` | Entrar ou criar a conta da família |
| `/familia` | O painel |
| `/familia/novo` | Cadastrar o idoso |
| `/familia/aparelho` | Gerar o código ou mandar o link |
| `/familia/ajustes` | Horários, atender sozinho, remédios, apagar os dados |
| `/marca` | As quatro direções de marca, com a Gema aplicada |

## Como a Agora entra

Toda a conversa passa pela Agora.

1. O aparelho do idoso entra numa sala de áudio da Agora (SDK de RTC) e publica o microfone.
2. O servidor chama o **Conversational AI Engine** da Agora, que põe a assistente na mesma sala. São dois modos, escolhidos pela variável `LIA_MODO`:
   - **`gemini`:** o Gemini Live, dentro da Agora, escuta e fala num modelo só, com a voz Leda em português do Brasil. Precisa da chave do Google AI Studio em `LIA_GEMINI_KEY`.
   - **`tres`:** Deepgram escuta, OpenAI responde e a voz da OpenAI fala, com as chaves gerenciadas pela Agora. É a reserva, e o único modo que aceita avatar em vídeo.
   Sem `LIA_MODO`, vale o Gemini quando a chave existe. Abrir `/?modo=gemini` ou `/?modo=tres` no aparelho compara os dois na hora.
3. A legenda e o estado da assistente (ouvindo, pensando, falando) chegam à tela pelo canal de mensagens da Agora (RTM), e o rosto mexe a boca pelo volume do áudio.
4. Quando o modelo decide agir, a Agora chama as ações da Dona Leda em `/api/mcp` (protocolo MCP): `registrar_bem_estar`, `guardar_lembranca`, `avisar_familia` e `resumir_conversa`. Cada idoso tem a sua chave, então a chave de um não abre a ficha de outro.

Além das ações decididas pelo modelo, cada fala do idoso passa por regras fixas do código (`lib/regras.ts`). Um aviso de queda ou de golpe sai mesmo se o modelo não chamar nenhuma ação.

## Como rodar

Precisa de Node 22 ou mais novo, pnpm, uma conta na Agora (console.agora.io) e um projeto no Supabase (supabase.com).

```bash
pnpm install
cp env.local.example .env.local
```

Preencha o `.env.local`:

- `NEXT_PUBLIC_AGORA_APP_ID` e `NEXT_AGORA_APP_CERTIFICATE`: do seu projeto na Agora.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`: do seu projeto no Supabase, em Project Settings, API.
- `LIA_GEMINI_KEY`: opcional, pro modo Gemini.

No Supabase, em Authentication, desligue a confirmação de e-mail (Confirm email), senão a família não consegue entrar logo depois de criar a conta.

Crie as tabelas rodando `supabase/migrations/20261121130000_inicio.sql` no SQL Editor do Supabase. Depois:

```bash
pnpm dev
```

Abra http://localhost:3000, toque em "Sou da família", crie a conta e escolha "Ver com um exemplo".

### Ligando as ações (ficha, lembranças, resumo)

A nuvem da Agora precisa alcançar `/api/mcp` deste servidor. Publicado na Vercel, o endereço é descoberto sozinho. Rodando no seu computador, abra um túnel e ponha o endereço em `LIA_URL_PUBLICA`:

```bash
ngrok http 3000
```

### App de celular

O app (Capacitor, `app.donaleda`) abre o endereço publicado. As pastas `ios/` e `android/` têm os projetos.

```bash
npx cap sync
npx cap open ios
```

### Conferências

```bash
pnpm test
pnpm typecheck
pnpm lint
```

## Dependências

- Next.js 16, React 19, TypeScript, Tailwind CSS
- Da Agora: `agora-agents` (servidor), `agora-rtc-sdk-ng` e `agora-rtc-react` (áudio), `agora-rtm` (mensagens), `agora-agent-client-toolkit` (legenda e estado), `agora-token`
- Supabase (`@supabase/supabase-js` e `@supabase/ssr`): banco e login da família
- Capacitor 8: app de iPhone e Android
- Vitest: conferências automáticas

A lista completa com as versões está em `package.json` e `pnpm-lock.yaml`.

## O que já existia e o que foi feito no hackathon

**Já existia:** o projeto de partida oficial da Agora, [`agent-quickstart-nextjs`](https://github.com/AgoraIO-Conversational-AI/agent-quickstart-nextjs) (licença MIT). É a primeira gravação deste repositório. Dele vieram a geração de token, a entrada na sala de áudio, a ligação com o canal de mensagens e a rota que encerra a assistente.

**Feito no hackathon** (tudo depois da primeira gravação):

- a personalidade e os limites da Dona Leda em português, montados a cada conversa com a ficha do dia (`lib/persona.ts`);
- os dois modos de conversa na Agora, Gemini Live e três peças (`app/api/invite-agent`);
- as quatro ações e o servidor MCP que a Agora chama (`lib/ferramentas.ts`, `app/api/mcp`);
- as regras fixas de segurança (`lib/regras.ts`, `app/api/conversa`);
- a ligação na hora marcada, a segunda tentativa e o aviso de não atendida (`lib/chamadas.ts`, `app/api/chamada`);
- o banco no Supabase, o login da família e o código que liga o aparelho do idoso (`supabase/`, `lib/dados.ts`, `lib/sessao.ts`, `app/api/idosos`, `app/api/aparelho`);
- a tela do idoso com o rosto animado e a tela do código (`components/`, `hooks/`, `app/parear`);
- o painel da família, o cadastro, o código do aparelho e os ajustes (`app/familia`, `app/entrar`, `components/familia`);
- a marca: quatro direções, a Gema aplicada, o rosto de disco de telefone e o ícone (`app/marca`, `components/marca`, `conhecimento/marca.md`);
- os apps de iPhone e Android (`capacitor.config.ts`, `ios/`, `android/`);
- as conferências automáticas (`testes/`);
- a base de conhecimento do time (`conhecimento/`).

O código foi escrito pelo time com ajuda do Claude Code.

## O que é simulação

- **A dona Helena é inventada.** O perfil, as lembranças e os seis dias anteriores do exemplo vêm de `lib/exemplo.ts`. O painel marca esses dias, e um dia deixa de ser exemplo quando recebe uma conversa de verdade.
- **O rosto é um desenho**, sem avatar em vídeo.
- **A ligação acontece pela internet**, no app ou no navegador do aparelho do idoso. Ligação pelo telefone comum ainda não existe.

## Privacidade e limites

- A conversa inteira não é guardada. O banco guarda a ficha do dia, as lembranças, os avisos e o resumo. A fala só fica registrada dentro de um aviso de segurança.
- As tabelas do banco só são lidas pelo servidor. O navegador fala apenas com as rotas `/api`.
- A família apaga todos os dados de um idoso em `/familia/ajustes`.
- A Dona Leda não é médica, não dá diagnóstico e não muda remédio. Ela não substitui serviço de emergência: em urgência, orienta ligar pro 192 e avisa a família.
- A Dona Leda nunca pede dinheiro, senha ou dado de banco.
- O remédio é registrado como a pessoa disse. Se ela disser que tomou e não tomou, a assistente não tem como saber.

## Próximos passos

- Medir com avós de verdade quantos conversam até o fim e quantos atendem no dia seguinte.
- Passar a ligação pra uma pessoa da família na hora da urgência.
- Ligação pelo telefone comum, pra quem não usa celular com internet.
- Aviso à família por notificação ou WhatsApp, além do painel.
- Ligação tocando com a tela bloqueada no celular.
- Baixar o custo por minuto da conversa (conta em `conhecimento/tese.md`).

## Licença

MIT. O projeto de partida é da Agora, também em MIT (arquivo `LICENSE`).
