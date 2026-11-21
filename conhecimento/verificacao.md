# Verificação contra o regulamento

Primeira conferência em 21/11/2026, às 13h10. Refeita às 13h50 com nove agentes: seis checaram cada afirmação tentando derrubá-la, e três fizeram papel de jurado (um da Agora, um investidor da NewHack e um especialista em idoso) sem ver este relatório. Os achados graves foram conferidos de novo no código. Fontes: o regulamento de 17/11, o código até a gravação `7f77a7e`, o site donaleda.vercel.app, a documentação da Agora, o pacote `agora-agents` e as notas desta pasta.

## Resumo

- **Nota provável hoje: de 3,2 a 3,6 de 5.** Os três jurados deram 3,3, 3,6 e 3,2. Com as cinco ações da seção 4, perto de 4. A primeira conta (4,4) supunha técnica e problema em 5 e foi otimista.
- **Nenhuma regra que elimina está quebrada no GitHub.** Faltam o time conferido no OS, as entregas do OS e a versão entregue certa (seção 2).
- **O maior risco é a cena que vende.** A idosa conta que caiu ou que pediram dinheiro e o aviso aparece no painel da filha. Três defeitos do código fazem essa cena falhar sem mensagem nenhuma (seção 1).
- **A narrativa de venda foi aprovada pelo Breno às 13h24** e está em `proposta-de-valor.md`.

## 1. Três defeitos que derrubam a cena da queda e do golpe

Conferidos no código às 13h45. Valem nos dois modos da conversa.

1. **O aviso recebe só o primeiro pedaço de cada fala da idosa.** A tela usa a legenda no modo de texto, que marca cada pedaço da fala do usuário como terminado na hora em que ele chega (`agora-agent-client-toolkit`, `handleTextMessage`). O `useEnviarFalas` manda cada fala ao servidor uma vez só, no primeiro pedaço (`hooks/useEnviarFalas.ts` e `falasTerminadasDoIdoso` em `lib/conversation.ts`). "Eu caí no banheiro" pode chegar às regras como "Eu" e não virar aviso. Conserto: mandar a fala quando ela termina de verdade, ou mandar de novo quando o texto do mesmo turno crescer.
2. **A regra de golpe não conhece a palavra "dinheiro".** Ela exige uma palavra da lista (Pix, senha, código, cartão, transferência, depósito, boleto, empréstimo, consignado) junto de alguém pedindo (`lib/regras.ts`, linhas 31 e 63). "Me ligaram dizendo que era meu neto e pediram dinheiro" fica por conta da IA. Faltam também "golpe", "sequestro" e "CPF". Cada palavra nova entra com um caso em `testes/regras.test.ts`.
3. **O mesmo aviso não aparece de novo no mesmo dia.** Aviso do mesmo tipo e com o mesmo texto no mesmo dia volta o antigo, e nenhuma regra repete em um minuto (`lib/dados.ts`, linhas 56 a 64). Se o time ensaiar a frase da demonstração no domingo de manhã com a mesma idosa, às 13h nenhum cartão novo aparece. Na demonstração, usar uma idosa de exemplo criada na hora ou apagar os dados dela antes do pitch.

Quem faz: Gustavo, com a conversa "Servidor, voz e banco". Uns 45 minutos com o teste. Até 17h de sábado.

## 2. Regras que eliminam

Fonte: itens 3, 5.1 e 5.5 do regulamento. A organização confere antes da classificação final.

| # | Regra | Situação | O que falta |
|---:|---|---|---|
| 1 | Time de 3 a 5 inscritos, aprovados e presentes nos dois dias | Falta conferir | Breno abre o OS e vê os quatro aprovados e confirmados |
| 2 | Uso da Agora funcionando e demonstrado | Falta conferir | Nenhuma conversa por voz no site publicado nem em celular de verdade, nos dois modos. A de 12h02 foi no Chrome do Mac |
| 3 | Descrição, slides (até 10), vídeo de até 2 min e link do repositório cadastrados no OS | Não cumpre ainda | O vídeo precisa mostrar a conversa real e a Agora trabalhando (legenda, estado e o painel reagindo), em link que a banca abre |
| 4 | README com como rodar, dependências e versão entregue | Cumpre em parte | O texto foi corrigido às 13h15. A versão não bate: o README diz 0.2.0 e a etiqueta `entrega`, o `package.json` diz 0.1.0, e a etiqueta não existe. Quem rodar de fora trava na criação da conta se não desligar a confirmação por e-mail no Supabase, e o README não diz isso |
| 5 | Separar o que já existia do que foi feito | Cumpre | Uma linha dizendo que a primeira gravação já traz pequenas mudanças do time |
| 6 | Respeitar licenças | Cumpre | |
| 7 | Nada de chave, dado pessoal ou material de terceiro | Cumpre hoje | As 30 gravações foram varridas às 13h25 sem achar chave. Refazer na gravação final. E-mail e senha da conta de demonstração nunca entram no repositório, só no campo do OS. Concorrentes e o Terça da Serra só pelo nome, sem logo |
| 8 | Repositório público na entrega e na avaliação | Cumpre | Não fechar |
| 9 | Simulação declarada | Cumpre | Se alguém do time fizer o papel da idosa no vídeo, dizer isso no vídeo |
| 10 | Prazo de 12h de 22/11 | Pendente | Enviar até 11h |

