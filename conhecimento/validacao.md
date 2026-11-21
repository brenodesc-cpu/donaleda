# Validação com idosos

Kit das ligações de 21/11/2026, das 20h às 23h. A validação vale 10% da nota: a banca quer teste com gente, o que aprendemos, os limites e os próximos passos. A pergunta desta noite é se o idoso atende a Dona Leda e conversa com ela. A de domingo às 9h é se ele atende de novo, sem ninguém pedir.

**Este repositório é público.** Aqui entram só código (A1, A2...), faixa de idade e números. Nome, telefone, cidade e gravação nunca entram. Os resultados com nome ficam fora do GitHub, com o Breno.

## Quem participa

- Avó, avô ou outra pessoa com 65 anos ou mais, de preferência quem mora sozinho ou passa o dia sozinho.
- Com o sim da própria pessoa e de alguém da família.
- Fica de fora quem não consegue entender o pedido de permissão, ou quem está passando mal hoje.
- Meta de cinco pessoas, mínimo de três. Até 19h30, cada pessoa do time diz pra quem vai ligar e recebe um código (A1, A2...).

## Como a ligação chega no idoso

Os avós usam o modo de três peças, o padrão do servidor. Ninguém abre `?modo=gemini` no celular do idoso.

O idoso nunca faz login. Quem faz é a pessoa do time, no celular dela:

1. Em https://donaleda.vercel.app, toque em "Sou da família", crie a conta e cadastre o idoso.
2. Em "Aparelho", toque em "Mandar o link pra" o idoso. Sai pelo WhatsApp um link que vale 30 minutos.
3. No celular do idoso, alguém abre o link. O celular fica pronto sozinho, sem digitar nada. Se o link não abrir: entre em donaleda.vercel.app no celular dele, toque em "Este aparelho vai receber as ligações" ("Vou digitar o código que a família mandou") e digite os 6 números que aparecem em "Aparelho".
4. Deixe a página aberta, com a tela acesa e o volume alto, e o celular apoiado.
5. No painel, toque em "Ligar agora". Na primeira ligação o idoso toca em Atender e alguém toca em "Permitir" quando o celular pedir microfone e câmera.

**Do jeito recomendado**, alguém da família fica ao lado do idoso, faz os passos 3 e 4 e o "Permitir", e depois se afasta, deixando o idoso só atender. É assim que o produto funciona de verdade: a família instala e o idoso atende.

**Sem ninguém do lado**, só tente com quem usa WhatsApp sozinho. Guie por telefone, desligue antes de a Dona Leda ligar (o celular não usa o microfone em duas ligações ao mesmo tempo) e anote em que passo travou.

## 1. O pedido de permissão (pra ser falado)

**Pra família** (o pai, a mãe ou quem cuida):

> Oi! Estou num hackathon, uma competição de programação, e o meu time fez a Dona Leda, uma assistente virtual que liga todo dia por vídeo pro idoso pra fazer companhia e ajudar a cuidar do dia a dia dele. Ela pergunta como ele está e avisa a família quando algo não vai bem. Queria testar com a vó hoje, uns cinco a dez minutos. A vó vai saber que é um programa de computador. A gente não grava a conversa, só anota o que ela contar de como está, e apaga tudo depois do hackathon. Você topa? Consegue ficar do lado dela?

**Pro idoso** (quem acompanha fala, antes de ligar):

> Vó, o meu time fez uma assistente virtual, a Dona Leda. É um programa de computador que liga por vídeo pra fazer companhia e ajudar a senhora no dia a dia. Hoje ela vai perguntar como a senhora está, se dormiu bem, se comeu. Dura uns cinco minutos, e a senhora pode parar quando quiser, é só dar tchau. Ninguém vai gravar. A senhora deixa eu testar com a senhora?

Só siga com um sim claro. Se a pessoa hesitar, agradeça e não ligue.

**Gravar a tela** (só se o time quiser usar no vídeo do pitch): é um pedido à parte, pra família e pro idoso. "Posso gravar a tela pra mostrar pros jurados?" Sem esse segundo sim, não grava. A gravação nunca entra neste repositório.

## 2. Roteiro de quem acompanha

**Antes (10 minutos)**
1. No painel da família, que você abre no seu celular ou computador (donaleda.vercel.app, "Sou da família"), cadastre o idoso do jeito que ele é chamado ("Dona Maria", "Seu João") e quem contratou ("a neta Ana"). A Dona Leda usa isso na primeira frase.
2. Deixe "atender sozinho" desligado: na primeira ligação o celular pode bloquear som e microfone sem um toque na tela.
3. Faça uma ligação de teste com você mesmo.
4. Faça o pedido de permissão.

