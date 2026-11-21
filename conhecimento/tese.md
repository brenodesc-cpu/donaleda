# A tese

Atualizado em 21/11/2026.

## A tese em uma página

Primeira versão em 21/11/2026, antes das ligações das 20h. Todo número tem fonte e data, e a estimativa vem marcada como estimativa. O detalhe de cada parte está nas seções de baixo.

**Em uma frase:** a família do idoso lúcido que mora sozinho paga R$ 129,90 por mês por uma ligação combinada que ajuda a família a cuidar, e as casas de repouso indicam a Dona Leda às famílias que as procuram.

### 1. O tamanho do mercado, em degraus

| Degrau | Pessoas | Por ano, a R$ 129,90 por mês | De onde vem |
|---|---:|---:|---|
| Têm 60 anos ou mais e moram sozinhas | 6,0 milhões | R$ 9,35 bilhões (teto) | PNAD Contínua 2025, IBGE, divulgada em abril de 2026 |
| Dessas, usam internet | 3,5 a 4,5 milhões | R$ 5,5 a 7,0 bilhões | **Estimativa:** 59% (TIC Domicílios 2025) a 74,5% (IBGE 2025) dos 60+ usam internet. A taxa é de todos os 60+, aplicada a quem mora sozinho |
| E fazem chamada de voz ou vídeo | 2,7 a 3,4 milhões | R$ 4,2 a 5,3 bilhões | **Estimativa:** 76% de quem tem 60+ e usa internet faz chamada. O número está em `concorrentes.md` sem a pesquisa de origem anotada, e falta conferir |
| E têm família que paga uns R$ 130 por mês | 0,7 a 0,9 milhão | R$ 1,1 a 1,4 bilhão | **Estimativa:** uso o plano de saúde como sinal de renda. 8,7 milhões de pessoas de 60+ têm plano (IESS, fevereiro de 2026), 27% dos 32,1 milhões de 60+ (Censo 2022) |
| O primeiro grupo, em 12 meses, pelas casas que indicam | Sem número | | **Não tem fonte.** O Censo SUAS 2023 conta 2.081 unidades de acolhimento pra pessoa idosa, quase todas filantrópicas, e as particulares com fins lucrativos não respondem a ele. Moram em instituições 160.784 pessoas (Censo 2022). Quantas famílias procuram cada casa por mês ninguém publica |

**Como medir o último degrau:** perguntar à primeira casa parceira, e às próximas, quantas famílias a procuram por mês e quantas acabam não levando o idoso, e anotar a partir de agora qual casa indicou cada família que entrar.

### 2. Quanto cobrar

- **O custo, em cinco linhas** (a conta inteira, com as fontes, está em [custos.md](custos.md)):
  - Na operação, o aparelho do idoso conversa direto com o Gemini, e a sala da Agora mantém a chamada e deixa a família entrar.
  - Cada idoso custa uns R$ 16 por mês: R$ 15 de Gemini e R$ 1 de sala da Agora.
  - Dos R$ 129,90 saem R$ 24,50 de imposto e cartão, e sobram R$ 89 por família.
  - Os custos fixos, site e banco, somam R$ 265 por mês e se pagam com 3 famílias.
  - O modo direto ainda está em construção. O protótipo roda hoje no motor de conversa da Agora, que custa R$ 59 a mais por idoso.
- **O que a família já paga por algo parecido:** o botão de emergência custa de R$ 189 a 249 por mês (Tecnosenior, conferido em 21/11). Nos EUA, a ligação diária da CheckWellCall custa US$ 29,99, uns R$ 177. O cuidador de 12 horas por dia custa de R$ 2.800 a 4.500 (Cidesp, maio de 2026).
- **As respostas de preço que temos:** uma só. Uma mentora com os pais morando longe disse "eu investiria até R$ 500" por mês (21/11, `entrevistas.md`). As ligações das 20h trazem mais.
- **O preço decidido:** R$ 129,90 por mês, com 100 minutos de conversa, uns 3 minutos e 20 segundos por dia. O Breno decidiu em 21/11, às 17h50, porque achou R$ 229,90 caro pra um produto que acabou de surgir. Fica abaixo do botão de emergência e é menos de 5% do preço do cuidador de 12 horas.
- **O preço pra testar hoje à noite:** depois de a família dizer quanto pagaria, perguntar se pagaria R$ 129,90 por mês por uma ligação por dia com os avisos no painel. Anotar o primeiro valor que ela disse e o sim ou o não.

### 3. Quem já faz parecido

