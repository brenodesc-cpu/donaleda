# Custos

A página única de custo da Dona Leda, com a operação no modo direto. O plano custa R$ 129,90 por mês e dá até 10 minutos de conversa por dia (decisão do Breno em 21/11). A conta usa o uso médio de 3 minutos e 20 segundos por dia, a média da NANA, de Singapura, e o dólar oficial de 19/11, a R$ 5,8889. Desde 21/11 às 19h46 o custo do Gemini é o medido numa ligação de teste, no lugar da estimativa.

## 1. Em uma frase

No uso médio de 3 minutos e 20 segundos por dia, cada idoso custa uns R$ 38 por mês, e dos R$ 129,90 sobram R$ 67.

## 2. Como a ligação funciona na operação

O aparelho do idoso conversa direto com o Gemini, a inteligência artificial do Google que escuta e responde por voz. A sala de áudio da Agora mantém a chamada de pé e deixa a família entrar nela quando precisa.

## 3. Uma família por mês

| Linha | Por mês |
|---|---:|
| Preço | R$ 129,90 |
| Imposto do Simples Nacional (15,5%) | R$ 20,13 |
| Cartão pelo Asaas (R$ 0,49 mais 2,99%) | R$ 4,37 |
| Gemini, a conversa (medido) | R$ 37 |
| Sala de áudio da Agora (zero nos primeiros 10 mil minutos do mês) | R$ 1 |
| **Sobra** | **R$ 67** |

O Google cobra desde a primeira família. Só a sala da Agora sai de graça no começo: com o aparelho do idoso sozinho na sala, os 10 mil minutos grátis do mês cobrem 100 famílias.

Ainda dá pra cortar. Na ligação medida, 6 das 18 respostas cobradas eram duas ações que a Dona Leda faz durante a conversa (anotar o dia e resumir a conversa). Fazendo as duas depois da ligação, o Gemini do uso médio cairia pra uns R$ 25 e a sobra subiria pra R$ 79. Isso ainda não foi medido.

## 4. Custos fixos

| Serviço | Por mês |
|---|---:|
| Hospedagem do site (Vercel, plano Pro) | R$ 118 |
| Banco de dados (Supabase, plano Pro) | R$ 147 |
| **Total** | **R$ 265** |

Quatro famílias pagam os custos fixos. Hoje os dois serviços estão no plano grátis, e o valor acima é o do primeiro plano pago.

## 5. O mês com 10, 50 e 100 famílias

| Famílias | Entra | Imposto e cartão | Gemini | Sala da Agora | Custos fixos | Sobra |
|---:|---:|---:|---:|---:|---:|---:|
| 10 | R$ 1.299 | R$ 245 | R$ 370 | Zero | R$ 265 | R$ 419 |
| 50 | R$ 6.495 | R$ 1.225 | R$ 1.850 | Zero | R$ 265 | R$ 3.155 |
| 100 | R$ 12.990 | R$ 2.451 | R$ 3.700 | Zero | R$ 265 | R$ 6.574 |

Com 100 famílias a sala ainda cabe nos 10 mil minutos grátis. A partir daí, cada família a mais paga uns R$ 0,58 de sala.

## 6. Se a conversa for mais longa

| Conversa por dia | Custo por família por mês | A R$ 129,90 |
|---|---:|---:|
| 3 minutos e 20 segundos, o uso médio (medido) | R$ 38 | Sobram R$ 67 |
| 8 minutos e 40 segundos todo dia (medido) | R$ 103 | Sobram R$ 2 |
| 10 minutos todo dia, o máximo do plano (estimativa pela medida de 8 minutos e 40 segundos) | R$ 119 | Faltam R$ 13 |

**O risco dos 10 minutos.** O app encerra a ligação aos 10 minutos. A família no uso médio deixa R$ 67, e a família que usa os 10 minutos todo dia dá uns R$ 13 de prejuízo. A Hermet, da Espanha, informa média de 23 minutos por ligação (dado da empresa), então vai ter família usando o máximo todo dia.

- Uma família no uso médio cobre o prejuízo de até 5 famílias que usam os 10 minutos todo dia.
- Com metade das famílias em cada ponta, cada família deixa em média R$ 27 por mês, e os custos fixos pedem 10 famílias.

## 7. De onde vem cada número

