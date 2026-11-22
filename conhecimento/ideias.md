# Ideias novas

Ideias e conselhos que chegaram depois da tese. Nada aqui está decidido: o que virar decisão passa pra `decisoes.md`.

## Retorno de um mentor do evento (21/11/2026)

### 1. O idoso não deveria precisar clicar

Virou decisão em 21/11: a assistente liga, e a ligação pode atender sozinha. Ver `decisoes.md`.

O mentor disse que celular é difícil pra idoso e que um senhor de 100 anos não vai tocar em botão nenhum. A sugestão dele: o aparelho liga e a assistente já começa a conversa sozinha.

O que isso muda na nossa versão de hoje, que pede um toque em "Conversar":

- **Modo que começa sozinho.** A tela abre e a assistente já cumprimenta, pra um tablet que fica ligado em cima da mesa. O navegador só solta som e microfone sem toque depois que alguém deu a permissão uma vez, então quem faz isso é o filho, no dia da instalação.
- **A assistente chama na hora combinada.** A tela toca como uma ligação e o idoso só atende.
- **Dois ou três botões, no máximo.** Hoje a tela tem um.

### 2. Aparelho próprio fica pra segunda fase

O mentor perguntou como a gente responde à falta de um aparelho. A resposta que ele mesmo sugeriu serve pro pitch: a gente constrói a companhia agora, no celular ou tablet que a família já tem, e o aparelho próprio vem na segunda fase.

Formatos que ele citou pro aparelho:

- uma telinha de mesa mostrando a assistente em vídeo;
- um robô pequeno com holograma, como os que estão sendo feitos na China. Ele disse que tem um projeto desses desenhado.

Pra referência, o ElliQ é um robô de mesa que conversa com idosos. O estado de Nova York deu o aparelho de graça pra mais de 900 idosos e renovou o contrato em outubro de 2026.

### 3. Conferir a lei pra idoso

O mentor disse que, pra criança, um robô que guarda informações esbarra no Estatuto da Criança e do Adolescente, e que pra idoso ele não achou nenhuma regra parecida. Falta conferir.

O que a gente já sabe, sem ter falado com advogado:

- A LGPD trata dado de saúde como dado sensível, pra qualquer idade. Isso pede consentimento destacado do próprio idoso.
- Existe o Estatuto da Pessoa Idosa (Lei 10.741, de 2003). Falta ler o que ele diz sobre isso.
- O Código de Defesa do Consumidor proíbe se aproveitar da idade do consumidor pra vender.

A nossa versão já guarda pouco: a ficha do dia, as lembranças, os avisos e o resumo, sem a conversa inteira.

### 4. Passar a ligação pra uma pessoa na hora da urgência

Ideia do time em 21/11: quando surgir uma necessidade urgente, a assistente conecta o idoso na hora com uma pessoa responsável. O time considera isso obrigatório no produto.

Falta decidir quem atende:

- **Alguém de confiança do idoso** (o filho, um vizinho). Mais simples: a família cadastra um ou dois contatos, e a assistente chama o primeiro que atender, na mesma chamada.
- **Um cuidador de plantão**, em parceria com uma empresa de cuidadores. Cobre a madrugada e o filho que não atende, mas depende de contrato.

Hoje a assistente avisa a família pelo painel e manda ligar pro 192. O passo seguinte é pôr o familiar dentro da mesma chamada da Agora, com voz e vídeo.

Virou decisão em 21/11, à tarde: quem entra é a família, pelo painel (ver `decisoes.md`). O desenho foi passado à conversa "Servidor, voz e banco", que constrói. Em uma frase: num aviso urgente durante a ligação, ou quando a pessoa pede, o painel ganha o botão "Entrar na ligação"; a Dona Leda diz à pessoa, com frase fixa, que avisou a filha e que ela entra se puder; quando a filha entra, a Dona Leda anuncia e sai da sala; se ninguém entra em 90 segundos, ela diz que o aviso ficou com a filha e lembra do 192. Nenhuma frase promete que alguém está a caminho.

## Conversa com mentores da tarde (21/11/2026)

Uns 15 minutos com mentores do evento. A transcrição não traz os nomes. Um deles tentou fazer, oito anos atrás, um relógio de ajuda com o Pebble.

O que eles levantaram:

- Muito idoso não gosta de celular nem de computador e atende ligação sem problema ("meu pai é engenheiro e não gosta de celular, mas ligação pra ele é tranquilo").
- A banca vai perguntar de hardware e vai olhar como o time usa a Agora de um jeito diferente. O conselho foi focar no principal e em como escala.
- Outro time ouviu a tese e decidiu fazer a mesma coisa. Falta um diferencial claro.
- Alguém pode se passar pela Dona Leda. Pensar numa verificação na primeira conversa.

Seis opções foram comparadas pelo que mudam pro idoso, pelo peso na nota e pelo prazo de 12h de domingo. O Breno escolheu mostrar a família entrando na ligação (item 4). As três abaixo ficam como próximos passos no pitch.

### 5. Ligar pro telefone comum, com a palavra da família