Duas coisas fora das regras que eliminam e que podem custar caro:
- **O site sai do Mac, sem passar pelo GitHub.** O que a banca vê no ar pode ser diferente do código entregue. Publicar o site a partir da gravação marcada com `entrega`.
- **A promessa feita às famílias hoje à noite** diz que nada é gravado e que tudo é apagado. **Conferido às 14h05: a chave do Gemini no site e no Mac é do plano grátis do Google** (a que termina em 3caA, no projeto "Gemini Project", marcado "Nível gratuito" no AI Studio). Nesse plano o Google pode usar a conversa pra melhorar os produtos dele. O site usa o modo de três peças por padrão (`LIA_MODO=tres` na Vercel), então as ligações com os avós ficam fora do Google enquanto ninguém abrir `?modo=gemini`. Se o Gemini virar o modo do palco, o Breno cria uma chave num projeto pago (os dois projetos do Virte na conta 2 do AI Studio estão no Nível 1) e troca a variável na Vercel ele mesmo, porque isso gasta crédito e chave não passa por agente.

## 3. Nota por critério

| Critério | Peso | Eu | Jurado da Agora | Investidor | Especialista em idoso | Com as ações |
|---|---:|---:|---:|---:|---:|---:|
| Conversa por voz | 25% | 3 | 3 | 3,5 | 3 | 4 |
| Execução técnica e Agora | 25% | 4 | 3,5 | 4 | 3,5 | 4 |
| Problema e impacto | 20% | 4 | 4 | 4 | 3,5 | 4 |
| Inovação | 15% | 3 | 3 | 3 | 3,5 | 4 |
| Validação | 10% | 1 | 2,5 | 3 | 2 | 4 |
| Apresentação | 5% | 3 | 3,5 | 3,5 | 3 | 4 |
| **Total** | | **3,25** | **3,3** | **3,6** | **3,2** | **4,0** |

**Por que não chega a 5.**
- **Voz:** ninguém mediu uma resposta. Os 650 ms de espera são menos que a pausa de 1 segundo que idoso faz no meio da frase, então ela deve atropelar a pessoa. Se a ligação cai, a tela volta pra espera em 1,5 s sem aviso e ninguém liga de novo. No Gemini, ela fica muda se o idoso se cala.
- **Técnica:** o modo principal nunca rodou de ponta a ponta, e quando ele falha a tela fica em "Estou te ouvindo" sem nada acontecer.
- **Inovação:** Callie Care, Joy Calls e ElderVoice já ligam todo dia pra idoso lá fora, e operadoras no Japão e na Coreia já avisam a família durante um golpe.
- **Validação:** zero idosos até agora.

**O caminho pro 5,** depois das cinco ações: o tempo de resposta medido pela própria Agora perto de 1 s, uma segunda ligação no domingo de manhã pros mesmos avós contando quem atende de novo, uma mensagem escrita do Terça da Serra topando conversar sobre um piloto, e um momento que só a voz faz. Os dois jurados de fora sugeriram o mesmo momento: na urgência, a filha entra na mesma chamada da Agora. Isso é recurso novo (2 a 3 horas) e só entra depois que a cena da queda funcionar.

## 4. As cinco ações, revisadas

