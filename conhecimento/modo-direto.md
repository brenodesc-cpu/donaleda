# O modo direto da voz

Atualizado em 22/11/2026, à 0h15.

O modo direto é o caminho barato da voz: o aparelho do idoso conversa com o Gemini ao vivo sem o motor de conversa da Agora, e a Agora fica com a sala de áudio. Ele está no ar desde 21/11, às 19h, liga só com `?modo=direto` no endereço e não é o padrão. A demonstração de 22/11 continua no Gemini pelo motor da Agora.

## Por que existe

O motor de conversa da Agora custa US$ 0,10 por minuto, R$ 59 dos R$ 84 que cada família custa por mês na conta de `tese.md`. O Breno pediu em 21/11, às 18h20, o caminho sem o motor pronto pra provar que a operação se paga.

## Como funciona

1. O servidor emite um passe temporário do Google em `/api/direto`. O passe abre uma conversa só, tem dois minutos pra começar e vence em meia hora. A chave `LIA_GEMINI_KEY` nunca vai pro navegador.
2. O aparelho abre a conversa ao vivo com o Gemini com o mesmo modelo, a mesma voz, as mesmas instruções (`lib/persona.ts`) e as mesmas seis ações do modo `gemini`. O microfone vai pro Gemini e a resposta toca no aparelho.
3. O aparelho entra na sala da Agora e publica nela o microfone do idoso e a voz da Dona Leda. Quem entrar na sala ouve os dois.
4. Quando o Gemini pede uma ação, o aparelho repassa pro servidor em `/api/direto/acao`, com o token do aparelho pareado. A ação só mexe na ficha do idoso daquele aparelho.
5. A legenda das duas falas segue pro mesmo lugar de antes: a fala do idoso passa pelas regras fixas (`lib/regras.ts`) em `/api/conversa`, e as duas vão pro resumo do fim da ligação (`lib/posConversa.ts`).
6. O aparelho soma os tokens que o Google devolve a cada resposta e manda a conta pro servidor no fim, em `/api/direto/uso`. Ela fica guardada com a conversa, no campo `uso`, com o custo em dólares e o custo por minuto.

Quatro ajustes saíram dos testes de 21/11:

- **O aparelho avisa o Gemini quando a fala acabou**, depois de 650 ms de silêncio (o mesmo `LIA_SILENCIO_MS` do modo da Agora). Só com a detecção do Google, numa ligação de teste ele juntou quatro falas e respondeu 55 segundos depois. O Virte faz o mesmo aviso em produção.
- **A legenda da fala do idoso fica fixa em português.** Sem isso, numa ligação ela veio em espanhol, e as regras de queda e de golpe leem português.
- **A compressão da conversa fica ligada desde o começo** (pedido do Breno em 21/11). Depois de uns 4 minutos de conversa o Gemini descarta as falas mais antigas e deixa os 2 minutos mais novos, pra não cobrar de novo a ligação inteira a cada resposta. As instruções nunca são descartadas. `LIA_COMPRESSAO_MIN` troca os minutos, e 0 desliga.

- **O aparelho religa a conversa quando o Gemini fica mudo.** O Google tem um defeito conhecido, que o Virte mede em 1 a cada 6 conversas: ele ouve a fala e não responde, sem dar erro e sem fechar a conexão. Aqui apareceu de dois jeitos: marca o começo da fala e para, ou escreve a fala na legenda e não fala nada. Agora, se ela não fala nem pede uma ação 4,5 segundos depois do fim da fala, o aparelho pede um passe novo pra mesma conversa, abre outra conversa com o Gemini levando o que já foi dito, e manda a fala de novo (em som, ou por escrito quando ela já estava na legenda). A pessoa espera uns 6 segundos a mais e não precisa repetir. O mesmo vale quando a conexão cai, quando a saudação não vem e quando ela anota algo e cala. Depois de religar três vezes na mesma ligação, ela acaba. A demonstração pública (`/experimente`) não religa.
- **Quanto o defeito aparece (madrugada de 22/11, ligações curtas de teste):** com o silêncio perfeito do microfone de teste, de 2 a 4 em cada 6 ligações ficaram mudas na primeira fala. Com um chiado baixo no fundo, como num microfone de verdade, 2 de 9. Nas ligações em que a religada já existia, ela resolveu 6 das 8 mudas, e os dois jeitos do defeito, fingidos de propósito, se recuperaram no teste. Falta medir num celular com gente.

