# A tese

Atualizado em 21/11/2026.

## O problema

Cerca de 6 milhões de brasileiros com 60 anos ou mais moram sozinhos (40% dos 15,6 milhões de pessoas que moram sozinhas, PNAD Contínua 2025, divulgada em abril de 2026). Quem envelhece precisa de cuidado todo dia, com companhia, segurança, saúde, comunicação e rotina. Hoje esse cuidado é feito por gente: a filha, de graça, o cuidador por R$ 2.800 a 4.500 por mês, ou o residencial por R$ 6 mil a 11 mil. 62,5% de quem recebe do INSS ganha um salário mínimo (R$ 1.621), menos que o piso do cuidador com carteira (R$ 1.760,44 no Caged), e quase todo idoso envelhece sem esse cuidado ou com um filho fazendo o papel dele. O filho mora longe, liga quando dá e fica sem saber se a mãe comeu, tomou o remédio ou caiu. O idoso passa dias sem conversar com ninguém.

## Pra quem

- **Quem usa:** a pessoa idosa que mora sozinha ou passa o dia sozinha. Ela só precisa atender.
- **Quem contrata (decisão de 21/11, às 17h):** o filho ou a filha que mora longe. É o mesmo comprador do botão de emergência.
- **Quem indica:** a casa de repouso parceira, que recebe famílias decidindo o que fazer com o pai ou a mãe. A primeira topou em 21/11, sem cobrança na fase de teste.
- **Quem pode contratar depois:** empresa de teleassistência e franquia de cuidadores, que já cobram a família do idoso que mora em casa, e plano de saúde de idoso e prefeitura, que compram resultado medido num piloto.

## A solução

A Dona Leda é a camada de cuidado de quem envelhece: uma assistente virtual que traz companhia e apoia com necessidades do dia a dia, como segurança, saúde, comunicação e rotina. Ela leva esse cuidado de todo dia por menos de um décimo do preço de um cuidador. No protótipo, a parte que já funciona é a ligação diária, com a ficha e os avisos.

A Dona Leda liga pro idoso por chamada de vídeo. O aparelho toca na hora marcada, ou quando a família pede, e o rosto da assistente aparece na tela. O idoso atende com um toque, ou a ligação atende sozinha pra quem tem dificuldade de tocar na tela. Ele também pode ligar pra Dona Leda quando quiser. Se ninguém atende, a família é avisada. Na conversa ela:

1. pergunta do sono, da comida, do remédio, da dor e de como ele está se sentindo;
2. lembra do que ele contou nos outros dias (o neto, a consulta, o joelho);
3. anota tudo numa ficha do dia;
4. avisa a família na hora quando algo sai do normal (queda, dor forte, remédio não tomado, pedido de dinheiro por telefone);
5. entrega à família um resumo do dia e da semana.

A saúde do dia a dia fica em perguntar, lembrar e avisar, sem diagnóstico, sem sinais vitais e sem prometer socorro. O que ela faz hoje em cada necessidade e o que vem depois está na tabela de `proposta-de-valor.md`.

A Dona Leda diz que é uma assistente virtual. O time decidiu isso no brainstorm: esconder que é IA enganaria justamente a pessoa mais frágil, e voz que finge ser gente é o mecanismo do golpe do falso parente. A palavra "amiga" fica só no pitch.

## Por que por voz

Muitos idosos não usam aplicativo nem WhatsApp, mas atendem uma ligação. Por isso a Dona Leda leva o cuidado de todo dia pela ligação: a assistente liga, e o idoso não precisa abrir nada nem lembrar de nada. O primeiro produto é um aplicativo que recebe a chamada de vídeo num celular ou tablet. A ligação pelo telefone comum vem depois.

## Como a gente ganha dinheiro

Em aberto. Hipóteses do brainstorm de 21/11:

- **Família paga por mês.** Conversa básica de graça e plano pago pro acompanhamento (remédio, avisos, resumo da semana).
- **Casa de repouso indica**, e paga só se quiser a Dona Leda pros próprios moradores lúcidos. Lá o remédio já é cuidado pela equipe, então a Dona Leda entra como companhia e como aviso à família.
- **Médico ou hospital indica ao paciente.** Exige um médico responsável, que o time não tem hoje.

Desde 21/11/2026, às 17h, a família paga e a casa de repouso indica. Das 15h às 17h a proposta começava pela venda ao residencial, por morador, e voltou depois da conversa com a primeira casa parceira. Teleassistência, plano de saúde e prefeitura vêm depois. O raciocínio está em `proposta-de-valor.md`, na seção "Quem paga e quem indica".

### Quanto custa a conversa e quanto cobrar (conta de 21/11/2026, à tarde)

Proposta pra Stephanie e Breno decidirem. A conta usa o dólar oficial de 19/11 (R$ 5,8889), o mesmo da verificação, e os preços publicados lidos em 21/11. No hackathon o uso está liberado.

**O que cada ligação paga**
- **O motor de conversa da Agora:** US$ 0,10 por minuto. Já inclui a escuta, o modelo e a voz das peças que a Agora gerencia (o modo reserva inteiro). Com chave própria o preço é o mesmo, diz a página de preços. A Agora não escreve com todas as letras que isso vale pro Gemini Live, e é a leitura mais provável, porque não existe outra tarifa.
- **A sala de áudio:** US$ 0,99 por mil minutos, por participante. Quem paga é o aparelho do idoso.
- **O Google, só no modo Gemini:** US$ 3 por milhão de tokens de áudio que entra, US$ 12 por milhão de áudio que sai, US$ 0,75 por milhão de texto que entra (onde ficam as instruções) e US$ 4,50 por milhão de texto que sai (a legenda). São uns 25 tokens por segundo de áudio. A cada fala, o Google cobra de novo a conversa inteira até ali, então a ligação longa custa mais por minuto. Pela conta da pesquisa: US$ 0,14 numa ligação de 3 minutos e 20 segundos, US$ 0,28 em 5 minutos, US$ 0,97 em 10 e US$ 2,06 em 15. As premissas são 4 falas por minuto e instruções de uns 2.500 tokens.

**Custo por idoso por mês, com uma ligação por dia**

| Conversa por dia | Minutos no mês | Modo reserva (três peças) | Modo Gemini |
|---|---:|---:|---:|
| 3 min e 20 s (uso típico) | 100 | R$ 59 | R$ 84 |
| 5 minutos | 150 | R$ 89 | R$ 139 |
| 10 minutos | 300 | R$ 178 | R$ 350 (R$ 297 com compressão) |
| 15 minutos | 450 | R$ 268 | R$ 632 (R$ 451 com compressão) |

- O uso típico é a média da NANA, de Singapura, que liga pra mais de mil idosos: 3 minutos e 20 segundos por conversa. A Hermet, da Espanha, informa média de 23 minutos, então tem idoso que gasta o teto inteiro, e todo plano precisa dar lucro no teto.
- A verificação estimou R$ 88 nas três peças e de R$ 100 a 110 no Gemini, com 5 minutos por dia. Os R$ 88 viram R$ 89 porque ela deixou a sala de áudio de fora. No Gemini, ela pôs o Google em R$ 12 a 22 por mês (US$ 0,07 a 0,12 por ligação), como se cada trecho da conversa fosse cobrado uma vez só. O Google cobra de novo a conversa inteira a cada fala, o que a página dele descreve, e por isso a ligação de 5 minutos sai a US$ 0,28. Os R$ 139 são a conta mais segura, até a primeira fatura de verdade.
- Compressão é o ajuste que descarta as falas mais antigas quando a conversa cresce. Ela está desligada no código. Sem ela, uma sessão só de áudio do Gemini dura no máximo 15 minutos.
- O produto liga duas vezes por dia por padrão (9h e 19h). Por isso o plano conta minutos por mês. Duas ligações de 2 minutos e meio custam menos no Google que uma de 5.