| # | Ação | Por quê | Quem | Tempo | Até |
|---:|---|---|---|---|---|
| 1 | **Consertar os três defeitos da seção 1** e ensaiar a cena da queda e do golpe com as frases exatas | É a cena que mostra problema, voz e Agora de uma vez, e hoje ela falha em silêncio | Gustavo | 45 min | 17h |
| 2 | **Escolher o modo pela medida.** Rodar o `teste-de-voz.md` num celular de verdade, nos dois modos, lendo o tempo de cada resposta pelas métricas da Agora (já ligadas no pedido, ninguém lê). Subir a espera de silêncio pra 1.000 a 1.200 ms. Se ficar o Gemini, trocar o pacote pra 2.15.0. O modo escolhido vira o padrão do site, do vídeo e da demonstração | Voz vale 25% e é o primeiro desempate, e hoje nenhuma resposta foi medida | Gustavo no código, Breno no papel da idosa, Stephanie anota | 1h30 | 18h |
| 3 | **Ligar pros avós das 20h às 23h** no modo escolhido, com a chave paga confirmada, perguntando à família quanto pagaria por mês. Ligar de novo pros mesmos avós no domingo às 9h | Validação sai do zero, e a reação de uma avó real vira a história do pitch | Breno, Vitor e Stephanie | 3h mais 1h | 23h e domingo 10h |
| 4 | **Gravar o vídeo e montar o palco** no sábado à noite: celular da idosa ao lado do painel, a conversa com uma interrupção, a queda e o aviso chegando. No palco, internet do celular, fone com microfone ou celular perto da boca de quem faz a idosa, ninguém falando perto, e quem faz a idosa falando primeiro | É entrega obrigatória e a reserva se a internet cair. O barulho do salão é o maior risco da demonstração ao vivo | Breno no roteiro, Gustavo nos aparelhos | 2h | meia-noite |
| 5 | **Fechar números e entregas.** Custo e preço certos (seção 6), as frases que saem do pitch, um teto de 5 a 7 minutos por ligação no código, versão igual no README e no `package.json`, etiqueta `entrega`, site publicado da mesma gravação, varredura final de chaves e o time conferido no OS | Sem as entregas não tem nota, e número errado na frente da Agora custa ponto em problema e em clareza | Stephanie nos números, Gustavo na versão e no teto, Breno no OS | 2h | domingo 10h |

## 5. O que estava errado na primeira versão

- **"Em outubro, três peças levaram de 2 a 4 s."** Era outra montagem, com o cérebro do Virte e a voz MiniMax. A montagem de hoje nunca foi medida.
- **"Testar o Gemini junto com o lembrete de silêncio."** A Agora não aplica o lembrete de silêncio ao Gemini, e o foco na voz também não vale nesse modo.
- **"A Dona Leda para de falar sempre que escuta voz por cima."** Em parte. O risco maior é a voz de fundo entrar como fala da idosa: ela responde ao que outra pessoa disse e pode criar aviso falso no painel.
- **"Ligar o foco na voz leva 30 minutos."** O time já ligou às 13h29, no modo de três peças. É recurso Beta e trava na primeira voz alta e clara da ligação, então quem apresenta não pode falar perto do celular antes da idosa. O filtro de ruído ligado no mesmo envio provavelmente não roda no navegador do celular: o código confere se o aparelho aceita e desliga sem avisar.
- **"A interrupção acontece com 240 ms."** Enquanto ela fala, vale o padrão de 160 ms, e os 240 ms valem pra outro momento. No Gemini, a sensibilidade está no máximo.
- **"O preço precisa passar de R$ 100."** Errado. Ver seção 6.
- **"Os idosos foram 16% das vítimas de golpe (Febraban)."** A fonte é o DataSenado.
- **"O CareCall está em mais de 100 prefeituras."** São 128 de 229 municípios em setembro de 2024, e ele liga uma ou duas vezes por semana.
- **"Meela, Callie e CareCall ligam todo dia."** A Meela parou com a ligação de companhia. Ligam todo dia a Callie Care, a Joy Calls, a ElderVoice e a AloneAssist.
- **"Nenhum concorrente faz checagem de golpe."** A NTT, no Japão, desde 2020, e a SK Telecom, na Coreia, desde abril de 2026, avisam a família durante a ligação do golpista. O que a pesquisa não achou foi uma assistente de companhia que liga pro idoso e conversa com ele sobre golpe.
- **"No CareCall, o número que importa é quem atende de novo."** O estudo só publicou que 11,2% nunca atenderam. A régua que dá pra medir até domingo é a da primeira ligação e a da segunda, no domingo de manhã.

