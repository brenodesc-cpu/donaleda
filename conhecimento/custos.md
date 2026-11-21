# Custos

A página única de custo da Dona Leda, refeita em 21/11/2026 à noite a pedido do Breno, com a operação no modo direto. O plano custa R$ 129,90 por mês e dá até 10 minutos de conversa por dia (decisão do Breno em 21/11, às 19h10). A conta usa o uso médio de 3 minutos e 20 segundos por dia, a média da NANA, de Singapura, e o dólar oficial de 19/11, a R$ 5,8889. Os números são os conservadores, sem contar com ajuste que ainda não foi medido.

## 1. Em uma frase

No uso médio de 3 minutos e 20 segundos por dia, cada idoso custa uns R$ 26 por mês, e dos R$ 129,90 sobram R$ 79. O plano dá até 10 minutos por dia.

## 2. Como a ligação funciona na operação

O aparelho do idoso conversa direto com o Gemini, a inteligência artificial do Google que escuta e responde por voz. A sala de áudio da Agora mantém a chamada de pé e deixa a família entrar nela quando precisa.

## 3. Uma família por mês

| Linha | Por mês |
|---|---:|
| Preço | R$ 129,90 |
| Imposto do Simples Nacional (15,5%) | R$ 20,13 |
| Cartão pelo Asaas (R$ 0,49 mais 2,99%) | R$ 4,37 |
| Gemini, a conversa | R$ 25 |
| Sala de áudio da Agora (zero nos primeiros 10 mil minutos do mês) | R$ 1 |
| **Sobra** | **R$ 79** |

O Google cobra desde a primeira família. Só a sala da Agora sai de graça no começo: com o aparelho do idoso sozinho na sala, os 10 mil minutos grátis do mês cobrem 100 famílias.

Se a compressão da conversa e as instruções mais curtas renderem o esperado, o Gemini pode cair pra uns R$ 15, o custo pra R$ 16 e a sobra subir pra R$ 89. Isso ainda não foi medido.

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
| 10 | R$ 1.299 | R$ 245 | R$ 250 | Zero | R$ 265 | R$ 539 |
| 50 | R$ 6.495 | R$ 1.225 | R$ 1.250 | Zero | R$ 265 | R$ 3.755 |
| 100 | R$ 12.990 | R$ 2.451 | R$ 2.500 | Zero | R$ 265 | R$ 7.774 |

Com 100 famílias a sala ainda cabe nos 10 mil minutos grátis. A partir daí, cada família a mais paga uns R$ 0,58 de sala.

## 6. Se a conversa for mais longa

O custo cresce mais rápido que os minutos, porque o Google cobra de novo a conversa acumulada a cada fala. A compressão, que descarta as falas mais antigas, só faz diferença em ligação longa.

| Conversa por dia | Custo por família por mês | A R$ 129,90 |
|---|---:|---:|
| 3 minutos e 20 segundos, o uso médio (média da NANA, de Singapura) | R$ 26 | Sobram R$ 79 |
| 5 minutos | R$ 51 | Sobram R$ 54 |
| 10 minutos todo dia, com compressão | R$ 121 | Faltam R$ 16 |
| 10 minutos todo dia, sem compressão | R$ 173 | Faltam R$ 68 |
| 15 minutos todo dia, com compressão | R$ 186 | Faltam R$ 81 |
| 15 minutos todo dia, sem compressão | R$ 367 | Faltam R$ 262 |

**O risco dos 10 minutos.** O plano dá até 10 minutos por dia, e o app já encerra a ligação aos 10 minutos. A família no uso médio custa R$ 26 e deixa R$ 79. A família que usa os 10 minutos todo dia custa R$ 121 com a compressão ligada e dá uns R$ 16 de prejuízo. A Hermet, da Espanha, informa média de 23 minutos por ligação (dado da empresa), então vai ter família usando o máximo todo dia.

- **Com a compressão ligada,** uma família no uso médio cobre o prejuízo de até 5 famílias que usam os 10 minutos todo dia. A conta fecha enquanto houver pelo menos 1 família no uso médio pra cada 5 no máximo.
- **Sem a compressão,** cada família no máximo dá uns R$ 68 de prejuízo, e uma família no uso médio cobre só uma. A compressão só existe no modo direto.
- **Com metade das famílias em cada ponta,** cada família deixa em média R$ 32 por mês, e os custos fixos pedem 9 famílias.

## 7. De onde vem cada número

**Preço publicado**
- Gemini ao vivo, do Google: US$ 3 por milhão de tokens de áudio que entra, US$ 12 por milhão de áudio que sai, US$ 0,75 por milhão de texto que entra (onde ficam as instruções) e US$ 4,50 por milhão de texto que sai (a legenda). São uns 25 tokens por segundo de áudio, e o Google cobra de novo a conversa inteira a cada fala.
- Sala de áudio da Agora: US$ 0,99 por mil minutos por participante, com 10 mil minutos grátis por mês.
- Cartão pelo Asaas: R$ 0,49 mais 2,99% por cobrança.
- Imposto: Simples Nacional, Anexo V, 15,5%. Com folha de pagamento alta a empresa cai no Anexo III, de 6%, e a sobra cresce.
- Vercel Pro: US$ 20 por mês por pessoa que publica. Supabase Pro: US$ 25 por mês, com o primeiro projeto. Páginas de preço lidas em 21/11.

