# Descrição pra plataforma da organização

Texto pra colar no OS, com o que o regulamento pede: problema, público, solução e como a Agora entra. Reescrito em 22/11/2026, às 11h30, com a narrativa aprovada pelo Breno, os números do deck de hoje, `agora-o-que-roda.md` e `privacidade-e-dados.md`. As notas do fim são do time e não vão pra plataforma.

## Versão completa

### O problema

Quantas vezes você ainda vai ver os seus pais? No Brasil, 37% das pessoas com 50 anos ou mais que têm filhos não veem nenhum deles toda semana (ELSI-Brasil). Entre uma visita e outra, a família não sabe como foi o dia.

O país tem 35,2 milhões de pessoas com 60 anos ou mais, e 6,4 milhões delas moram sozinhas (IBGE, PNAD Contínua 2025). Em 2070 serão 75 milhões de idosos (IBGE, projeção).

Acompanhar o dia a dia de perto hoje custa caro. Um cuidador custa a partir de R$ 2.800 por mês (Cidesp, 2026), e uma casa de repouso, uns R$ 6 mil (Mercado Mineiro, 2026). Os dois dependem de uma pessoa do lado, e o dia a dia do idoso não fica registrado.

### Pra quem

- **Quem atende:** o idoso lúcido que mora sozinho e tem celular ou tablet com internet.
- **Quem paga:** a filha ou o filho que passa a semana sem ver o pai ou a mãe. O plano custa R$ 129,90 por mês.
- **Quem leva até as famílias:** as casas de repouso. A primeira casa parceira entrou em 21/11, na fase de teste.
- **O passo seguinte:** planos de saúde e seguros, que podem contratar por beneficiário, com o sim do idoso.

### A solução

A Dona Leda é a assistente de cuidado de quem envelhece: companhia e apoio no dia a dia, com segurança, prevenção, comunicação e rotina.

Ela liga todo dia na hora combinada, e o idoso só precisa atender, sem ler nem digitar. Conversa em português, sempre se apresenta como assistente virtual, pergunta do sono, da comida, do remédio e da dor e lembra do que ele contou nas outras ligações. A família acompanha num painel o dia de hoje e a semana e recebe um aviso na hora quando ele conta uma queda, um pedido de dinheiro ou de senha ou uma tristeza que dura. Num aviso urgente, a filha entra na mesma ligação. Quem age é a família: a Dona Leda não dá diagnóstico, não é serviço de emergência e, numa urgência, orienta ligar pro 192.

Ninguém grava a ligação. Ficam a ficha do dia, as lembranças, os avisos e um resumo, sem áudio e sem a conversa inteira, e quem cadastrou apaga tudo pelo painel. A gente não vende dado e não usa pra propaganda.

### Como a Agora entra

1. O aparelho do idoso entra numa sala de áudio da Agora (RTC), com chave temporária, e publica só o microfone.
2. No site, o filtro de ruído da Agora (AI Denoiser) limpa o microfone.
3. O Conversational AI Engine da Agora põe a assistente na sala com o Gemini Live, que ouve e fala em português e aceita interrupção.
4. A legenda e o estado da assistente (ouvindo, pensando, falando) chegam à tela pelas mensagens em tempo real da Agora (RTM).
5. A Agora chama as ações da Dona Leda no nosso servidor: anotar a ficha, guardar a lembrança, avisar a família e resumir a conversa.
6. Num aviso urgente, a família entra na mesma sala com voz e vídeo. A Dona Leda anuncia a entrada e sai da sala.
7. Aos 8 minutos e 30 segundos, o servidor pede pela Agora que ela se despeça.

### O que foi testado e o que é simulação

- **Tempo de resposta:** 2,8 segundos em média, medido pelo time em 21/11 com voz gravada.
- **Segurança:** 40 de 55 conversas simuladas de golpe, queda, segredo e remédio resolvidas certo na bateria do time, que roda por texto.
- **Com gente:** uma casa de repouso e os mentores do evento, em 21/11. A casa ensinou que quem mais precisa ainda mora em casa, e por isso a família paga e a casa indica.
- **Simulação:** a dona Helena e a Marina, da demonstração e do vídeo, são pessoas de exemplo, e os dias anteriores do painel delas são inventados.
- **Limites:** ninguém pagou ainda, e o teste com famílias indicadas pela casa parceira começa depois do evento.

## Versão curta

A Dona Leda é a assistente de cuidado de quem envelhece. No Brasil, 6,4 milhões de idosos moram sozinhos, e a família passa a semana sem saber como foi o dia. Ela liga todo dia, o idoso só atende, e a família vê no painel o dia, a semana e o aviso na hora de uma queda ou de um golpe. A conversa roda no Conversational AI Engine da Agora com o Gemini Live, numa sala de áudio da Agora (RTC), com legenda pelo RTM, filtro de ruído e a família entrando na mesma sala num aviso urgente. A família paga R$ 129,90 por mês.

## Uma frase

A Dona Leda é a assistente de cuidado de quem envelhece: liga todo dia pro idoso que mora sozinho, conversa, lembra e avisa a família na hora de uma queda ou de um golpe.

## Notas do time, fora da plataforma: o que foi conferido no código

Estas notas são de 21/11 e parte delas ficou velha. O que vale sobre a Agora está em `agora-o-que-roda.md`, e sobre dados, em `privacidade-e-dados.md`.

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
