# Descrição pra plataforma da organização

Texto pra colar no OS, com o que o regulamento pede: problema, público-alvo, solução e uso da Agora. Escrito em 21/11/2026 a partir da narrativa aprovada em `proposta-de-valor.md`. As notas do fim são do time e não vão pra plataforma.

## Versão completa

### O problema

Ninguém deveria passar os últimos anos da vida parado e sozinho em casa. O nosso sonho é que todo brasileiro envelheça ativo até o fim.

Cerca de 6 milhões de brasileiros com 60 anos ou mais moram sozinhos (IBGE, PNAD Contínua 2025). O filho que mora longe não sabe se a mãe comeu, tomou o remédio ou caiu. Um cuidador de 12 horas por dia custa de R$ 2.800 a 4.500 por mês (Cidesp, 2026). A aposentadoria da maioria dos brasileiros não paga um cuidador: 62,5% de quem recebe do INSS ganha um salário mínimo (R$ 1.621), menos que o piso do cuidador com carteira (R$ 1.760,44 no Caged).

### Pra quem

O idoso lúcido que mora sozinho, com celular ou tablet com internet, só precisa atender. O filho ou a filha que mora longe contrata e acompanha pelo painel. As casas de repouso parceiras indicam a Dona Leda às famílias que as procuram e acompanham os idosos que indicaram.

### A solução

A Dona Leda é a assistente de cuidado de quem envelhece: companhia e apoio no dia a dia, com segurança, saúde, comunicação e rotina.

No protótipo, ela liga todo dia na hora marcada, conversa em português esperando as pausas de quem tem mais idade e sempre se apresenta como assistente virtual. Pergunta do sono, da comida, do remédio e da dor, anota o dia e lembra o que a pessoa contou. A família acompanha num painel e recebe um aviso quando a pessoa conta uma queda, uma dor no peito, um pedido de dinheiro ou senha, uma tristeza que dura ou remédio tomado a mais, e quando a ligação não é atendida. Quem age é a família. Ela não dá diagnóstico e, numa urgência, orienta ligar pro 192.

A Dona Leda leva esse cuidado de todo dia por menos de um décimo do preço.

A idosa do painel de exemplo é inventada.

### Como a Agora entra

1. O aparelho do idoso entra numa sala de áudio da Agora (RTC) e publica só o microfone.
2. O Conversational AI Engine da Agora põe a assistente na sala. No modo principal, ele roda o Gemini Live, com a voz Leda e a chave do time no Google AI Studio.
3. No modo reserva, ele junta três peças com chaves gerenciadas pela Agora: o Deepgram escuta, e a OpenAI responde (gpt-4o-mini) e fala (tts-1).
4. A legenda e o estado da assistente chegam pelo canal de mensagens da Agora (RTM), e na tela um rosto desenhado mexe a boca pelo volume da voz.
5. Quando o modelo decide agir, a Agora chama por MCP as ações dela: anotar o dia, guardar uma lembrança, avisar a família e resumir a conversa.

## Versão curta

Ninguém deveria passar os últimos anos da vida parado e sozinho em casa. A Dona Leda é a assistente de cuidado de quem envelhece. Ela liga todo dia pro idoso, conversa em português, pergunta do sono, da comida, do remédio e da dor e avisa a família quando a pessoa conta uma queda ou um golpe. A conversa roda no Conversational AI Engine da Agora, com o Gemini Live (Deepgram e OpenAI na reserva), numa sala de áudio da Agora (RTC), com legenda pelo RTM e ações por MCP.

## Uma frase

A Dona Leda é a assistente de cuidado de quem envelhece: ela liga pro idoso que mora sozinho no horário combinado e avisa a família quando ele conta uma queda, um golpe ou uma tristeza que dura.

## Notas do time, fora da plataforma: o que foi conferido no código