**Durante**
5. Toque em "Ligar agora" no painel e dispare o cronômetro quando ele atender.
6. Não ajude e não sopre resposta. Só entre se ele travar por mais de 15 segundos ou pedir ajuda, e anote em que momento.
7. Anote na hora o que confundiu: palavra que ele não entendeu, pergunta repetida, hora em que ela demorou ou cortou a fala dele.
8. Se ele contar algo sério de verdade (queda, dor no peito, golpe), pare o teste e resolva com a família na hora. Em emergência, 192. A Dona Leda é um protótipo e não substitui ninguém.
9. Pare o cronômetro quando a ligação acabar.

**Depois (2 minutos com o idoso, 1 com a família)**
- "O que a senhora achou de conversar com ela?"
- "Teve alguma hora em que a senhora não entendeu?"
- "Se ela ligasse amanhã nesse horário, a senhora atendia?" (sim, talvez, não)
- Pra família: "Você colocaria isso pra ela todo dia? Por quê?" (sim, talvez, não)
- Pra família: "Quanto você pagaria por mês por isso?" Anote o número que a pessoa disser, sem sugerir valor.
- Pros dois: "Posso pedir pra Dona Leda ligar de novo amanhã, domingo, às 9h?" Só marque com o sim dos dois.

**Domingo às 9h (a segunda ligação)**
- A ligação das 9h já vem marcada no app (é o horário padrão; confira em `/familia/ajustes`).
- Às 8h50, alguém da família abre donaleda.vercel.app de novo no celular do idoso, no mesmo navegador de sábado, e deixa a tela acesa. O celular continua ligado e abre direto a tela dele, sem link novo. Quem abre não pede pro idoso atender: só deixa o celular pronto.
- Se não tocar até 9h05, quem ligou no sábado toca em "Ligar agora" no painel.
- Anote se ele atendeu, os minutos e se a Dona Leda lembrou de alguma coisa da conversa de sábado.

## 3. A planilha

A Stephanie preenche uma linha por idoso. Os combinados pra contar igual:
- **Atendeu:** "sim" quando ele atendeu e falou pelo menos uma frase com ela. "Não" quando tocou e ele não atendeu. "Não chegou" quando a ligação nem tocou por falha nossa; essa linha sai da conta de quem atendeu e entra nos limites.
- **Minutos:** do atender ao tchau, no cronômetro.
- **Precisou de ajuda:** em que passo (abrir, código, microfone, atender, durante a conversa).

| Código | Idade | Mora sozinho? | Atendeu? | Minutos | Precisou de ajuda? Onde | Atenderia amanhã? | O que confundiu | O que gostou | Família usaria? | Pagaria por mês (R$) | Domingo 9h: atendeu? | Domingo: minutos | Domingo: ela lembrou? | Falha técnica |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A1 | | | | | | | | | | | | | | |
| A2 | | | | | | | | | | | | | | |
| A3 | | | | | | | | | | | | | | |
| A4 | | | | | | | | | | | | | | |
| A5 | | | | | | | | | | | | | | |

Pra colar numa planilha:

```
Código,Idade,Mora sozinho?,Atendeu?,Minutos,Precisou de ajuda? Onde,Atenderia amanhã?,O que confundiu,O que gostou,Família usaria?,Pagaria por mês (R$),Domingo 9h: atendeu?,Domingo: minutos,Domingo: ela lembrou?,Falha técnica
```

## 4. O que vai pro pitch

- Quantos idosos participaram e a faixa de idade.
- Quantos atenderam, de quantas ligações que chegaram.
- Os minutos médios de conversa.
- Quantos disseram que atenderiam no domingo e quantos atenderam de verdade às 9h.
- Quantas famílias usariam e o valor do meio entre os que elas disseram que pagariam por mês.
- O que aprendemos, em duas ou três frases tiradas do que confundiu e do que gostou.
- Os limites: poucas pessoas, avós de quem estava no evento, duas ligações no máximo e alguém da família do lado.

## Compromissos com quem participou

- Nada é gravado sem o segundo sim.
- Quem cadastrou o idoso apaga tudo dele a qualquer hora, em `/familia/ajustes`, no fim da página, em "Apagar os dados" (ficha, lembranças, avisos e o celular ligado a ele). O que sobrar, quem cuida do servidor apaga até 23/11/2026.

## Resultados

_Preencher depois das ligações, sem nome._
