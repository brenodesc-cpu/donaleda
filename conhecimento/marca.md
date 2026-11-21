# A marca da Dona Leda

Atualizado em 21/11/2026. A direção aplicada no app é a **Varanda**. As três direções estão lado a lado em `/marca`, e a troca é uma linha em `components/marca/direcoes.ts`.

## 1. Quem ela é e como fala

A Dona Leda é a camada de cuidado de quem envelhece: uma amiga que traz companhia e apoia com necessidades do dia a dia, como segurança, saúde, comunicação e rotina. A assinatura da marca é "Dona Leda: longevidade com qualidade de vida." A narrativa inteira está em `conhecimento/proposta-de-valor.md`.

"Amiga" é a palavra do pitch. No produto ela liga todo dia pro idoso que mora sozinho, tem nome de gente e rosto de desenho, e se apresenta sempre como assistente virtual: "Oi, aqui é a Dona Leda, a assistente que a sua filha contratou."

- Fala devagar, em frases curtas, uma pergunta de cada vez.
- Trata por "a senhora" e "o senhor", com carinho e sem infantilizar.
- Lembra do que ouviu (o neto, a consulta, o joelho) e puxa a família pra perto.
- Nunca finge ser parente, médica ou banco, e nunca pede dinheiro, senha ou código.

"Leda" é a forma antiga de "alegre" em português, a mesma de "ledo engano".

## 2. A voz

A voz aqui é literal: é o som que o idoso ouve. Ela precisa de sotaque brasileiro, voz feminina madura, ritmo calmo e pausas longas antes de responder (hoje a assistente espera 650 milissegundos de silêncio). A voz grátis da Agora (`openai:nova`) é brasileira, mas soa robótica. A próxima candidata é uma voz brasileira da ElevenLabs, trocada pela variável `LIA_VOZ`.

## 3. Logo e nome escrito

- O nome se escreve **Dona Leda**, com as duas iniciais maiúsculas.
- O símbolo é um balão de conversa com um coque em cima e um sorriso: uma senhora que conversa.
- Arquivos: `public/marca/logo-varanda.svg`, `public/marca/simbolo-varanda.svg` e os das outras duas direções na mesma pasta.
- Ícone do app: `recursos/marca/icone-1024.png` (1024 por 1024, sem transparência). Pra gerar de novo: `node recursos/marca/gerar-icones.mjs varanda`.

## 4. Paleta

Contraste conferido pela regra de acessibilidade da web (WCAG 2), pedindo 7 pra 1 no texto principal e 4,5 pra 1 no resto. Nenhuma direção depende de azul claro, que o olho envelhecido distingue mal. A conta está em `recursos/marca/paletas.py`, que reprova qualquer par abaixo do mínimo.

| Uso | Varanda | Contraste |
|---|---|---|
| Texto principal no fundo creme | `#2B1D14` em `#FBF5EC` | 15,0 : 1 |
| Texto secundário | `#5A4636` em `#FBF5EC` | 8,2 : 1 |
| Botão principal (terracota) | branco em `#9E3F1D` | 6,6 : 1 |
| Botão Atender (verde) | branco em `#2D6A39` | 6,5 : 1 |
| Botão Encerrar e aviso urgente | branco em `#AE2A1F` | 6,7 : 1 |
| Destaque (mostarda) | `#2B1D14` em `#E2A23B` | 7,3 : 1 |
| Aviso de atenção | `#7F5100` em `#FBEBC8` | 5,8 : 1 |

As outras duas direções passam nos mesmos pares. Os números de cada uma aparecem em `/marca`.

## 5. Tipografia

**Atkinson Hyperlegible Next**, do Google Fonts, feita pelo Braille Institute pra quem enxerga pouco: cada letra tem um desenho que não se confunde com outra (o "I" maiúsculo, o "l" e o "1" são diferentes).

- Tela do idoso: texto de pelo menos 18 pixels, legenda da fala de 24 ou mais, botões de 24.
- Painel da família: texto de 16 pixels pra cima, títulos de 24 a 30.
- A pessoa sempre pode dar zoom na tela.

## 6. A tela de ligação

Quando a Dona Leda liga, o aparelho do idoso mostra o rosto grande dela, o nome, "está te ligando" e um botão verde grande escrito **Atender**, com 80 pixels de altura. Embaixo, um botão discreto "Agora não". O verde é o mesmo de qualquer ligação de celular, porque o idoso já sabe o que ele quer dizer.

## 7. As duas caras do app

- **A do idoso:** um botão por tela, letra grande, nenhuma palavra técnica. O rosto da Dona Leda ocupa o meio da tela e mexe a boca quando ela fala.
- **A da família:** o resumo do dia em blocos coloridos (verde pro que vai bem, âmbar pro que pede atenção, vermelho pro urgente), a semana em uma tabela e os avisos no topo. A cor só aparece onde ajuda a decidir.

## As três direções

| Direção | Como é | Fonte |
|---|---|---|
| Varanda (aplicada) | Terracota, creme e mostarda, com traço de desenho à mão | Atkinson Hyperlegible Next |
| Rádio | Preto e amarelo de letreiro, formas grossas e cantos retos | Lexend |
| Jardim | Verde de folha e coral, formas redondas sem contorno | Nunito |

A Varanda ficou aplicada porque tem cara de casa e de companhia. Os apps de saúde usam azul e verde de clínica, e a Dona Leda leva cuidado de todo dia pra quem envelhece em casa. Ela também usa a fonte feita pra quem enxerga pouco.
