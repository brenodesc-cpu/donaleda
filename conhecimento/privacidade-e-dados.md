# Privacidade e dados da Dona Leda

O que a Dona Leda guarda, pra onde cada dado vai, o que o idoso controla e o que falta antes de um piloto com famílias de verdade. Conferido no código em 22/11/2026, na gravação `868a6e2`. Cada linha traz o arquivo e a linha de onde saiu.

A Dona Leda é um protótipo de hackathon e ainda não cumpre tudo o que a LGPD pede de quem cuida de dado de saúde. Esta página lista o que já existe e o que falta, com dono. Ela foi escrita pelo time, sem advogado, e cada ponto que precisa de um está marcado com **[advogado]**.

## O que fica guardado

Tudo de um idoso fica num objeto só, a ficha (`Base`, em `lib/tipos.ts:255-272`). A separação entre rotina e saúde abaixo é a leitura do time. Sono e comida, ligados a uma pessoa, também dizem da saúde dela, então a linha exata entre os dois grupos é **[advogado]**.

| Dado | Grupo | De onde vem | Código |
|---|---|---|---|
| E-mail e senha da conta da família | cadastro | a família digita | login do Supabase |
| Nome, jeito de chamar e idade do idoso; nome e parentesco de quem cadastrou | cadastro | a família digita | `lib/tipos.ts:168-187` |
| Rede de apoio: nome, parentesco e telefone de outras pessoas | cadastro de terceiros | a família digita | `lib/tipos.ts:233-239` |
| Horários das ligações, ligações feitas (hora e se atendeu), duração da conversa e quantas falas teve | rotina | o sistema | `lib/tipos.ts:96-128` e `195-205` |
| Se saiu de casa e se falou com alguém | rotina | o idoso conta | `lib/tipos.ts:36-37` |
| Lembranças de pessoa, rotina, gosto, história e compromisso | rotina | o idoso conta, a família ensina ou a IA deduz no fim da ligação | `lib/tipos.ts:48-71` |
| Sono e comida do dia | rotina, perto de saúde | o idoso conta | `lib/tipos.ts:29-30` |
| Remédios e horários | saúde | a família digita | `lib/tipos.ts:175` |
| Remédio do dia (tomou, não tomou, não confirmou), dor de 0 a 10, onde dói, humor e observações do dia | saúde | o idoso conta | `lib/tipos.ts:31-38` |
| Lembranças de saúde, dificuldade e humor | saúde | o idoso conta, a família ensina ou a IA deduz | `lib/tipos.ts:10-18` |
| Avisos pra família (queda, emergência, golpe, remédio, tristeza, vontade de morrer), com quem viu e o que fez | saúde | a IA ou uma regra fixa | `lib/tipos.ts:73-87` |
| Resumo de cada conversa, até 600 caracteres | saúde | a IA | `lib/tipos.ts:116` |
| Resumo de exame, consulta ou receita | saúde | a IA lê o arquivo que a família anexa | `lib/tipos.ts:219-230` |
| Código do celular do idoso e os códigos de notificação dos celulares | técnico | o aparelho | `lib/tipos.ts:208-214`, migração `:31-38` |

### O que não fica guardado

- **Áudio e vídeo.** Nenhuma gravação é pedida à Agora: a busca por gravação no código não acha nada.
- **A conversa inteira.** Cada fala do idoso passa pelas regras de segurança e é descartada (`app/api/conversa/route.ts:102-106`). No fim da ligação, as últimas 60 falas vão em texto pro servidor, que tira a ficha e o resumo e não grava o texto (`lib/posConversa.ts:4-5` e `58-71`).
- **A fala que dispara um aviso fica guardada.** Quando uma regra de segurança dispara, o aviso leva um trecho de até 160 caracteres do que o idoso disse (`lib/regras.ts:109-111` e `123-158`). O aviso de tristeza que dura dias vai sem a fala (`lib/regras.ts:166`).
- **O arquivo do exame.** A foto ou o PDF é lido na memória do servidor e descartado. Fica o resumo (`app/api/familia/documento/route.ts:54-69`, `lib/documentos.ts:1-5`).
- **Quem testa em `/experimente`.** O banco guarda o dia, os segundos e dois códigos embaralhados que mudam todo dia, sem nome, endereço nem fala (migração `20261121200000_demonstracao.sql:1-3`).

### Por quanto tempo