## 6. Números pro pitch e pras perguntas

- **Custo por idoso por mês:** a conta que vale é a de `tese.md` ("Quanto custa a conversa e quanto cobrar"), refeita na tarde de 21/11 com o dólar oficial de 19/11 (R$ 5,8889) e o preço do Google por token. Com uma ligação de 5 minutos por dia, ela dá R$ 89 no modo de três peças e perto de R$ 139 no Gemini. A minha estimativa anterior pro Gemini (R$ 100 a 110) ficou baixa. O produto liga duas vezes por dia por padrão (9h e 19h), então a conta precisa dizer quantas ligações cabem no preço.
- **Preço que fecha na tabela da Agora:** de R$ 220 a 250 por mês, com uma ligação de até 5 minutos por dia. A família já paga de R$ 100 a 230 por botão de emergência, e um cuidador custa de R$ 2.800 a 4.500. Com volume, entra o preço de contrato da Agora.
- **A ligação tem teto desde 14h10.** Ela encerra sozinha com 10 minutos (esperando 2 segundos sem ninguém falar, pra não cortar frase, e no máximo 30 segundos a mais) ou com 2 minutos sem o idoso falar. O silêncio conta pela legenda e também pelo microfone, pra ligação não cair se a legenda falhar, e pausa enquanto ela fala. Antes, uma ligação aberta com o idoso longe ficava até 1 hora na sala. As provas estão em `testes/teto.test.ts`.
- **O tempo de resposta agora é medido pela Agora.** Cada ligação guarda, na conversa, o tempo inteiro de cada resposta (`turno.e2e`, média e pior caso) e o de cada peça. Com `?medir=1` no endereço do aparelho, o número aparece na tela durante o teste.
- **Problema:** cerca de 6 milhões de pessoas com 60 anos ou mais moram sozinhas (41% dos 15,6 milhões que moram sozinhos, PNAD Contínua 2025). Golpe: 16% das vítimas de golpe digital em 2024 tinham 60 anos ou mais (DataSenado).
- **Frases que saem do pitch e do repositório:** "ninguém faz aviso de golpe", "mesmo se a IA falhar" (vira "mesmo se a IA esquecer de avisar") e "o produto roda fora da Agora depois do hackathon", que não se diz pra uma banca da Agora.
- **Perguntas que os três jurados fariam:** qual o tempo de resposta e como mediram; quantos idosos usaram e quantos atenderam de novo; quanto custa por idoso e quem paga; e se ela não perceber a queda; quem deixa o aparelho ligado pra uma senhora de 82 anos; isso não é vigiar o idoso; isso não é dispositivo médico. A resposta de cada uma sai dos números acima e das seções de limites do README.

## 7. Defeito antigo que o teto deixou à vista

Uma ligação que atende sozinha com o idoso longe do aparelho conta como conversa. A chamada fica marcada como atendida, a segunda tentativa não acontece, a família não recebe o aviso de que ele não atendeu, e o painel mostra que ele conversou hoje (`lib/chamadas.ts` e `fecharConversa` em `lib/dados.ts`). Agora o teto encerra essa ligação em 2 minutos com zero falas dele, que é o sinal exato de que ninguém estava ali. Conserto: quando a conversa fecha sem nenhuma fala do idoso, o servidor trata como não atendida. Fica com a conversa "Servidor, voz e banco", com prova em `testes/chamadas.test.ts`.

## 8. O modo Gemini, como está às 13h50

- O time pôs o Gemini como modo principal às 13h12, com as três peças de reserva, e a chave já está na Vercel.
- **Nunca rodou de ponta a ponta.** No pacote 2.9.0, o Gemini 3.8 passa por um endereço de teste da Agora, que a versão 2.10.0 trocou pelo endereço normal. A 2.15.0 já leva as ações por MCP no próprio Gemini, sem o remendo que o time escreveu.
- **Desligar pode não tirar a assistente da sala** no 2.9.0, porque o pedido de parada vai pro endereço normal. Ela fica até 2 minutos a mais em cada ligação, cobrando.
- **Se o Gemini falhar, nada troca sozinho** pro modo de três peças, e a tela fica muda.
- **Avatar não funciona junto.** Como o rosto é um desenho, isso custa pouco.
- **O que decide:** a ação 2. Se a saudação não tocar, a ficha não preencher, a legenda não aparecer ou "Eu caí no banheiro" não chegar inteira no aviso, o palco usa as três peças.