- **Quem contrata, desde 21/11 às 17h:** a família, com as casas de repouso indicando. Das 15h às 17h o "Pra quem" dizia que o residencial contratava por morador.
- **Sala de áudio só com o microfone:** `components/Conversa.tsx` publica apenas a faixa do microfone (`useLocalMicrophoneTrack` e `usePublish`).
- **Filtro de ruído:** `hooks/useFiltroDeRuido.ts` usa a extensão `agora-extension-ai-denoiser`. Se o aparelho não aguenta o filtro, o microfone segue sem ele. Ficou fora do texto por falta de espaço.
- **Engine e os dois modos:** `app/api/invite-agent/route.ts`. O Gemini Live usa `models/gemini-3.8-live`, voz `Leda`, `pt-BR` e a chave em `LIA_GEMINI_KEY`. A reserva usa `DeepgramSTT` (`nova-3`), `OpenAI` (`gpt-4o-mini`) e `OpenAITTS` (`tts-1`). Sem a chave do Google, o servidor passa sozinho pro modo reserva. Se o Gemini falhar, nada troca sozinho pras três peças.
- **Qual modo é o principal ainda depende do teste de voz.** O Gemini virou o principal às 13h12 de 21/11 e nunca rodou de ponta a ponta (`conhecimento/verificacao.md`, seção 7). Se o teste escolher as três peças, trocar "principal" e "reserva" nos itens 2 e 3 e na versão curta. A linha de `conhecimento/decisoes.md` que diz "três peças como padrão" está velha.
- **Pausas de 650 ms:** `esperaDeSilencio()`, no mesmo arquivo, vale nos dois modos. A verificação acha 650 ms curto pra pausa de idoso e propõe de 1.000 a 1.200 ms. A frase "esperando as pausas" só fica firme depois dessa medida.
- **RTM:** `enable_rtm: true` e `data_channel: 'rtm'`, no mesmo arquivo.
- **Rosto pelo volume:** `components/Rosto.tsx` e `hooks/useNivelDoAudio.ts`, que lê o `getVolumeLevel()` da voz da assistente.
- **MCP:** o servidor `donaleda` aponta pra `/api/mcp`, com as quatro ações de `lib/ferramentas.ts` (`registrar_bem_estar`, `guardar_lembranca`, `avisar_familia`, `resumir_conversa`) e uma chave por idoso. No modo Gemini, a lista de ações é posta à mão no pedido (`GeminiLiveComAcoes`), porque o pacote da Agora instalado (2.9.0) ainda não manda esse campo nesse modo. A tabela de `conhecimento/teste-de-voz.md` ainda está vazia, então as ações no modo Gemini precisam passar no teste antes da entrega.
- **Avisos de queda e de golpe:** os três defeitos da seção 1 de `conhecimento/verificacao.md` seguem no código gravado. `lib/regras.ts` não conhece a palavra "dinheiro", e `hooks/useEnviarFalas.ts` manda só o primeiro pedaço de cada fala. Até o conserto, o aviso de "pediram dinheiro" depende do modelo chamar `avisar_familia`.
- **Assistente virtual:** a saudação e as instruções estão em `lib/persona.ts`. As quatro saudações dizem "assistente virtual", e o 192 está na regra de emergência.
- **Avatar em vídeo:** existe em `route.ts` só no modo de três peças (Anam e HeyGen). Não foi testado e ficou fora do texto.
- **Dona Helena:** `lib/exemplo.ts`.
- **Números:** a população e a aposentadoria estão em `conhecimento/tese.md`, e o preço do cuidador de 12 horas em `conhecimento/tese.md` (seção do preço, fonte Cidesp). A frase do décimo vale com folga contra o cuidador de 12 horas: o plano Essencial custa R$ 129,90 desde 21/11. Em 21/11 o Breno trocou "a aposentadoria média" por "a aposentadoria da maioria dos brasileiros": a média (R$ 2.697) paga um cuidador com carteira, e a maioria (62,5% do INSS, um salário mínimo) não paga.