| Quem | Quem paga | O que o idoso faz | Preço por mês | Atende em português | Por que não resolve pro filho brasileiro |
|---|---|---|---|---|---|
| Joy Calls, CheckWellCall, ElderVoice (EUA) | Família | Atende o telefone | De US$ 9,99 a 99,99 | Não informa | Vendem só na América do Norte e no Reino Unido |
| Callie Care (EUA) | Família ou o idoso | Liga pra um número | US$ 15 | Não informa | Só nos EUA, e o que cresce lá são as corridas de carro |
| inTouch (República Tcheca) | Família | Atende o fixo ou o celular | € 29,90 | Não informa | Só na Europa, e os idosos acharam a voz robótica |
| CLOVA CareCall (Coreia e Japão) | Prefeitura | Atende o telefone | Pago pelo governo | Não: coreano e japonês | É vendido a governo, e a família fica de fora |
| Hermet (Espanha) | Teleassistência e residencial | Atende o telefone | Não publicado | Não informa | A família não recebe nada |
| ElliQ (EUA) | Órgão público, ou família | Conversa com um robô de mesa | US$ 40, mais US$ 249 de entrada | Não informa | Aparelho importado e caro |
| Komp (Noruega) | Família | Nada: a chamada da família abre sozinha | NOK 249, mais NOK 7.995 pelo aparelho | Não informa | Não tem assistente, quem liga é a família |
| Alexa Together (Amazon) | Família | Pede socorro à Alexa | US$ 19,99 | Não informa | Saiu do ar |
| Tesatad Anna (Brasil) | Família | Conversa com um aparelho de mesa | R$ 479, com contrato de dois anos | Sim | É protótipo, com venda prevista pro segundo semestre de 2027 |
| TeleHelp e Tecnosenior (Brasil) | Família | Aperta um botão | De R$ 189 a 249 | Sim | Só serve depois que algo deu errado, e ninguém conversa com o idoso |
| Fabi, da EdukaLuz (Brasil) | Não informado | Escreve no WhatsApp | Não informado | Sim | Só responde quem procura |
| **Dona Leda** | Família, com a casa de repouso indicando | Atende a chamada de vídeo | R$ 129,90 (decidido em 21/11) | Sim | |

**Por que ninguém fez isso aqui ainda:** no Brasil, quem vende pra esse público vende botão de emergência e cuidador, e os produtos que ligam pro idoso com IA estão nos EUA, na Europa e na Ásia, falando inglês ou a língua de lá.

### 4. O problema a fundo

- **O que a família faz hoje pra saber se está tudo bem:** liga quando dá, visita, pede pra um vizinho olhar, paga um botão de emergência ou contrata cuidador. Isso vem do que ouvimos e da pesquisa de concorrentes. Não achamos pesquisa nacional sobre filho que acompanha os pais de longe.
- **Quanto tempo a família gasta por semana:** sem número publicado pra quem acompanha à distância. *Lugar pro número das ligações das 20h: o valor do meio das horas por semana que cada família gasta ligando ou indo ver.*
- **O que dá errado:**
  - Queda: 194 mil internações de idosos no SUS em 2025, cerca de 530 por dia.
  - Solidão: entre pessoas de 50 anos ou mais, 16,8% se sentem sós sempre, e quem mora só tem 2,44 vezes mais chance de solidão constante (ELSI-Brasil, coleta de 2015 e 2016).
  - O cuidado cai em cima de alguém da família: 25,8% dos cuidadores de idosos com limitação pararam de trabalhar ou estudar pra cuidar, e só 9,2% recebem por isso (ELSI-Brasil, Revista de Saúde Pública, 2018).
  - A família se divide: a primeira casa parceira recebe muitas famílias em que parte quer levar o idoso pra casa de repouso e parte não (21/11).
- *Lugar pras ligações das 20h: quantas famílias falaram, o que cada uma usa hoje e o que já deu errado.*

### 5. O que ainda não sabemos

| O que | Como medir | Quando |
|---|---|---|
| Se o idoso atende e volta a atender no dia seguinte | Ligações das 20h e a de domingo às 9h | 21 e 22/11 |
| Quantas horas por semana a família gasta checando | A pergunta da planilha das ligações (`validacao.md`) | 21/11, às 20h |
| Se o filho paga todo mês | Pedir o cartão a famílias do teste, com a primeira cobrança depois de uma semana | Depois do hackathon |
| Quantos idosos que moram sozinhos usam internet | Cruzar, nos microdados da PNAD, quem mora sozinho com quem usa internet | Depois do hackathon |
| Quantas famílias passam por uma casa de repouso por mês | Perguntar à primeira casa parceira e às próximas | Semana de 23/11 |
| Quantas indicações viram família pagante | Anotar qual casa indicou cada família | No primeiro mês |
| O custo de verdade no Gemini | A primeira fatura do Google | No fim do mês |