Hoje nada vence. Dias, avisos, conversas e lembranças ficam na ficha até alguém apagar. Só três listas têm teto: as 60 últimas ligações (`lib/chamadas.ts:79`), os 40 últimos documentos (`lib/dados.ts:491`) e os 20 últimos acionamentos da rede de apoio (`lib/dados.ts:545`).

O produto usa bem menos do que guarda. O painel mostra 7 dias (`lib/dados.ts:302-306`), as instruções levam os 3 últimos dias (`lib/persona.ts:335-340`) e só o resumo da última conversa aparece (`lib/dados.ts:309-321`). O histórico mais antigo fica guardado sem uso hoje. O argumento de dados do pitch conta com esse histórico, então ele precisa de uma finalidade escrita e dita ao idoso antes do piloto: **[advogado]**.

## Onde fica e quem lê

- **Banco:** Supabase (Postgres), nas tabelas `idosos`, `membros`, `fichas`, `aparelhos`, `codigos` e `demonstracoes`. Todas têm a trava de linha ligada e nenhuma regra de acesso, então só o servidor, com a chave secreta, lê e grava (`supabase/migrations/20261121130000_inicio.sql:52-56`). A auditoria de 21/11 conferiu isso no banco no ar.
- **Quem é "da família":** quem criou a conta e cadastrou o idoso (`app/api/idosos/route.ts:128-129`). O banco aceita um segundo papel, o de familiar convidado, e nenhum código cria esse convite hoje. Cada idoso tem uma conta só, e quem divide a senha vê tudo igual.
- **Toda rota do painel confere** se a pessoa logada acompanha aquele idoso (`lib/sessao.ts:58-80`).
- **O celular do idoso** não tem login. Ele guarda um código que o liga àquele idoso (`lib/aparelho.ts:24-37`), e esse código não vence.
- **O time:** quem tem acesso ao painel do Supabase e da Vercel lê tudo. Não existe lista escrita de quem tem esse acesso.
- **Onde o servidor roda:** sete rotas rodam nos Estados Unidos (`preferredRegion = 'iad1'`, por exemplo em `app/api/invite-agent/route.ts:39`). A região do banco não aparece no código.

## Pra onde cada dado sai

| Empresa | O que recebe | Quando | Código |
|---|---|---|---|
| **Agora** | A voz do idoso e, quando a família entra, a voz e o vídeo dela. Na ligação padrão, também as instruções da assistente com a ficha, a chave do Gemini e o conteúdo das ações (o que ela anota e avisa) | toda ligação | `app/api/invite-agent/route.ts:224-234`, `app/api/mcp/route.ts` |
| **Google, Gemini ao vivo** | A voz do idoso e as instruções: nome, idade, nome de quem cadastrou, remédios, resumos de exame, lembranças (as reservadas também) e os últimos dias | toda ligação padrão e do modo direto | `lib/persona.ts:323-399`, `app/api/direto/route.ts:97-108` |
| **Google, Gemini de texto** | As últimas 60 falas da conversa, em texto | no fim de cada ligação | `lib/posConversa.ts:219-281` |
| **Google, Gemini de texto** | A foto ou o PDF inteiro do exame, com tudo o que estiver escrito nele | quando a família anexa | `lib/documentos.ts:105-137` |
| **Deepgram e OpenAI** | A voz (Deepgram transcreve) e a conversa com as instruções (OpenAI responde e fala), pelas contas da Agora | só no modo de reserva, escolhido à mão | `app/api/invite-agent/route.ts:5-6` e `316-327` |
| **Supabase** | Tudo o que fica guardado | sempre | `lib/dados.ts:415-445` |
| **Vercel** | Roda o servidor: tudo passa por ele, e os erros ficam nos registros | sempre | `vercel.json` |
| **Google (Firebase) e Apple** | O texto da notificação no celular da família | quando sai um aviso | `lib/sinalizacaoChamada.ts:333-389` |

Três pontos pedem atenção.

**As lembranças reservadas vão pra IA.** O "só entre vocês" esconde a lembrança da família. A assistente precisa dela pra conversar, então o texto vai nas instruções (`lib/memoria.ts:383`).

**A notificação nova carrega dado de saúde.** A gravação `a0ba520`, de 22/11 às 8h41, ainda sem revisão e sem publicação, manda pro celular da família o texto do aviso em até 240 caracteres, com o trecho da fala do idoso, e o resumo da conversa quando ela acaba (`app/api/conversa/route.ts:125-139`, `lib/ferramentas.ts:332-340` e `402-409`). Esse texto passa pelo Google e pela Apple e aparece na tela bloqueada do celular. O celular que sai da conta continua na lista de notificação, que guarda os 10 últimos e não tem ação de tirar (`lib/dados.ts:524-537`).

