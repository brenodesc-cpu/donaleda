# Verificação contra o regulamento

Conferido em 21/11/2026, às 13h20, sem mexer no código. Fontes: o regulamento de 17/11 (newhack.vc/hackathon/agora/regulamento, lido de novo hoje), o código na gravação `6bf287a`, o site donaleda.vercel.app aberto no Chrome, a documentação da Agora sobre o Gemini Live e as notas desta pasta.

## Resumo

- **Nota provável hoje: 3,2 de 5.** Com as cinco ações da seção 3 feitas, perto de 4,4.
- **Nenhuma regra que elimina está quebrada hoje.** Seis ainda dependem de entrega ou de conferência até 12h de domingo, e a mais arriscada é o README, que não ensina a rodar o app de agora.
- **O que separa a gente do primeiro lugar** é provar a conversa com número (tempo de resposta e interrupção medidos) e mostrar, ao vivo, o aviso de queda chegando no painel da família em segundos. Voz e parte técnica valem metade da nota e são os dois primeiros critérios de desempate.

## 1. Regras que eliminam

Fonte: itens 3, 5.1 e 5.5 do regulamento. A organização confere tudo isto antes da classificação final.

| # | Regra | Situação | Prova | O que falta |
|---:|---|---|---|---|
| 1 | Time de 3 a 5 pessoas inscritas, aprovadas e presentes nos dois dias | Falta conferir | Quatro pessoas em `time.md` | Abrir o OS e ver os quatro como aprovados e confirmados. Breno, 5 minutos |
| 2 | Uso da Agora funcionando e demonstrado | Cumpre no código, falta conferir no ar | `app/api/invite-agent/route.ts` usa sala de áudio (RTC), o motor de conversa, o canal de mensagens (RTM) e as ações por MCP. Primeira conversa às 12h02 | Uma conversa por voz em donaleda.vercel.app num celular de verdade, que ainda não aconteceu |
| 3 | Descrição no OS (problema, público, solução, uso da Agora) | Não cumpre ainda | | Escrever e cadastrar |
| 4 | Slides, até 10 | Não cumpre ainda | | Montar. Sem logo de parceiro sem permissão (linha 9) |
| 5 | Vídeo narrado de até 2 minutos, com conversa real e a Agora funcionando, em link que a banca abre | Não cumpre ainda | | Gravar no sábado à noite. YouTube não listado serve |
| 6 | Repositório público com README: como rodar, dependências e versão | Cumpre em parte | Público, versão 0.1.0 e dependências listadas | O "como rodar" não fala do banco (Supabase), então quem seguir o passo a passo não abre o painel. O README ainda chama a assistente de Lia, diz que os dados ficam num arquivo local, que não tem login e que ela espera 900 ms, quando o código usa 650 |
| 7 | Separar o que já existia do que foi feito no hackathon | Cumpre | A primeira gravação é o projeto de partida da Agora, e o README tem a seção | Pôr na lista o banco, o login, o código do aparelho e os apps de iPhone e Android |
| 8 | Respeitar licenças | Cumpre | `LICENSE` (MIT) do projeto da Agora mantido | |
| 9 | Nada de chave, dado pessoal, material confidencial ou de terceiro sem permissão | Cumpre hoje | As 21 gravações conferidas sem chave. `.env.local`, `dados/` e `.vercel` ficam fora do GitHub, e o exemplo de variáveis vai vazio | Repetir a conferência antes de entregar. Nome de avó, telefone e gravação nunca entram. A marca do Terça da Serra só entra em slide ou vídeo com permissão por escrito deles |
| 10 | Repositório público na entrega e durante a avaliação | Cumpre | GitHub mostra público | Não fechar até o resultado |
| 11 | Simulação declarada | Cumpre | README, seção "O que é simulação". O painel marca "dados de exemplo" | Dizer no vídeo e no pitch quando a dona Helena aparece |
| 12 | Tudo entregue até 12h de 22/11, horário de Brasília | Pendente | | Enviar até 11h, com uma hora de folga |