- **O que é:** a Dona Leda liga pro telefone fixo ou celular comum do idoso, sem app, e fala no começo de toda ligação uma palavra que a família escolheu no cadastro. Assim ele sabe que é ela antes de conversar.
- **A Agora faz isso:** o endpoint de ligação dela (`POST /api/conversational-ai-agent/v2/projects/{appid}/call`) disca um número e aceita a mesma configuração da assistente que o app já manda. O número sai de uma linha de telefone pela internet (tronco SIP) da Twilio, o único provedor que a página da Agora cita, e o Brasil (+55) está entre os países atendidos. Fontes: docs.agora.io, páginas de telefonia e de SIP trunk, lidas em 21/11.
- **Por que escala:** os maiores números lá fora estão no telefone que o idoso já tem (CareCall, 30 mil idosos na Coreia) e no botão simples (Medical Guardian, 600 mil famílias). Aparelho próprio de conversa fica em 14 mil (Komp e Hyodol). Ver `concorrentes.md`.
- **Por que a palavra:** 16% das vítimas de golpe digital em 2024 tinham 60 anos ou mais (DataSenado), e uma ligação de número desconhecido é o caminho do golpista.
- **O que falta:** conta paga na Twilio (preço do número e do minuto pro Brasil não conferido); número brasileiro, que pede documento da empresa; e levar as regras fixas de segurança pro servidor, porque pelo telefone não tem navegador mandando as falas. O Gemini Live pelo telefone não foi confirmado. Umas 3 a 4 horas de código.

### 6. Pulseira de queda

- O mentor citou um acelerômetro de uns R$ 20 que percebe a queda e avisa. Montar em 24h é difícil, nas palavras dele.
- Na Dona Leda, a pulseira só dispara a ligação: percebe o tombo, e a Dona Leda liga na hora pra perguntar como a pessoa está.
- No Brasil já vendem pulseira de queda com central: TeleHelp, Tecnosenior, VitalisTec (R$ 99,90 por mês) e Helpbox. Ver `concorrentes.md`.
- O acelerômetro do próprio celular faz a mesma cena sem peça, declarando que ele faz o papel da pulseira. Só funciona com o app aberto, a tela ligada e o celular no corpo, e o idoso que não gosta de celular não anda com ele. No iPhone, o sensor pede um toque pra liberar.
- Relógio no estilo do Pebble, que o mentor citou, fica no mesmo lugar da pulseira.

### 7. Caixinha de voz com ESP32

- A Agora publica um exemplo oficial de conversa por voz em ESP32 (a placa barata com Wi-Fi que o mentor citou): `github.com/AgoraIO-Conversational-AI/esp32-client`, licença MIT, pras placas Seeed ReSpeaker XVF3800 com XIAO ESP32-S3 e Espressif ESP32-S3-Korvo-2 V3. O guia da Seeed foi atualizado em 04/02/2026.
- No exemplo, a conversa começa quando a pessoa aperta um botão da placa. Na Dona Leda, ela teria que começar sozinha, na hora marcada.
- A placa da Seeed custa US$ 54,50 lá fora, sem frete nem imposto. Em 21/11 nenhuma loja no Brasil apareceu vendendo. O kit de aparelho da própria Agora (placa R1, chip BK7258) não diz onde comprar.
- Jibo, Moxie, Anki e Mabu fecharam. Pela pesquisa em `concorrentes.md`, fabricar aparelho antes de provar seis meses de uso é o erro a evitar.

### Hardware, na hora das perguntas da banca

A Dona Leda começa pelo aparelho que o idoso ou o residencial já tem, e o telefone comum vem logo depois. A pulseira e a caixinha entram quando o residencial pedir, e só disparam a ligação, porque a conversa, a ficha e o aviso já existem. A caixinha roda no exemplo de ESP32 que a própria Agora publica.

## Próximo passo fora do hackathon (21/11/2026)

### 8. Reconhecer de verdade a voz do idoso

Desde 21/11, quando a voz claramente não combina com a ficha, a Dona Leda pergunta uma vez com quem está falando. Se for outra pessoa, ela não conta nada da vida do idoso nem anota as respostas. Ela não guarda a voz de ninguém. O passo seguinte seria comparar a voz de quem atende com uma amostra gravada do próprio idoso.

Ficou fora agora por três motivos:

- **Pede um serviço a mais junto da ligação.** A comparação de voz roda à parte da conversa, com outro fornecedor, outro custo e mais um ponto que pode falhar no meio da ligação.
- **Erra com voz rouca e com gravação.** Gripe, rouquidão e a idade mudam a voz, e uma gravação tocada perto do microfone pode passar pela pessoa. Um idoso gripado barrado na própria ligação é pior do que a falha que se quer evitar.
- **A impressão de voz é dado biométrico.** A lei de proteção de dados (LGPD, art. 5º, II) trata dado biométrico como dado pessoal sensível, e o uso dele pede o consentimento próprio do idoso, específico e destacado (art. 11, I). A autorização da família não basta.

## Como usar isso no pitch

Na parte de limites e próximos passos, que vale 10% da nota: o toque no botão é o limite de hoje, e o aparelho próprio é a segunda fase.

Nota de 21/11/2026: depois desta conversa, a assistente passou a ligar pro idoso, e a ligação pode atender sozinha se a família ligar essa opção (ver `decisoes.md`). Na demonstração, o pitch vende a camada de cuidado inteira e mostra a parte que já funciona: a ligação diária, com a ficha e os avisos (ver `proposta-de-valor.md`).