**A rede de apoio por telefone está desligada.** A ligação pra telefone comum só sai com a variável `AGORA_TELEPHONY_FROM_NUMBER` (`lib/sinalizacaoChamada.ts:559-598`). Os telefones dos contatos ficam guardados mesmo assim.

### A chave grátis do Gemini

As três chamadas ao Google usam a mesma chave, a `LIA_GEMINI_KEY` (`app/api/invite-agent/route.ts:229`, `lib/posConversa.ts:224`, `lib/documentos.ts:105`). O código não mostra qual chave está na Vercel. A central do time informou em 22/11 que é a do plano grátis, por decisão do Breno de 21/11, e que não há chave paga disponível no hackathon.

Os termos da API do Gemini, em vigor desde 23/03/2026 (aistudio.google.com/docs/terms, lidos em 22/11), dizem:

- **No plano grátis,** o Google usa o conteúdo enviado e as respostas pra melhorar os produtos e os modelos dele, e revisores humanos podem ler. O texto pede com todas as letras: "Do not submit sensitive, confidential, or personal information to the Unpaid Services."
- **No plano pago,** o Google não usa o conteúdo pra melhorar os produtos. Ele guarda as conversas por um tempo limitado pra detectar abuso, e o tratamento segue o contrato de operador de dados do Google.
- **O que faz a chave ser paga** é o projeto do Google Cloud ter uma conta de cobrança ativa.
- **Os termos proíbem** usar o serviço em prática clínica ou pra dar conselho médico. A Dona Leda não dá conselho médico, e a leitura de exame fica perto dessa linha: **[advogado]**.

Antes de um piloto, a chave passa a ser de um projeto com cobrança ativa. É troca de configuração na Vercel, sem mexer no código. Enquanto a chave for a grátis, voz, conversa e exame de idoso de verdade não deveriam passar por ela.

As ligações de teste com os avós, em 21 e 22/11, rodaram nessa chave. O pedido de permissão falado à família e ao idoso passou a citar o Google na manhã de 22/11 e pede pra não falar número de documento nem senha (`conhecimento/validacao.md`, "O pedido de permissão"). Nas ligações de 21/11 ele ainda não citava, e os dados de quem participou são apagados até 23/11.

## O que o idoso já controla

1. **Ouve o aviso na primeira ligação.** A frase vai na saudação fixa, que não depende de a IA lembrar: "Eu guardo o que a senhora me contar pra lembrar nas próximas conversas, a Marina recebe um resumo de como a senhora está, e é só pedir que eu esqueço o que a senhora quiser." (`lib/privacidade.ts:10-12`, com o tratamento e o nome de cada ficha). A ficha grava o dia e a versão do texto que ele ouviu (`lib/dados.ts:279-285`), e há prova automática em `testes/privacidade.test.ts`.
2. **Sabe que fala com um programa.** Ela se apresenta como assistente virtual e repete isso quando perguntam (`lib/persona.ts:361`).
3. **Guarda um assunto só com ela.** A lembrança fica reservada, e a família vê quantas existem, sem o texto (`lib/memoria.ts:448-460`). O resumo e o aviso de tristeza saem sem o assunto guardado (`lib/posConversa.ts:202-206`).
4. **Pede pra ela esquecer** uma lembrança, uma de cada vez, por voz (`lib/persona.ts:352`, `lib/memoria.ts:301-306`).
5. **Recusa a ligação ou encerra** quando quiser.
6. **Fica com a câmera desligada.** Só a família manda vídeo quando entra na ligação (`conhecimento/agora-o-que-roda.md`).
7. **Fica protegido quando outra pessoa atende.** A ficha do dia volta a como estava, as lembranças e os avisos de rotina daquela ligação saem, e a família recebe um aviso só (`lib/dados.ts:213-266`).

### O que o segredo não cobre

Queda, emergência, vontade de morrer, golpe, senha e Pix sempre chegam à família, mesmo com pedido de segredo. Ela diz isso ao idoso na hora e nunca promete segredo de tudo (`lib/persona.ts:402-403`, regra 10 de [guardrails.md](guardrails.md)).

### O que o idoso ainda não controla

