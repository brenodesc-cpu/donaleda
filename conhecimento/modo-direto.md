# O modo direto da voz

Atualizado em 21/11/2026, às 19h.

O modo direto é o caminho barato da voz: o aparelho do idoso conversa com o Gemini ao vivo sem o motor de conversa da Agora, e a Agora fica com a sala de áudio. Ele existe no ramo `modo-direto`, liga só com `?modo=direto` no endereço e não é o padrão. A demonstração de 22/11 continua no Gemini pelo motor da Agora.

## Por que existe

O motor de conversa da Agora custa US$ 0,10 por minuto, R$ 59 dos R$ 84 que cada família custa por mês na conta de `tese.md`. O Breno pediu em 21/11, às 18h20, o caminho sem o motor pronto pra provar que a operação se paga.

## Como funciona

1. O servidor emite um passe temporário do Google em `/api/direto`. O passe abre uma conversa só, tem dois minutos pra começar e vence em meia hora. A chave `LIA_GEMINI_KEY` nunca vai pro navegador.
2. O aparelho abre a conversa ao vivo com o Gemini com o mesmo modelo, a mesma voz, as mesmas instruções (`lib/persona.ts`) e as mesmas seis ações do modo `gemini`. O microfone vai pro Gemini e a resposta toca no aparelho.
3. O aparelho entra na sala da Agora e publica nela o microfone do idoso e a voz da Dona Leda. Quem entrar na sala ouve os dois.
4. Quando o Gemini pede uma ação, o aparelho repassa pro servidor em `/api/direto/acao`, com o token do aparelho pareado. A ação só mexe na ficha do idoso daquele aparelho.
5. A legenda das duas falas segue pro mesmo lugar de antes: a fala do idoso passa pelas regras fixas (`lib/regras.ts`) em `/api/conversa`, e as duas vão pro resumo do fim da ligação (`lib/posConversa.ts`).
6. O aparelho soma os tokens que o Google devolve a cada resposta e manda a conta pro servidor no fim, em `/api/direto/uso`. Ela fica guardada com a conversa, no campo `uso`, com o custo em dólares e o custo por minuto.

Dois ajustes saíram dos testes de 21/11:

- **O aparelho avisa o Gemini quando a fala acabou**, depois de 650 ms de silêncio (o mesmo `LIA_SILENCIO_MS` do modo da Agora). Só com a detecção do Google, numa ligação de teste ele juntou quatro falas e respondeu 55 segundos depois. O Virte faz o mesmo aviso em produção.
- **A legenda da fala do idoso fica fixa em português.** Sem isso, numa ligação ela veio em espanhol, e as regras de queda e de golpe leem português.

## Como testar

- No aparelho pareado, abrir o app com `?modo=direto` no endereço. O pedido fica guardado no aparelho, e `?modo=auto` volta ao padrão.
- Com `?medir=1`, a tela mostra durante a ligação os tokens, o custo e o custo por minuto.
- As provas automáticas estão em `testes/direto.test.ts`: o passe sem a chave, as ações só na ficha do aparelho, a legenda, a soma dos tokens, o custo e o aviso de fim de fala.

## O que foi medido em 21/11

Ligações feitas no computador, num Chrome sem janela, com uma voz gravada do Mac no lugar do microfone e a pessoa de exemplo do projeto. Não é teste com gente. O custo usa o preço publicado do modelo, o mesmo de `tese.md`.

| Ligação | Duração | Falas do idoso | Ações | Respostas cobradas | Custo no Google | Por minuto |
|---|---:|---:|---:|---:|---:|---:|
| Curta, às 18h35 | 1 min 54 s | 3 | 3 | 7 | US$ 0,077 | US$ 0,040 |
| Do tamanho do plano, às 18h48 | 3 min 53 s | 12 | 8 | 21 | US$ 0,259 | US$ 0,067 |
| Curta de novo, às 18h54, com o código final | 1 min 51 s | 3 | 4 | 7 | US$ 0,066 | US$ 0,036 |