Fora das regras que eliminam: a cláusula 11 do regulamento não autoriza clonar a voz nem fazer avatar de ninguém do time. O mesmo cuidado vale pros avós.

## 2. Nota provável por critério

A nota de cada jurado é a média ponderada das seis notas, de 1 a 5.

| Critério | Peso | Hoje | Com as ações | Prova |
|---|---:|---:|---:|---|
| Conversa por voz | 25% | 3 | 4 | Funciona em português, aceita interrupção (240 ms de fala por cima) e espera 650 ms de silêncio. Tem frase de falha ("Só um instante"). Contra: são três peças em fila (Deepgram escuta, OpenAI pensa, voz da OpenAI fala), que em outubro levaram de 2 a 4 s por resposta; a voz `nova` tende a sotaque de fora; calado por 10 s, ela não retoma; e nada foi medido ainda (`teste-de-voz.md` está em branco) |
| Execução técnica e Agora | 25% | 4 | 5 | Usa a Agora inteira: sala de áudio, motor de conversa, canal de mensagens pra legenda e estado, ações por MCP e token. No ar na Vercel, com banco, login, código do aparelho e 37 conferências automáticas. Contra: ninguém conversou por voz no endereço publicado nem em celular de verdade, e queda de conexão só mostra aviso, sem religar |
| Problema e impacto | 20% | 4 | 5 | 6 milhões de idosos moram sozinhos (PNAD 2025), idosos foram 16% das vítimas de golpe digital em 2024 (Febraban) e o CareCall da Coreia está em mais de 100 prefeituras. Contra: a frase de venda ainda não foi aprovada e falta o comprador falando (o Terça da Serra) |
| Inovação | 15% | 3 | 4 | A assistente liga, a ligação atende sozinha, ela lembra do que ouviu e as regras fixas avisam a família mesmo se a IA falhar. Contra: Meela, Callie e CareCall já fazem lá fora, então a novidade é o português e o aviso de golpe, e isso precisa aparecer na demonstração |
| Validação | 10% | 1 | 4 | Nenhum teste com gente ainda. O kit das ligações está pronto em `validacao.md` |
| Apresentação | 5% | 3 | 4 | Pitch, slides e vídeo por fazer |
| **Total** | | **3,25** | **4,45** | |

## 3. As ações que mais sobem a nota

Em ordem de pontos ganhos por hora gasta.

| # | Ação | Sobe | Quem | Tempo | Até |
|---:|---|---|---|---|---|
| 1 | **Rodar o teste da voz** (`teste-de-voz.md`, as dez situações) no endereço publicado, com um celular de verdade, e anotar os tempos. É também a prova da regra 2 | Voz e técnica | Gustavo no código, Breno fazendo o idoso, Stephanie no cronômetro | 40 min | 15h |
| 2 | **Testar o Gemini Live como alternativa** (seção 4) e ligar o lembrete de silêncio da Agora, pra ela perguntar "A senhora ainda está aí?" depois de uns 8 s calada. Decidir pelo número medido, ficando com o modo atual de reserva | Voz e inovação | Gustavo, com a conversa "Servidor, voz e banco" | 1h30 | 18h |
| 3 | **Ligar pra 3 a 5 avós** com o kit de `validacao.md` e fechar quatro números pro pitch: quantos atenderam, minutos médios, quantos atenderiam amanhã e quantas famílias usariam | Validação, de 1 pra 4 | Breno, Vitor e Stephanie na planilha | 3h | 23h |
| 4 | **Gravar o vídeo de 2 minutos** com a cena que vende: o aparelho toca, a idosa atende, interrompe a Dona Leda, conta que caiu e o aviso aparece no painel da família na mesma hora. É a reserva se a internet cair no pitch | Técnica, apresentação e voz | Breno, com a conversa "Pitch, vídeo e slides" | 2h | sábado à noite |
| 5 | **Fechar o que elimina:** README corrigido (nome, banco, login, 650 ms, como rodar), descrição no OS, slides até 10 e o time conferido no OS | Regras 1, 3, 4 e 6 | Gustavo no README, Vitor nos slides e na descrição, Breno no OS | 2h | domingo, 10h |