**Medido**
- O Gemini no modo direto, em 21/11 às 19h35 e 19h40, com as instruções mais curtas e a compressão ligada. A compressão começa aos 4 minutos de conversa e guarda os 2 minutos mais novos. O custo é a soma dos tokens que o Google devolve em cada ligação, pelo preço publicado.
- A ligação de 3 minutos e 25 segundos custou US$ 0,213, ou US$ 0,062 por minuto: 88.745 tokens de texto que entra, 35.987 de áudio que entra e 2.545 de áudio que sai. Foram 10 falas e 18 respostas cobradas, porque cada ação que ela faz também é cobrada.
- A ligação de 8 minutos e 40 segundos custou US$ 0,574, ou US$ 0,066 por minuto. A compressão cortou duas vezes, e aos 7 minutos ela já não lembrava o que a pessoa disse no começo. A ficha do dia guardou tudo.
- **As ressalvas:** as ligações foram feitas no computador, com uma voz gravada do Mac no lugar de gente, e a fatura do Google ainda não chegou. O detalhe está em `modo-direto.md`, que entra no `main` depois das 21h30.

**Estimativa**
- A linha dos 10 minutos por dia usa os US$ 0,066 por minuto da ligação de 8 minutos e 40 segundos.
- O corte pra uns R$ 25, tirando as duas ações da ligação.
- A estimativa da tarde dava R$ 25 por mês no uso médio. A medida deu R$ 37, porque cada ação que ela faz na conversa também é cobrada.

**Preço publicado**
- Gemini ao vivo, do Google: US$ 3 por milhão de tokens de áudio que entra, US$ 12 por milhão de áudio que sai, US$ 0,75 por milhão de texto que entra e US$ 4,50 por milhão de texto que sai. O Google cobra de novo a conversa acumulada a cada fala, e a compressão descarta as falas mais antigas pra essa conta não crescer.
- Sala de áudio da Agora: US$ 0,99 por mil minutos por participante, com 10 mil minutos grátis por mês.
- Cartão pelo Asaas: R$ 0,49 mais 2,99% por cobrança.
- Imposto: Simples Nacional, Anexo V, 15,5%. Com folha de pagamento alta a empresa cai no Anexo III, de 6%, e a sobra cresce.
- Vercel Pro: US$ 20 por mês por pessoa que publica. Supabase Pro: US$ 25 por mês, com o primeiro projeto. Páginas de preço lidas em 21/11.

**Referência**
- A voz do Virte, o outro app do Breno, usa o Gemini ao vivo direto com gente de verdade e gastou de R$ 0,13 a 0,16 por minuto em outubro e novembro de 2026, em conversas de menos de 2 minutos (banco do Virte, lido em 21/11 às 18h10).

Fontes: [preço do Gemini Live](https://aistudio.google.com/docs/pricing#gemini-3.8-live), [cobrança por fala no Live](https://aistudio.google.com/docs/live-api/best-practices), [sala de áudio da Agora](https://docs.agora.io/en/realtime-media/rtc/reference/pricing.md), [motor de conversa da Agora](https://docs.agora.io/en/ai/reference/pricing.md), [Asaas](https://www.asaas.com/precos-e-taxas), [Simples Nacional](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm), [Vercel](https://vercel.com/pricing), [Supabase](https://supabase.com/pricing), [Apple no Brasil](https://www.apple.com/br/newsroom/2026/06/apple-announces-changes-to-ios-in-brazil/). A NANA e a Hermet estão em `concorrentes.md`.

## 8. Como está hoje

- **O modo direto funciona no ramo separado** da conversa "Voz direta no Gemini", foi medido às 19h46 de 21/11 e entra no `main` depois das 21h30. Ainda não está no ar pras famílias.
- **O protótipo de hoje roda no motor de conversa da Agora,** que custa R$ 59 a mais por idoso por mês (US$ 0,10 por minuto) e não repassa a compressão ao Gemini. A conta da Agora está no plano grátis, com 300 minutos do motor por mês, e o Breno vai perguntar à Agora se o hackathon libera mais.
- **O plano dá até 10 minutos por dia.** O app encerra cada ligação aos 10 minutos, mas liga duas vezes por dia por padrão (9h e 19h), o que deixa chegar a 20 minutos. Falta o teto por dia no código, ou uma ligação só por dia.
- **Vender pelo app custa comissão:** no Brasil a Apple cobra de 10% a 15%, mesmo quando o app manda pagar no site. Vendendo só pelo site, a comissão não entra.

## 9. O que falta medir

| O que | Como | Quando |
|---|---|---|
| O custo com gente de verdade | Os tokens das ligações com os avós, no modo direto | Quando o modo direto for ao ar |
| O custo de verdade no mês | A primeira fatura do Google | No fim do mês |
| Quanto cai tirando as duas ações da ligação | Uma ligação de teste com as ações feitas depois | Depois da entrega |
| A duração das ligações | O tempo de cada ligação com os avós | 21/11 à noite e 22/11 às 9h |
| A sala com só o aparelho do idoso | O uso da sala no painel da Agora | Quando o modo direto for ao ar |
| Se o plano grátis da Vercel permite vender | Os termos de uso da Vercel | Antes da primeira cobrança |
| O preço por volume da Agora | A pergunta do Breno à Agora | No hackathon |