- Nas três, a Dona Leda guardou a lembrança, avisou a família e gravou o resumo, e tudo apareceu na ficha.
- Uma ligação curta no modo padrão, no mesmo ramo, funcionou como antes: a Dona Leda entrou pelo motor da Agora e respondeu.
- Um segundo participante entrou na sala da Agora durante uma ligação e ouviu som do aparelho do idoso do começo ao fim.
- **Pra onde vai o dinheiro na ligação longa:** 49% é o áudio da conversa, que o Google cobra de novo a cada resposta, 36% são as instruções relidas a cada resposta, 13% é a voz dela e 3% é texto e raciocínio.
- **Cada ação custa uma resposta a mais.** Das 21 respostas cobradas, 8 foram idas e voltas de ação.

**A conta por família, com 100 minutos por mês e o dólar de 19/11 (R$ 5,8889):**

| Base | Google | Sala da Agora | Custo | Sobra dos R$ 105,40 |
|---|---:|---:|---:|---:|
| Ligação do tamanho do plano (US$ 0,067 por minuto) | R$ 39 | uns R$ 1 | R$ 40 | R$ 65 (50% do preço) |
| Ligação curta (US$ 0,036 a 0,040 por minuto) | R$ 21 a 24 | uns R$ 1 | R$ 22 a 25 | R$ 80 a 83 (62% a 64% do preço) |

- O servidor não entra no caminho da voz. Por ligação ele atende o pedido do passe, um pedido por ação e os avisos da legenda, que o plano de hoje da hospedagem já cobre.
- **O número do Google saiu maior que a estimativa de `tese.md`** (US$ 0,042 por minuto, R$ 25 por mês). A estimativa supunha instruções de uns 2.500 tokens, que hoje têm uns 4.700, e deixava de fora a resposta a mais de cada ação. O modelo, as instruções e as ações são os mesmos no modo da Agora, então a parte do Google de lá deve ser parecida. Isso não foi medido no modo da Agora.

## O que falta pra virar o padrão

1. **Teste com gente, num celular.** Com alto-falante e microfone juntos, a voz dela pode voltar pelo microfone e ela se interromper. No modo direto quem tira esse eco é o navegador. Não foi testado.
2. **O app do iPhone e do Android.** O teste foi no Chrome do computador. Falta rodar dentro do app.
3. **Barulho de fundo.** O aviso de fim de fala olha o volume do microfone. Com TV ligada o tempo todo o aparelho não avisa, e sobra a detecção do Google, que falhou no teste.
4. **Queda no meio da ligação.** Se a conversa com o Google cai, a ligação acaba e o resumo é gravado. Falta religar sozinha. O Google reinicia a conexão perto dos 10 minutos, que é o teto da ligação.
5. **Idoso calado.** Ela não pergunta sozinha se a pessoa ainda está aí. Falta um relógio no aparelho pra isso.
6. **A família entrar na ligação.** A sala já leva as duas vozes e o aparelho do idoso toca quem entrar. As frases fixas e a saída da Dona Leda do desenho usam a fala forçada do motor da Agora, que aqui não existe.
7. **Instruções presas no passe.** Hoje o servidor entrega as instruções ao aparelho, que as manda ao Google. Um aparelho adulterado poderia trocar o texto. O Google aceita travar a configuração dentro do passe, e isso não foi testado.
8. **Teto de minutos do plano.** O servidor ainda não conta os minutos de cada família.
9. **Tempo de resposta.** A medição vinha do motor da Agora. Neste modo falta medir no aparelho.
10. **Sem reserva.** Se o Google recusar o passe ou a conversa, nada troca sozinho pro modo de três peças.

## Onde o custo ainda cai

- **Tirar da ligação as duas ações que o resumo do fim já cobre** (`registrar_bem_estar` e `resumir_conversa`). Na ligação longa elas foram 6 das 21 respostas cobradas.
- **Encurtar as instruções.** Os 4.700 tokens são relidos a cada resposta.
- **Ligar a compressão da conversa**, que descarta as falas mais antigas. O Gemini aceitou o ajuste na abertura em 21/11. Falta testar numa conversa.

## Onde fica

- `app/api/direto/route.ts`: o passe e o começo da conversa. `lib/passeDoGemini.ts`: o pedido do passe ao Google.
- `app/api/direto/acao/route.ts`: as ações pedidas pelo Gemini. `app/api/direto/uso/route.ts`: a conta de tokens.
- `hooks/useGeminiDireto.ts`: a conversa do aparelho com o Gemini. `components/ConversaDireta.tsx`: a tela da ligação e a sala da Agora.
- `lib/direto.ts`: o pedido de abertura, a legenda, o aviso de fim de fala, a soma dos tokens e o custo.