**O preço da compressão é a memória.** Na ligação de 8 minutos, perguntada aos 7 minutos sobre o café da manhã e o joelho de que a pessoa tinha falado no começo, ela respondeu só "a senhora comeu bem" e perguntou do joelho de novo. O resumo do fim também ficou sem o sono, o café, o remédio e o joelho, ditos no começo. A ficha do dia guardou tudo, porque é anotada na hora. Com 4 minutos, a ligação média de 3 minutos e 20 segundos nunca é cortada.

## Como testar

- No aparelho pareado, abrir o app com `?modo=direto` no endereço. O pedido fica guardado no aparelho, e `?modo=auto` volta ao padrão.
- Com `?medir=1`, a tela mostra durante a ligação os tokens, o custo e o custo por minuto.
- As provas automáticas estão em `testes/direto.test.ts`: o passe sem a chave, as ações só na ficha do aparelho, a legenda, a soma dos tokens, o custo e o aviso de fim de fala.

## O que foi medido em 21/11

Ligações feitas no computador, num Chrome sem janela, com uma voz gravada do Mac no lugar do microfone e a pessoa de exemplo do projeto. Não é teste com gente. O custo é a soma dos tokens que o Google devolve a cada resposta, pelo preço publicado do modelo, o mesmo de `tese.md`. A primeira fatura do Google confirma ou corrige.

**As duas ligações que valem,** às 19h35 e 19h40, com as instruções curtas (gravação `21c49e6`) e a compressão ligada:

| | Ligação de 3 minutos | Ligação de 8 minutos |
|---|---:|---:|
| Duração | 3 min 25 s | 8 min 40 s |
| Falas do idoso | 10 | 28 |
| Respostas cobradas | 18 | 38 |
| Texto que entra (tokens) | 88.745 | 190.745 |
| Áudio que entra (tokens) | 35.987 | 108.170 |
| Áudio que sai (tokens) | 2.545 | 7.400 |
| Texto que sai e raciocínio (tokens) | 1.722 | 3.811 |
| Custo no Google | US$ 0,213 | US$ 0,574 |
| **Por minuto** | **US$ 0,062** | **US$ 0,066** |

- Nas duas, a Dona Leda ouviu todas as falas, anotou o dia, guardou a lembrança e pediu o aviso à família. O aviso da ligação de 8 minutos apareceu na ficha. O da ligação de 3 minutos tinha o mesmo texto de um aviso de 20 minutos antes, de outra ligação de teste, e foi segurado pela regra que não repete o mesmo aviso em meia hora.
- As regras fixas funcionam pela legenda deste modo: numa ligação de teste das 19h32, a frase "caí no banheiro" virou aviso urgente por regra na mesma hora.
- Na de 8 minutos a compressão cortou duas vezes, aos 4 minutos e aos 6 minutos e meio, e a ligação seguiu normal. Sem ela, pela conta do crescimento medido, a ligação custaria perto de US$ 0,78. Esse número sem compressão é estimativa.
- **Pra onde vai o dinheiro:** na de 3 minutos, 51% é o áudio da conversa, que o Google cobra de novo a cada resposta, 31% são as instruções e o texto relidos, 14% é a voz dela e 4% é texto e raciocínio.
- **Cada ação custa uma resposta a mais.** Na de 3 minutos, 8 das 18 respostas cobradas foram idas e voltas de ação.
- Um segundo participante entrou na sala da Agora durante uma ligação das 18h48 e ouviu som do aparelho do idoso do começo ao fim.
- Uma ligação curta no modo padrão, com o código do modo direto junto, funcionou como antes.

**A conta por família,** com o dólar de 19/11 (R$ 5,8889) e o preço de R$ 129,90:

| Uso | Gemini por mês | Sala da Agora | Sobra depois de imposto e cartão (R$ 105,40) |
|---|---:|---:|---:|
| 3 minutos e 20 segundos por dia, o uso médio (100 minutos no mês) | R$ 37 | uns R$ 1 | R$ 67 |
| 8 minutos e 40 segundos todo dia (260 minutos no mês) | R$ 101 | uns R$ 2 | R$ 3 |

