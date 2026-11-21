# A tese

Atualizado em 21/11/2026.

## O problema

Cerca de 6 milhões de brasileiros com 60 anos ou mais moram sozinhos (40% dos 15,6 milhões de pessoas que moram sozinhas, PNAD Contínua 2025, divulgada em abril de 2026). O filho mora longe, liga quando dá e fica sem saber se a mãe comeu, tomou o remédio ou caiu. O idoso passa dias sem conversar com ninguém.

## Pra quem

- **Quem usa:** a pessoa idosa que mora sozinha ou passa o dia sozinha.
- **Quem contrata, no primeiro produto:** o filho ou a filha que mora longe.
- **Quem pode contratar depois:** residenciais sênior, planos de saúde e prefeituras, que oferecem a Lia aos seus idosos.

## A solução

A Lia liga pro idoso por chamada de vídeo. O aparelho toca na hora marcada, ou quando a família pede, e o rosto da assistente aparece na tela. O idoso atende com um toque, ou a ligação atende sozinha pra quem tem dificuldade de tocar na tela. Ele também pode ligar pra Lia quando quiser. Se ninguém atende, a família é avisada. Na conversa ela:

1. pergunta do sono, da comida, do remédio, da dor e de como ele está se sentindo;
2. lembra do que ele contou nos outros dias (o neto, a consulta, o joelho);
3. anota tudo numa ficha do dia;
4. avisa a família na hora quando algo sai do normal (queda, dor forte, remédio não tomado, pedido de dinheiro por telefone);
5. entrega à família um resumo do dia e da semana.

A Lia diz que é uma assistente virtual. O time decidiu isso no brainstorm: esconder que é IA enganaria justamente a pessoa mais frágil, e voz que finge ser gente é o mecanismo do golpe do falso parente.

## Por que por voz

Muitos idosos não usam aplicativo nem WhatsApp, mas atendem uma ligação. Por isso o produto gira em torno de a assistente ligar: o idoso não precisa abrir nada nem lembrar de nada. O primeiro produto é um aplicativo que recebe a chamada de vídeo num celular ou tablet. A ligação pelo telefone comum vem depois.

## Como a gente ganha dinheiro

Em aberto. Hipóteses do brainstorm de 21/11:

- **Família paga por mês.** Conversa básica de graça e plano pago pro acompanhamento (remédio, avisos, resumo da semana).
- **Residencial sênior paga** e oferece aos moradores como um serviço a mais. Aqui o remédio já é cuidado pela equipe, então a Lia entra como companhia e como aviso à família.
- **Médico ou hospital indica ao paciente.** Exige um médico responsável, que o time não tem hoje.

### Quanto custa a conversa (conta de 21/11/2026)

O preço é o de tabela da Agora (docs.agora.io/en/ai/reference/pricing): US$ 0,10 por minuto de conversa, já com a escuta, o modelo e a voz. O áudio da chamada soma US$ 0,001 por minuto por participante. Dólar a R$ 5,50. No hackathon o uso está liberado.

| Conversa por dia | Minutos no mês | Custo por idoso no mês |
|---|---:|---:|
| 5 minutos | 150 | R$ 84 |
| 10 minutos | 300 | R$ 168 |
| 15 minutos | 450 | R$ 252 |
| 30 minutos | 900 | R$ 505 |

Trinta minutos por dia no preço de tabela custam mais que qualquer mensalidade que uma família pagaria. As saídas, todas com a Agora:

- Oferecer 30 minutos disponíveis e fazer a conta pelo uso real. Falta medir quanto o idoso conversa de verdade.
- Negociar preço por volume com a Agora.
- Usar a Agora só pra chamada (áudio e vídeo) e ligar um modelo de voz direto, como o Gemini Live. Pela estimativa do Breno de outubro, sai perto de US$ 0,02 por minuto, uns R$ 100 por mês nos 30 minutos por dia. Número a confirmar com medição.
- Vender pra quem paga mais por idoso: residencial e plano de saúde.

## Quem já faz parecido

Busca de 21/11/2026.

- **CareCall, da Naver (Coreia):** liga pra idoso que mora sozinho, pago por prefeitura, em mais de 100 municípios. Num estudo com 2.990 idosos, 11% nunca atenderam em três meses.
- **Meela (EUA):** ligações marcadas, US$ 3,5 milhões captados em 2025.
- **Callie Care (EUA):** ligação diária, US$ 500 mil captados em julho de 2026.
- **Joy Calls (EUA):** grátis com uma ligação por dia, US$ 29,99 por mês no plano pago.
- **No Brasil:** Helpbox e Tesatad vendem aparelho de monitoramento, e a Sanii conecta famílias a cuidadores. Não achamos ninguém conversando por voz todo dia em português.

## O que pode dar errado

- O idoso não querer conversar com uma IA. É o maior risco, e a validação do hackathon mede isso.
- Falso positivo no remédio: ele diz que tomou e não tomou. A Lia registra o que ele disse e a família vê como "disse que tomou".
- A família achar caro pagar todo mês.
- Promessa de saúde: software que diagnostica ou acompanha doença é dispositivo médico pra Anvisa. A Lia vende companhia e aviso, sem diagnóstico.
- Emergência: a Lia orienta ligar pro 192 e avisa a família. Ela não substitui serviço de emergência.

## Pra onde isso pode crescer

A assistente que faz tarefas pelo idoso: pedir remédio, marcar consulta, mandar mensagem pra família. E um modo que atende quem tem deficiência visual ou auditiva. Os dois ficam fora do hackathon.

## Como a gente sabe se funciona

Quantos idosos conversam até o fim na primeira vez e quantos aceitam conversar de novo no dia seguinte. No hackathon: de três a cinco avós de gente do time ou do evento, com permissão deles e da família.