Fontes desta página: as de `concorrentes.md` (PNAD Contínua 2025, TIC Domicílios 2025, IESS, ELSI-Brasil, internações por queda e os sites das empresas), [Censo 2022 sobre quem mora em instituição](https://agenciabrasil.ebc.com.br/geral/noticia/2024-09/brasil-tem-160-mil-pessoas-vivendo-em-asilos-e-14-mil-em-orfanatos), [Censo SUAS 2023, na apresentação do MDS na Câmara](https://www2.camara.leg.br/atividade-legislativa/comissoes/comissoes-permanentes/comissao-de-defesa-dos-direitos-da-pessoa-idosa-cidoso/apresentacoes-em-eventos/apresentacoes-de-convidados-em-audiencias-publicas-em-2024/audiencia-publica-sobre-desafios-das-instituicoes-de-longa-permanencia-para-idosos-15-5-24/apresentacao-ap-15-5-24-ministerio-do-desenvolvimento-social-e-combate-a-fome/view) e [ELSI-Brasil sobre cuidadores](https://scielosp.org/pdf/rsp/2018.v52suppl2/9s/pt).

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
4. avisa a família na hora quando a pessoa fala de queda, dor forte, golpe, tristeza que dura ou remédio tomado a mais, e quando o remédio não foi confirmado;
5. entrega à família um resumo do dia e da semana.

A saúde do dia a dia fica em perguntar, lembrar e avisar, sem diagnóstico, sem sinais vitais e sem prometer socorro. Quem age é a família: a promessa, desde 21/11, é uma ligação combinada que ajuda a família a cuidar. O que ela faz hoje em cada necessidade e o que vem depois está na tabela de `proposta-de-valor.md`.

A Dona Leda diz que é uma assistente virtual. O time decidiu isso no brainstorm: esconder que é IA enganaria justamente a pessoa mais frágil, e voz que finge ser gente é o mecanismo do golpe do falso parente. A palavra "amiga" fica só no pitch.

## Por que por voz

Muitos idosos não usam aplicativo nem WhatsApp, mas atendem uma ligação. Por isso a Dona Leda leva o cuidado de todo dia pela ligação: a assistente liga, e o idoso não precisa abrir nada nem lembrar de nada. O primeiro produto é um aplicativo que recebe a chamada de vídeo num celular ou tablet. A ligação pelo telefone comum vem depois.

## Como a gente ganha dinheiro

Em aberto. Hipóteses do brainstorm de 21/11:

- **Família paga por mês.** Conversa básica de graça e plano pago pro acompanhamento (remédio, avisos, resumo da semana).
- **Casa de repouso indica**, e paga só se quiser a Dona Leda pros próprios moradores lúcidos. Lá o remédio já é cuidado pela equipe, então a Dona Leda entra como companhia e como aviso à família.
- **Médico ou hospital indica ao paciente.** Exige um médico responsável, que o time não tem hoje.

Desde 21/11/2026, às 17h, a família paga e a casa de repouso indica. Das 15h às 17h a proposta começava pela venda ao residencial, por morador, e voltou depois da conversa com a primeira casa parceira. Teleassistência, plano de saúde e prefeitura vêm depois. O raciocínio está em `proposta-de-valor.md`, na seção "Quem paga e quem indica".

### O preço e o custo

O plano da família custa R$ 129,90 por mês, com uma ligação por dia de 3 minutos e 20 segundos, decidido pelo Breno em 21/11. A conta de custo, com a operação no modo direto e as fontes, está em [custos.md](custos.md). Os planos Companhia e Casa, calculados antes do preço novo, saíram da tese e voltam quando houver medida de uso.

**A frase do décimo** vale com folga: R$ 129,90 é menos de 5% do cuidador de 12 horas por dia, que custa de R$ 2.800 a 4.500 (Cidesp, maio de 2026). A primeira metade da frase foi ajustada pelo Breno em 21/11: "A aposentadoria da maioria dos brasileiros não paga um cuidador", porque 62,5% dos beneficiários do INSS recebem um salário mínimo (R$ 1.621), menos que o piso do cuidador no Caged (R$ 1.760,44). A aposentadoria média, de R$ 2.697 (IBGE 2025), paga um cuidador com carteira.

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
- Promessa de saúde: software que diagnostica ou acompanha doença é dispositivo médico pra Anvisa. A Dona Leda pergunta como a pessoa está, lembra o que ela contou e avisa a família, sem diagnóstico.
- Emergência: a Dona Leda orienta ligar pro 192 e avisa a família. Ela não substitui serviço de emergência.

## Pra onde isso pode crescer

A assistente que faz tarefas pelo idoso: pedir remédio, marcar consulta, mandar mensagem pra família. E um modo que atende quem tem deficiência visual ou auditiva. Os dois ficam fora do hackathon.

## Como a gente sabe se funciona

Quantos idosos conversam até o fim na primeira vez e quantos aceitam conversar de novo no dia seguinte. No hackathon: de três a cinco avós de gente do time ou do evento, com permissão deles e da família.

O número do sonho, nas semanas seguintes: em quantos dias da semana cada idoso saiu de casa e conversou com alguém. A ficha já anota os dois todo dia (21/11/2026).
