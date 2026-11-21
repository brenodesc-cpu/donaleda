# Custos

A página única de custo da Dona Leda, refeita em 21/11/2026 à noite a pedido do Breno, com a operação no modo direto. A conta usa o plano de R$ 129,90 por mês com uma ligação por dia de 3 minutos e 20 segundos (100 minutos por mês) e o dólar oficial de 19/11, a R$ 5,8889.

## 1. Em uma frase

Cada idoso custa uns R$ 16 por mês, e dos R$ 129,90 sobram R$ 89.

## 2. Como a ligação funciona na operação

O aparelho do idoso conversa direto com o Gemini, a inteligência artificial do Google que escuta e responde por voz. A sala de áudio da Agora mantém a chamada de pé e deixa a família entrar nela quando precisa.

## 3. Uma família por mês

| Linha | Por mês |
|---|---:|
| Preço | R$ 129,90 |
| Imposto do Simples Nacional (15,5%) | R$ 20,13 |
| Cartão pelo Asaas (R$ 0,49 mais 2,99%) | R$ 4,37 |
| Gemini, a conversa | R$ 15 |
| Sala de áudio da Agora (zero nos primeiros 10 mil minutos do mês) | R$ 1 |
| **Sobra** | **R$ 89** |

O Google cobra desde a primeira família. Só a sala da Agora sai de graça no começo: com o aparelho do idoso sozinho na sala, os 10 mil minutos grátis do mês cobrem 100 famílias.

## 4. Custos fixos

| Serviço | Por mês |
|---|---:|
| Hospedagem do site (Vercel, plano Pro) | R$ 118 |
| Banco de dados (Supabase, plano Pro) | R$ 147 |
| **Total** | **R$ 265** |

Três famílias pagam os custos fixos. Hoje os dois serviços estão no plano grátis, e o valor acima é o do primeiro plano pago.

## 5. O mês com 10, 50 e 100 famílias

| Famílias | Entra | Imposto e cartão | Gemini | Sala da Agora | Custos fixos | Sobra |
|---:|---:|---:|---:|---:|---:|---:|
| 10 | R$ 1.299 | R$ 245 | R$ 150 | Zero | R$ 265 | R$ 639 |
| 50 | R$ 6.495 | R$ 1.225 | R$ 750 | Zero | R$ 265 | R$ 4.255 |
| 100 | R$ 12.990 | R$ 2.451 | R$ 1.500 | Zero | R$ 265 | R$ 8.774 |

Com 100 famílias a sala ainda cabe nos 10 mil minutos grátis. A partir daí, cada família a mais paga uns R$ 0,58 de sala.

## 6. Se a conversa for mais longa

Com a compressão da conversa ligada, o Gemini custa uns R$ 0,15 por minuto.

| Conversa por dia | Gemini por mês |
|---|---:|
| 2 minutos | R$ 9 |
| 3 minutos e 20 segundos | R$ 15 |
| 5 minutos | R$ 23 |
| 10 minutos | R$ 45 |

Com 10 minutos por dia ainda sobram uns R$ 59 por família.

## 7. De onde vem cada número

**Preço publicado**
- Gemini ao vivo, do Google: US$ 3 por milhão de tokens de áudio que entra, US$ 12 por milhão de áudio que sai, US$ 0,75 por milhão de texto que entra (onde ficam as instruções) e US$ 4,50 por milhão de texto que sai (a legenda). São uns 25 tokens por segundo de áudio. O Google cobra de novo a conversa inteira a cada fala, e a compressão é o ajuste que descarta as falas mais antigas pra conta não crescer.
- Sala de áudio da Agora: US$ 0,99 por mil minutos por participante, com 10 mil minutos grátis por mês.
- Cartão pelo Asaas: R$ 0,49 mais 2,99% por cobrança.
- Imposto: Simples Nacional, Anexo V, 15,5%. Com folha de pagamento alta a empresa cai no Anexo III, de 6%, e a sobra cresce.
- Vercel Pro: US$ 20 por mês por pessoa que publica. Supabase Pro: US$ 25 por mês, com o primeiro projeto. Páginas de preço lidas em 21/11.

**Estimativa**
- Os R$ 15 por mês de Gemini. Contando cada trecho da ligação uma vez só, ela custaria R$ 11 por mês. Sem a compressão, com o Google recontando a conversa a cada fala, custaria R$ 25. Com a compressão ligada fica entre os dois, e R$ 15 é a estimativa até a primeira medida.

**Medido**
- A voz do Virte, o outro app do Breno, usa o Gemini ao vivo direto com gente de verdade. Em outubro de 2026 foram 24 pessoas, 117 conversas e 160 minutos por US$ 3,53, uns R$ 0,13 por minuto. Em novembro, até o dia 21, foram 18 pessoas, 78 conversas e 126 minutos por US$ 3,45, uns R$ 0,16 por minuto. A fonte é o banco do Virte, lido em 21/11 às 18h10.
- A medida prova que o Gemini direto é barato. As conversas do Virte duram menos de 2 minutos e têm instruções de uns 23 mil tokens, e na ligação da Dona Leda pesa o áudio que se acumula, então ela serve de referência pros R$ 0,15 por minuto e ainda não substitui a medida da própria Dona Leda.

Fontes: [preço do Gemini Live](https://aistudio.google.com/docs/pricing#gemini-3.8-live), [cobrança por fala no Live](https://aistudio.google.com/docs/live-api/best-practices), [sala de áudio da Agora](https://docs.agora.io/en/realtime-media/rtc/reference/pricing.md), [motor de conversa da Agora](https://docs.agora.io/en/ai/reference/pricing.md), [Asaas](https://www.asaas.com/precos-e-taxas), [Simples Nacional](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm), [Vercel](https://vercel.com/pricing), [Supabase](https://supabase.com/pricing), [Apple no Brasil](https://www.apple.com/br/newsroom/2026/06/apple-announces-changes-to-ios-in-brazil/).

## 8. Como está hoje

- **O modo direto está em construção** num ramo separado, na conversa "Voz direta no Gemini", e ainda não foi ao ar.
- **O protótipo roda no motor de conversa da Agora,** que custa R$ 59 a mais por idoso por mês (US$ 0,10 por minuto). A conta da Agora está no plano grátis, com 300 minutos do motor por mês, e o Breno vai perguntar à Agora se o hackathon libera mais.
- **A compressão da conversa e as instruções uns 40% mais curtas** foram aprovadas pelo Breno em 21/11 e estão em teste.
- **A premissa do plano é uma ligação por dia.** O app hoje liga duas vezes por dia por padrão (9h e 19h), e o teto de 100 minutos por mês ainda não existe no código.
- **Vender pelo app custa comissão:** no Brasil a Apple cobra de 10% a 15%, mesmo quando o app manda pagar no site. Vendendo só pelo site, a comissão não entra.

## 9. O que falta medir

| O que | Como | Quando |
|---|---|---|
| O custo do Gemini por ligação da Dona Leda, com a compressão | Os tokens que o Google devolve em cada ligação | Nas ligações de teste de 21 e 22/11 |
| O custo de verdade no mês | A primeira fatura do Google | No fim do mês |
| A duração das ligações | O tempo de cada ligação nas ligações com os avós | 21/11 à noite e 22/11 às 9h |
| A sala com só o aparelho do idoso | O uso da sala no painel da Agora, depois que o modo direto rodar | Quando o modo direto for ao ar |
| Se o plano grátis da Vercel permite vender | Os termos de uso da Vercel | Antes da primeira cobrança |
| O preço por volume da Agora | A pergunta do Breno à Agora | No hackathon |