**Opções de plano**

Premissas: a família paga no cartão pelo Asaas (R$ 0,49 + 2,99% por cobrança); a casa paga um Pix por mês (R$ 1,99); imposto do Simples Nacional no Anexo V, 15,5% (com folha de pagamento alta a empresa cai no Anexo III, 6%, e a margem sobe). A margem é sobre o preço.

| Plano | Minutos incluídos | Preço por mês | Margem no teto, Gemini | Margem no teto, reserva | Margem no uso típico, Gemini | Quem compra |
|---|---|---:|---:|---:|---:|---|
| **Essencial** | 150 por mês (5 por dia) | R$ 229,90 | R$ 48 (21%) | R$ 98 (42%) | R$ 103 (45%) | Filho ou filha que mora longe |
| **Companhia** | 300 por mês (10 por dia) | R$ 449,90 | R$ 16 (4%), ou R$ 69 (15%) com compressão | R$ 188 (42%) | R$ 282 (63%) | Família que quer conversa mais longa |
| **Casa** | 200 por mês, num saldo da casa | R$ 229,90 por casa | R$ 7 (3%), com conversas de 5 minutos | R$ 73 (32%) | R$ 24 (11%) | Casa de repouso que quer a Dona Leda pros próprios moradores lúcidos |

O Essencial fica perto do botão de emergência que a família já compra (Tecnosenior, de R$ 189 a 249 por mês) e da ligação diária da CheckWellCall nos EUA (US$ 29,99).

**A frase do décimo**

| Cuidador | Preço por mês | Um décimo | Planos que cumprem |
|---|---:|---:|---|
| 12 horas por dia (Cidesp, maio de 2026) | R$ 2.800 a 4.500 | R$ 280 a 450 | Essencial. O Companhia só contra o de R$ 4.500 |
| Com carteira: média do Caged (R$ 1.863,66) com 13º, férias e 20% de encargos | perto de R$ 2.485 | R$ 248 | Essencial |

A primeira metade da frase foi ajustada pelo Breno em 21/11. A aposentadoria média, de R$ 2.697 (IBGE 2025), paga o cuidador com carteira e só não paga o de 12 horas. A frase passou a ser "A aposentadoria da maioria dos brasileiros não paga um cuidador": 62,5% dos beneficiários do INSS recebem um salário mínimo (R$ 1.621), menos que o piso do cuidador no Caged (R$ 1.760,44).

**Recomendação**

O Essencial a R$ 229,90 pra família, com 150 minutos por mês, que é quem paga desde 21/11. Ele cumpre a frase do décimo contra o cuidador de 12 horas, dá lucro no teto mesmo no Gemini e cai na faixa que a verificação calculou (R$ 220 a 250). O plano Casa fica pra casa de repouso que quiser a Dona Leda pros próprios moradores. O Companhia espera a medida do uso real e a compressão ligada. A decisão é da Stephanie e do Breno.

O plano Casa entrou em 21/11 no lugar do Residencial, que cobrava R$ 179,90 por morador. A primeira casa parceira paga uns R$ 230 por mês, por casa, pelo sistema de gestão que usa hoje, e com cinco moradores o preço por morador daria R$ 900, quase quatro vezes isso. O plano Casa fica perto desse valor e cobre uns dois moradores conversando 3 minutos por dia. No Gemini a margem dele é a mais apertada da tabela, e com conversas de 5 minutos quase some. A casa parceira que só indica famílias e acompanha os idosos que indicou não paga.

**Antes de falar disso pra banca**
- O teto de minutos ainda não existe no código: a ligação só termina sozinha 2 minutos depois de todo mundo sair da sala.
- Perguntar à Agora, no evento, se o Gemini com chave própria paga os US$ 0,10 por minuto e se os 300 minutos grátis do motor renovam todo mês. Se o motor sair de graça no Gemini, ele vira o modo mais barato.
- Vender pelo app custa comissão: no Brasil a Apple cobra de 10% a 15% mesmo quando o app manda pagar no site. Vendendo só pelo site, sem link no app, a comissão não entra.