- **Pausar ou parar as ligações sozinho.** Os horários só mudam no painel da família.
- **Apagar tudo.** Só quem cadastrou apaga (`app/api/idosos/route.ts:178-189`).
- **Ver o que foi anotado sobre ele.** Ele pode perguntar a ela, e o painel é da família.
- **Dar o próprio sim.** A ficha registra que ele ouviu o aviso. Não existe registro de que ele concordou, nem pergunta a ele sobre isso. A família também não marca aceite nenhum: ao criar a conta ela vê só um link pra página de privacidade (`app/entrar/page.tsx:115`).
- **Saber das outras empresas.** O aviso falado não conta que a conversa passa pela Agora e pelo Google.

## O que a família vê

Tudo sai de uma função só, `montarPainel` (`lib/dados.ts:299-362`).

**Vê:** a ficha de hoje e dos últimos sete dias, com as observações; as lembranças não reservadas, com a origem de cada uma; quantas lembranças estão reservadas; até 20 avisos, os abertos primeiro, com o trecho da fala quando uma regra disparou; o resumo e a duração da última conversa; as 10 últimas ligações; os resumos de exame; a rede de apoio. Num aviso urgente, ou quando o idoso pede, ela pode entrar na ligação com voz e vídeo.

**Não vê:** a conversa inteira e o áudio, que não existem guardados; o texto das lembranças reservadas; o motivo de uma tristeza que o idoso pediu pra guardar.

**Apaga:** quem cadastrou apaga o idoso em Ajustes, e somem do banco a ficha, os aparelhos, os códigos e o vínculo com a conta (`app/api/idosos/route.ts:178-189`; as tabelas apagam em cascata, migração `:13-44`). A conta da família continua existindo: nenhum botão apaga a conta, e a página de privacidade do site manda pedir ao suporte. O que já passou pelo Google e pela Agora não volta com esse botão.

## O que falta antes de um piloto com famílias de verdade

As datas sem dia marcado dependem de quando a primeira família indicada pela casa parceira começar, o que ainda não foi combinado. Os donos são proposta do time e o Breno confirma.

| O que falta | Por quê | Dono | Quando |
|---|---|---|---|
| Apagar os dados dos avós do teste de 21 e 22/11 que não derem um sim novo | foi o combinado com quem participou | quem cuida do servidor | até 23/11/2026 |
| Chave paga do Gemini | no plano grátis o Google pode usar a voz, a conversa e o exame | Breno (conta do Google) | antes de qualquer idoso de fora do time |
| Notificação sem dado de saúde no texto ("Aviso urgente, abra o app") | o texto passa por Google e Apple e aparece na tela bloqueada | quem cuida do servidor | antes de publicar a `a0ba520` |
| Página `/privacidade` do site em dia | ela não fala de exame, rede de apoio, notificação, Vercel, Firebase e Apple | quem cuida do servidor | antes da primeira família |
| O sim do próprio idoso e o aceite da família, registrados com dia e versão do texto | a lei pede consentimento específico e destacado do titular pra dado de saúde (art. 11, I), a família não responde por um idoso capaz, e hoje ninguém marca aceite | time de produto, **[advogado]** no texto | antes da primeira família |
| Base legal de cada grupo de dado | cadastro e rotina podem ter base diferente de saúde (arts. 7º e 11). A base de proteção da saúde vale pra profissional e serviço de saúde, o que a Dona Leda não é | **[advogado]** | antes da primeira família |
| Prazo de guarda | hoje nada vence, e a lei manda apagar quando o dado deixa de ser necessário (arts. 15 e 16) | Breno decide, **[advogado]** confere | antes da primeira família |
| Contrato de tratamento de dados com Agora, Google, Supabase e Vercel, e com Deepgram e OpenAI se o modo de reserva for usado | os dados saem do Brasil (art. 33) e cada empresa precisa de regra escrita. Só os termos do Gemini foram lidos | **[advogado]** | antes da primeira família pagante |
| Encarregado de dados, com nome e contato publicados | art. 41. Existe uma regra da ANPD que dispensa empresa pequena, e ela pode não valer pra quem trata dado de saúde de idoso. Não foi conferida | Breno, **[advogado]** | antes da primeira família pagante |
| Lista de quem do time acessa o banco e os registros, com o mínimo de gente | art. 46, medidas de segurança | Breno | antes da primeira família |
| Consertos da auditoria de segurança de 21/11 | art. 46. O relatório está com o time, fora do GitHub, porque as brechas estão abertas | quem cuida do servidor | antes da primeira família |
| O idoso pausar as ligações por voz e escolher o que vai pra família | pedido dos mentores: ele é o titular, e pagar não dá à família acesso a tudo | time de produto | durante o piloto |
| Avaliação de impacto, se a ANPD exigir | dado de saúde de idoso em volume | **[advogado]** | antes de vender pra plano |

