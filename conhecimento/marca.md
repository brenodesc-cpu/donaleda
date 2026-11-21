# A marca da Dona Leda

Atualizado em 21/11/2026. A direção aplicada no app é a **Gema**, escolhida pelo time em 21/11 a partir do brand book. As quatro direções estão lado a lado em `/marca`, e a troca é uma linha em `components/marca/direcoes.ts`.

## 1. Quem ela é e como fala

A Dona Leda é a assistente de cuidado de quem envelhece: companhia e apoio no dia a dia, com segurança, saúde, comunicação e rotina. A assinatura da marca é "Dona Leda: longevidade com qualidade de vida." A narrativa inteira está em `conhecimento/proposta-de-valor.md`.

Desde 21/11, à noite, a frase do Breno usa "assistente de cuidado", no lugar de "camada de cuidado" e de "amiga". No produto ela liga todo dia pro idoso que mora sozinho, tem nome de gente e rosto de desenho, e se apresenta sempre como assistente virtual: "Oi, aqui é a Dona Leda, a assistente que a sua filha contratou."

- Fala devagar, em frases curtas, uma pergunta de cada vez.
- Trata por "a senhora" e "o senhor", com carinho e sem infantilizar.
- Lembra do que ouviu (o neto, a consulta, o joelho) e puxa a família pra perto.
- Nunca finge ser parente, médica ou banco, e nunca pede dinheiro, senha ou código.

"Leda" é a forma antiga de "alegre" em português, a mesma de "ledo engano".

## 2. A voz

A voz aqui é literal: é o som que o idoso ouve. Ela precisa de sotaque brasileiro, voz feminina madura, ritmo calmo e pausas longas antes de responder (hoje a assistente espera 650 milissegundos de silêncio). A voz grátis da Agora (`openai:nova`) é brasileira, mas soa robótica. A próxima candidata é uma voz brasileira da ElevenLabs, trocada pela variável `LIA_VOZ`.

## 3. Logo e nome escrito

- O nome se escreve **Dona Leda**, com as duas iniciais maiúsculas.
- O símbolo é o disco de um telefone antigo, amarelo, com o rosto da Dona Leda no miolo: dez furos, um a cada 30 graus, e a trava do dedo embaixo à direita. Quem tem mais de 70 anos discou a vida inteira num telefone desses.
- O nome escrito vai em **Gabarito** extrabold, na cor Café.
- Arquivos: `public/marca/logo-gema.svg`, `public/marca/simbolo-gema.svg` e os das outras três direções na mesma pasta.
- Ícone do site e favicons: `node recursos/marca/gerar-icones.mjs` (a Gema é o padrão). Ícone e tela de abertura do iPhone e do Android: `node recursos/marca/gerar-app-nativo.mjs`, depois do anterior.
- No ícone, o disco amarelo vai sobre Café. Na tela de abertura, o disco e o nome vão sobre Casca.

## 4. Paleta

Contraste conferido pela regra de acessibilidade da web (WCAG 2), pedindo 7 pra 1 no texto principal e 4,5 pra 1 no resto. Nenhuma direção depende de azul claro, que o olho envelhecido distingue mal. A conta está em `recursos/marca/paletas.py`, que reprova qualquer par abaixo do mínimo.

| Uso | Gema | Contraste |
|---|---|---|
| Texto principal (Café no fundo Casca) | `#33200F` em `#FFF8E8` | 14,7 : 1 |
| Texto secundário (Canela) | `#6A4628` em `#FFF8E8` | 7,9 : 1 |
| Botão principal (Café) | `#FFF8E8` em `#33200F` | 14,7 : 1 |
| Botão Atender (verde) | branco em `#1B7A3D` | 5,4 : 1 |
| Botão Encerrar e aviso urgente (Goiabada) | branco em `#B03A22` | 6,0 : 1 |
| Destaque (Gema, amarelo) | `#33200F` em `#F7B90F` | 8,8 : 1 |
| Aviso de atenção (Manteiga) | `#7A4E00` em `#FDEBB5` | 6,1 : 1 |

O amarelo da Gema (`#F7B90F`) nunca é cor de letra nem de traço fino: no fundo Casca ele dá 1,7 : 1. Ele fica no disco, no ícone e em destaque grande.

As outras três direções passam nos mesmos pares. Os números de cada uma aparecem em `/marca`.

## 5. Tipografia

**Gabarito** nos títulos, nos botões grandes e no nome escrito, e **Atkinson Hyperlegible Next** no resto do texto. A Atkinson, do Google Fonts, foi feita pelo Braille Institute pra quem enxerga pouco: cada letra tem um desenho que não se confunde com outra (o "I" maiúsculo, o "l" e o "1" são diferentes).

- Tela do idoso: texto de pelo menos 18 pixels, legenda da fala de 24 ou mais, botões de 24.
- Painel da família: texto de 16 pixels pra cima, títulos de 24 a 30.
- A pessoa sempre pode dar zoom na tela.

## 6. A tela de ligação

Quando a Dona Leda liga, o aparelho do idoso mostra o disco grande, que gira e volta como quem disca, "Dona Leda está ligando", "Sua assistente virtual" e um botão verde grande escrito **Atender**, com 112 pixels de altura. Embaixo, um botão discreto "Agora não", com 80. O verde é o mesmo de qualquer ligação de celular, porque o idoso já sabe o que ele quer dizer, e é a única coisa verde da tela.

## 7. As duas caras do app

- **A do idoso:** um botão por tela, letra grande, nenhuma palavra técnica. O disco da Dona Leda ocupa o meio da tela: a boca mexe quando ela fala, um anel de Manteiga aparece quando ela ouve e os furos acendem um por um quando ela pensa.
- **A da família:** o resumo do dia em blocos coloridos (verde pro que vai bem, Manteiga pro que pede atenção), a semana em uma tabela e os avisos no topo. O aviso urgente é Goiabada cheia; o de atenção, Manteiga com contorno Café. Vermelho aparece só no urgente, e a cor só aparece onde ajuda a decidir.

## As quatro direções

| Direção | Como é | Fonte |
|---|---|---|
| Gema (aplicada) | Amarelo de gema e marrom de café, com o disco do telefone antigo no lugar do rosto | Gabarito no título e Atkinson Hyperlegible Next no texto |
| Varanda | Terracota, creme e mostarda, com traço de desenho à mão | Atkinson Hyperlegible Next |
| Rádio | Preto e amarelo de letreiro, formas grossas e cantos retos | Lexend |
| Jardim | Verde de folha e coral, formas redondas sem contorno | Nunito |

A Gema ficou aplicada porque quem tem mais de 70 anos discou a vida inteira num telefone de disco, e o amarelo com marrom fica longe do azul e do verde de clínica dos apps de saúde. O botão de atender fica sendo o único verde da tela, e o texto continua na fonte feita pra quem enxerga pouco. O brand book completo da Gema, com voz, regras de honestidade e as telas, foi aprovado pelo time em 21/11.