- **O número medido do uso médio é R$ 37 por mês,** no lugar da faixa de R$ 13 a 25 e dos R$ 25 de `custos.md`. A estimativa supunha instruções de uns 2.500 tokens, que hoje têm uns 4.200 com as ações, e deixava de fora a resposta a mais de cada ação.
- A conta de `custos.md` pra ligação longa com compressão (R$ 121 com 10 minutos todo dia) bate com o medido: a US$ 0,066 por minuto, 10 minutos todo dia dão uns R$ 117.
- As instruções 27% menores baixaram o texto que entra de 108 mil pra 89 mil tokens na ligação de 3 minutos. O custo total ficou igual ao da medição das 19h13 com as instruções antigas (US$ 0,210), porque nessa ela falou mais e o áudio subiu.
- O servidor não entra no caminho da voz. Por ligação ele atende o pedido do passe, um pedido por ação e os avisos da legenda.

**As medições anteriores do dia,** com as instruções antigas e sem compressão: 1 min 54 s a US$ 0,040 por minuto, 3 min 53 s a US$ 0,067 e 1 min 51 s a US$ 0,036.

## O que falta pra virar o padrão

1. **Teste com gente, num celular.** Com alto-falante e microfone juntos, a voz dela pode voltar pelo microfone e ela se interromper. No modo direto quem tira esse eco é o navegador. Não foi testado.
2. **O app do iPhone e do Android.** O teste foi no Chrome do computador. Falta rodar dentro do app.
3. **Barulho de fundo.** O aviso de fim de fala olha o volume do microfone. Com TV ligada o tempo todo o aparelho não avisa, e sobra a detecção do Google, que falhou no teste.
4. **Queda no meio da ligação.** O aparelho religa sozinho, até três vezes. Foi provado com o defeito fingido da ligação muda. A queda de conexão de verdade usa o mesmo caminho e não foi provocada em teste.
5. **Idoso calado.** Ela não pergunta sozinha se a pessoa ainda está aí. Falta um relógio no aparelho pra isso.
6. **A família entrar na ligação.** A sala já leva as duas vozes e o aparelho do idoso toca quem entrar. As frases fixas e a saída da Dona Leda do desenho usam a fala forçada do motor da Agora, que aqui não existe.
7. **Instruções presas no passe.** Hoje o servidor entrega as instruções ao aparelho, que as manda ao Google. Um aparelho adulterado poderia trocar o texto. O Google aceita travar a configuração dentro do passe, e isso não foi testado.
8. **Teto de minutos do plano.** O servidor ainda não conta os minutos de cada família.
9. **Tempo de resposta.** A medição vinha do motor da Agora. Neste modo falta medir no aparelho.
10. **Sem reserva.** Se o Google recusar o passe ou a conversa, nada troca sozinho pro modo de três peças.
11. **Chave do Gemini dividida.** Bateria de testes, demonstração pública e ligações usam a mesma chave. A ligação muda apareceu com e sem bateria rodando, então a chave dividida não é a causa provada, e mesmo assim vale não rodar bateria durante ligação de verdade.

## Onde o custo ainda cai

- **Tirar da ligação as duas ações que o resumo do fim já cobre** (`registrar_bem_estar` e `resumir_conversa`). Na ligação de 3 minutos elas foram 6 das 18 respostas cobradas, e sem elas o uso médio cairia de R$ 37 pra uns R$ 25 por mês. É conta, sem medição.
- **Encurtar mais as instruções.** Elas e as ações ainda somam uns 4.200 tokens, relidos a cada resposta.
- **Apertar a compressão** pra menos de 4 minutos corta mais, e ela passa a esquecer dentro da ligação média.

## Onde fica

- `app/api/direto/route.ts`: o passe e o começo da conversa. `lib/passeDoGemini.ts`: o pedido do passe ao Google.
- `app/api/direto/acao/route.ts`: as ações pedidas pelo Gemini. `app/api/direto/uso/route.ts`: a conta de tokens.
- `hooks/useGeminiDireto.ts`: a conversa do aparelho com o Gemini. `components/ConversaDireta.tsx`: a tela da ligação e a sala da Agora.
- `lib/direto.ts`: o pedido de abertura, a legenda, o aviso de fim de fala, a soma dos tokens e o custo.