## A regra do negócio de dados

O pitch diz que cada ligação junta 7 respostas, umas 2.555 por idoso por ano. A regra do que se faz com isso é esta.

### Pode

- **A família** recebe a ficha, os avisos e o resumo, com o idoso avisado.
- **O plano de saúde contrata a ligação** pro beneficiário dele, com o sim do idoso, e paga pelo serviço. O que volta pro plano precisa de regra escrita antes do primeiro contrato: **[advogado]**.
- **Estatística de muitos idosos juntos, sem nome.** O dado anônimo deixa de ser dado pessoal enquanto não der pra voltar à pessoa com esforço razoável (art. 12). Grupo pequeno, como uma casa com doze moradores, volta fácil. Nenhum código gera essa estatística hoje.

### Não pode

- **Vender ou repassar dado de saúde com nome pra ganhar dinheiro.** O art. 11, § 4º proíbe, com exceção pra prestação de serviço de saúde em benefício da pessoa.
- **O plano usar o dado pra escolher quem aceita, cobrar mais ou excluir alguém.** O art. 11, § 5º proíbe.
- **Usar a conversa pra propaganda.**
- **Deixar a conversa de idoso de verdade numa chave em que o fornecedor treina modelo com ela.**

## Respostas curtas pra banca

- **Vocês vão escutar as conversas?** Ninguém do time escuta a ligação, e ela não fica gravada. A assistente ouve na hora pra conversar e pra avisar a família quando aparece um risco, e o que fica é a ficha do dia, os avisos e um resumo. Um mentor fez essa pergunta em 22/11, e a resposta "a gente vai escutar" descreve um produto que não existe.
- **O que vocês fazem com os dados?** A Dona Leda usa pra lembrar do que o idoso contou e pra família saber como ele está. A gente não vende e não usa pra propaganda.
- **O idoso sabe que está sendo gravado?** Ninguém grava a ligação: fica a ficha do dia, as lembranças, os avisos e um resumo, sem áudio e sem a conversa inteira. Na primeira ligação ela conta que é uma assistente virtual, que guarda o que ele disser e que a família recebe um resumo.
- **A família vê tudo o que ele fala?** A família vê a ficha, os avisos e um resumo. Quando ele pede pra guardar um assunto, a família fica sabendo apenas da existência dele, sem o conteúdo. Queda, golpe e vontade de morrer sempre chegam, e a Dona Leda avisa o idoso disso na hora.
- **E a LGPD com dado de saúde?** A gente ainda não cumpre tudo e sabe o que falta. Já existem o aviso ao idoso, o segredo dele, o botão de apagar e o banco fechado. Antes da primeira família pagante entram o sim do próprio idoso, o prazo de guarda, o contrato com os fornecedores e um advogado.
- **Vocês vendem dado pro plano de saúde?** A gente não vende. O plano contrata a ligação pro beneficiário, com o sim do idoso, e paga pelo serviço. A lei proíbe repassar dado de saúde pra ganhar dinheiro e proíbe o plano de usar esse dado pra escolher quem aceita.
- **Dado de saúde numa chave grátis do Google?** O protótipo roda na chave grátis, e nela o Google pode usar o conteúdo pra melhorar os produtos dele. Família de verdade só entra com a chave paga, em que isso não acontece, e a troca é de configuração.
- **E se o idoso quiser parar?** Ele recusa a ligação, encerra quando quiser e pede pra ela esquecer o que contou. Hoje quem apaga tudo é a família, num botão do aplicativo, e falta o idoso conseguir pausar sozinho por voz.

## O que não deu pra conferir

- Qual chave do Gemini está na Vercel: o código não mostra, e a informação de que é a grátis veio da central do time.
- A região do banco no Supabase.
- Por quanto tempo Agora, Deepgram, OpenAI, Supabase e Vercel guardam o que passa por eles. Só os termos do Gemini foram lidos.
- Quem do time tem acesso ao Supabase e à Vercel.
- Se a variável de depuração `LIA_DEPURAR` está desligada no ar. Ligada, ela escreve o pedido à Agora nos registros.
- O texto dos arts. 5º, 7º, 11, 12, 15, 16 e 18 foi conferido na versão compilada do Planalto em 22/11/2026. Os arts. 33, 41 e 46 foram conferidos só pelo começo de cada um.