A conta muda com o preço por volume que a Agora negociar (a tabela só publica desconto da sala, que é 1% do custo), com o câmbio e com a primeira fatura do Google.

Fontes: [preço da Agora](https://docs.agora.io/en/ai/reference/pricing.md), [sala de áudio](https://docs.agora.io/en/realtime-media/rtc/reference/pricing.md), [preço do Gemini Live](https://aistudio.google.com/docs/pricing#gemini-3.8-live), [cobrança por fala no Live](https://aistudio.google.com/docs/live-api/best-practices), [Asaas](https://www.asaas.com/precos-e-taxas), [Simples Nacional](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm), [salário mínimo](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm), [cuidador no Caged](https://www.salario.com.br/profissao/cuidador-de-idosos-cbo-516210), [cuidador de 12 horas](https://cidesp.com.br/conteudo/tabela-de-preco-de-cuidador-de-idoso-2026-guia-completo), [Tecnosenior](https://tecnosenior.com/solucoes/vidafone-fixo/), [CheckWellCall](https://checkwellcall.com/pricing), [Apple no Brasil](https://www.apple.com/br/newsroom/2026/06/apple-announces-changes-to-ios-in-brazil/), [aposentadoria média](https://agenciadenoticias.ibge.gov.br/agencia-sala-de-imprensa/2012-agencia-de-noticias/noticias/46579-rendimento-medio-da-populacao-brasileira-atinge-r-3-367-em-2025.html), [INSS](https://www.opovo.com.br/trends/teto-do-inss-chega-a-r-8-475-em-2026-mas-a-maioria-dos-aposentados-esta-muito-longe-desse-valor/).

## Quem já faz parecido

Busca de 21/11/2026.

- **CareCall, da Naver (Coreia):** liga pra idoso que mora sozinho, pago por prefeitura, em 128 de 229 municípios (setembro de 2024), uma ou duas vezes por semana. Num estudo com 2.990 idosos, 11% nunca atenderam em três meses.
- **Meela (EUA):** ligações marcadas, US$ 3,5 milhões captados em 2025.
- **Callie Care (EUA):** ligação diária, US$ 500 mil captados em julho de 2026.
- **Joy Calls (EUA):** grátis com uma ligação por dia, US$ 29,99 por mês no plano pago.
- **No Brasil:** Helpbox e Tesatad vendem aparelho de monitoramento, e a Sanii conecta famílias a cuidadores. Não achamos ninguém conversando por voz todo dia em português.

## O que pode dar errado

- O idoso não querer conversar com uma IA. É o maior risco, e a validação do hackathon mede isso.
- Falso positivo no remédio: ele diz que tomou e não tomou. A Dona Leda registra o que ele disse e a família vê como "disse que tomou".
- A família achar caro pagar todo mês.
- Promessa de saúde: software que diagnostica ou acompanha doença é dispositivo médico pra Anvisa. A Dona Leda cuida da saúde do dia a dia perguntando, lembrando e avisando, sem diagnóstico.
- Emergência: a Dona Leda orienta ligar pro 192 e avisa a família. Ela não substitui serviço de emergência.

## Pra onde isso pode crescer

A assistente que faz tarefas pelo idoso: pedir remédio, marcar consulta, mandar mensagem pra família. E um modo que atende quem tem deficiência visual ou auditiva. Os dois ficam fora do hackathon.

## Como a gente sabe se funciona

Quantos idosos conversam até o fim na primeira vez e quantos aceitam conversar de novo no dia seguinte. No hackathon: de três a cinco avós de gente do time ou do evento, com permissão deles e da família.

O número do sonho, nas semanas seguintes: em quantos dias da semana cada idoso saiu de casa e conversou com alguém. A ficha já anota os dois todo dia (21/11/2026).