**Estimativa**
- O Gemini por ligação, pela pesquisa de 21/11 sem compressão, está na tabela do item 6 em reais por mês. Por ligação, a de 3 minutos e 20 segundos custa US$ 0,14 e a de 10 minutos, US$ 0,97. As premissas são 4 falas por minuto e instruções de uns 2.500 tokens.
- Com a compressão, na simulação da pesquisa (a compressão dispara aos 10 mil tokens de conversa e corta pra 5 mil): US$ 0,67 em 10 minutos e US$ 1,04 em 15. Até 5 minutos a compressão não muda nada.
- Pra ligação de 3 minutos e 20 segundos, a conta pode cair de R$ 25 pra até R$ 11 por mês, que é o custo contando cada trecho uma vez só. Os R$ 15 do item 3 dependem de uma janela de compressão mais curta e das instruções 40% menores, e ninguém testou essa janela.
- Ficaram fora da conta os tokens de pensamento do modelo, que o Google cobra a US$ 4,50 por milhão além do total, sem número publicado.

**Medido**
- A voz do Virte, o outro app do Breno, usa o Gemini ao vivo direto com gente de verdade. Em outubro de 2026 foram 24 pessoas, 117 conversas e 160 minutos por US$ 3,53, uns R$ 0,13 por minuto. Em novembro, até o dia 21, foram 18 pessoas, 78 conversas e 126 minutos por US$ 3,45, uns R$ 0,16 por minuto. A fonte é o banco do Virte, lido em 21/11 às 18h10.
- A medida prova que o Gemini direto é barato. As conversas do Virte duram menos de 2 minutos e têm instruções de uns 23 mil tokens, e na ligação da Dona Leda pesa o áudio que se acumula, então ela serve de referência e ainda não substitui a medida da própria Dona Leda.

Fontes: [preço do Gemini Live](https://aistudio.google.com/docs/pricing#gemini-3.8-live), [cobrança por fala no Live](https://aistudio.google.com/docs/live-api/best-practices), [sala de áudio da Agora](https://docs.agora.io/en/realtime-media/rtc/reference/pricing.md), [motor de conversa da Agora](https://docs.agora.io/en/ai/reference/pricing.md), [Asaas](https://www.asaas.com/precos-e-taxas), [Simples Nacional](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm), [Vercel](https://vercel.com/pricing), [Supabase](https://supabase.com/pricing), [Apple no Brasil](https://www.apple.com/br/newsroom/2026/06/apple-announces-changes-to-ios-in-brazil/). A NANA e a Hermet estão em `concorrentes.md`.

## 8. Como está hoje

- **O modo direto está em construção** num ramo separado, na conversa "Voz direta no Gemini", e ainda não foi ao ar.
- **O protótipo roda no motor de conversa da Agora,** que custa R$ 59 a mais por idoso por mês (US$ 0,10 por minuto). A conta da Agora está no plano grátis, com 300 minutos do motor por mês, e o Breno vai perguntar à Agora se o hackathon libera mais.
- **A compressão da conversa e as instruções uns 40% mais curtas** foram aprovadas pelo Breno em 21/11 e estão em teste. A conversa do servidor testou que o motor de conversa da Agora não repassa a compressão ao Gemini, então ela só existe no modo direto.
- **O plano dá até 10 minutos por dia.** O app encerra cada ligação aos 10 minutos, mas liga duas vezes por dia por padrão (9h e 19h), o que deixa chegar a 20 minutos. Falta o teto por dia no código, ou uma ligação só por dia.
- **Vender pelo app custa comissão:** no Brasil a Apple cobra de 10% a 15%, mesmo quando o app manda pagar no site. Vendendo só pelo site, a comissão não entra.

## 9. O que falta medir

| O que | Como | Quando |
|---|---|---|
| O custo do Gemini por ligação da Dona Leda | Os tokens que o Google devolve em cada ligação | Nas ligações de teste de 21 e 22/11 |
| Se a compressão numa janela curta barateia a ligação de 3 minutos e 20 segundos | Ligações de teste com a compressão ligada | Depois que a compressão for ao ar |
| O custo de verdade no mês | A primeira fatura do Google | No fim do mês |
| A duração das ligações | O tempo de cada ligação com os avós | 21/11 à noite e 22/11 às 9h |
| A sala com só o aparelho do idoso | O uso da sala no painel da Agora | Quando o modo direto for ao ar |
| Se o plano grátis da Vercel permite vender | Os termos de uso da Vercel | Antes da primeira cobrança |
| O preço por volume da Agora | A pergunta do Breno à Agora | No hackathon |