Duas que ajudam se sobrar tempo:
- **Uma frase do Terça da Serra.** Se o Vitor conseguir dos sócios uma frase sobre usar a Dona Leda nos residenciais, ela vira prova de comprador no slide de problema e na validação. Só com o sim deles pra citar.
- **Ensaiar a demonstração ao vivo três vezes**, com o painel da família na tela do projetor e o celular da idosa ao lado, cronometrando os 2 minutos.

## 4. Trocar a voz pelo Gemini Live

### As peças da conversa

Hoje são três peças em fila: o Deepgram escuta, a OpenAI pensa e a voz da OpenAI fala, e cada passagem soma tempo. No Gemini Live um modelo só escuta, pensa e fala, dentro do mesmo motor de conversa da Agora, então a integração com a Agora continua inteira.

### O que a Agora aceita hoje

Pela documentação lida em 21/11 e pelo pacote `agora-agents` 2.9.0 instalado no projeto:
- O pacote já tem o Gemini Live. Os modelos são `gemini-3.8-live` e `gemini-3.8-live-extended-thinking`, e a lista de vozes tem uma chamada **Leda**.
- **Precisa de chave própria do Google** (AI Studio). As chaves gerenciadas pela Agora não cobrem o Gemini. A chave vai só nas variáveis da Vercel, nunca no repositório.
- **As ações por MCP funcionam** com esse modo, segundo a documentação. A versão 2.9.0 do pacote não manda as ações junto com o Gemini (o campo não existe ali); a 2.15.0, de 19/11, precisa ser conferida, ou o campo entra à mão no pedido.
- **Avatar em vídeo não funciona junto.** O pacote recusa a combinação. Como o plano já é o rosto desenhado, isso custa pouco agora e fecha o caminho do avatar.
- **O ajuste de silêncio muda de lugar.** Ele passa a ir dentro do bloco do Gemini, senão os 650 ms e a interrupção somem sem aviso.
- **A legenda e as regras fixas de segurança dependem da transcrição** da fala do idoso. Ela precisa estar ligada (`transcribeUser` e `transcribeAgent`), senão o aviso de queda e de Pix para de chegar no painel.
- **Custo.** O Google cobra o minuto dele, e a Agora segue cobrando US$ 0,10 por minuto.

### Efeito na nota

Se a resposta cair pra menos de 1,5 s e ela calar em menos de 1 s quando interrompida, a voz sobe de 3 pra 4, e pode chegar a 5 com sotaque brasileiro bom. A opção de a voz mudar de tom pela emoção da pessoa (`affectiveDialog`) ajuda em inovação. A parte técnica fica igual se as ações e a legenda continuarem, e cai se quebrarem. No total, de +0,25 a +0,4 na nota final.

### O que testar

Nesta ordem, e cada item passa ou não passa:
1. Sotaque: três frases com as vozes Leda, Aoede e Kore. Fica a que soar do Brasil.
2. Tempo de resposta em três falas seguidas. Meta: menos de 1,5 s.
3. Interromper no meio da frase dela. Meta: calar em menos de 1 s.
4. Pausa de 1 s no meio da frase do idoso. Ela não pode cortar.
5. A ficha de hoje preenche sono, comida e remédio. Prova de que as ações chegam.
6. Queda e Pix viram aviso no painel. Prova de que a transcrição chega nas regras fixas.
7. A legenda aparece na tela do idoso.
8. Ela se apresenta como assistente virtual na primeira frase.
9. Calado por 10 s, ela retoma com calma.

### Como fazer sem risco

Ligar o Gemini por uma variável, deixando o modo de três peças como reserva. Se o item 5, 6 ou 7 falhar, fica o modo atual. Quem: Gustavo, com a conversa "Servidor, voz e banco". Tempo: 1h pra ligar e 30 min pra testar.

Recomendação: testar até as 18h. A voz vale 25% e é o primeiro desempate, e perder o avatar custa pouco porque o rosto desenhado já é o plano.
