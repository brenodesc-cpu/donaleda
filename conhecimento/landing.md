# A landing page da Dona Leda

Atualizado em 21/11/2026. A página mora em `/landing` e é a página inicial de quem chega sem aparelho ligado. O Breno pediu três direções de famílias diferentes e escolheu a segunda, "Produto em cena", no mesmo dia. Este arquivo é o briefing de quem mexe na página.

## Quem lê e o que a página pede

Desde 21/11/2026 a página fala primeiro com o residencial, por pedido do Breno ("atualiza a landing pra falar com o residencial"), porque a primeira empresa é a rede de residenciais do contato do Vitor (ver `proposta-de-valor.md`, "Por onde a gente começa").

- **O dono e a equipe de um residencial sênior.** É quem compra primeiro, e a página fala com essa pessoa.
- **A banca do hackathon**, no domingo, 22/11, que abre o link depois de ouvir o pitch.
- **A filha ou o filho** de quem mora sozinho, que continua podendo contratar direto e ganha uma parte curta, depois da do residencial.

O botão principal é o "Fale conosco", que abre o WhatsApp com a mensagem do residencial. "Criar a conta da família" leva pra `/entrar` e fica na parte da família e no fim da página.

Ficam de fora da página: o nome da rede de residenciais, preço em reais ou em porcentagem da mensalidade (o valor por morador ainda espera a Stephanie e o Breno) e promessa do que o app ainda não faz. O que falta pro residencial aparece como parte do piloto.

## O que a página diz

A narrativa está aprovada em `proposta-de-valor.md`, na seção "A narrativa aprovada". As quatro frases entram como estão escritas lá: o sonho, a definição, a frase do dinheiro e a assinatura. O resto do texto sai do mesmo arquivo e de `tese.md`, `marca.md`, `validacao.md` e `verificacao.md`.

Blocos que a página precisa ter, na ordem que cada direção achar melhor:

1. **Topo:** o sonho, a definição e o botão.
2. **Como funciona:** a Dona Leda liga por chamada de vídeo na hora marcada, o idoso só atende, e a família vê o resumo do dia e recebe os avisos.
3. **A camada de cuidado:** companhia, segurança, saúde, comunicação e rotina, com o que ela faz hoje em cada uma (tabela "A camada, por dentro").
4. **O dinheiro:** a frase aprovada e a conta do cuidador.
5. **Confiança:** ela sempre diz que é assistente virtual, a conversa inteira não fica guardada, queda e golpe avisam a família por regra fixa, e ela não substitui médico.
6. **Pra residenciais.**
7. **Perguntas frequentes** e o botão de novo.

## Regras do conteúdo

- A página só afirma o que o produto faz hoje. `proposta-de-valor.md` separa o que existe do que vem depois, e na dúvida o código decide.
- Todo número leva a fonte e vem dos arquivos da base. `verificacao.md` tem os números corrigidos.
- Os planos de `tese.md` são proposta e ainda esperam a decisão do time. A página fica sem preço em reais e usa "menos de um décimo do preço de um cuidador".
- Depoimento inventado, foto de pessoa real sem autorização e logo de empresa que não é cliente ficam de fora. Nome de gente da rede de residenciais também.
- Texto em português simples, com frase inteira e sem travessão. A marca fala com carinho e sem infantilizar (ver `marca.md`).

## A direção escolhida: Produto em cena

A página usa a marca Gema de `marca.md`: Café e Casca, o amarelo só em área grande, Gabarito nos títulos, Atkinson Hyperlegible Next no texto e o disco de telefone como símbolo.

- **Topo, em fundo Café:** o sonho, a definição, uma frase pro residencial, o botão "Fale conosco" e um celular desenhado com a tela da ligação tocando. O botão Atender do desenho funciona e leva pra tela da conversa.
- **Pra residenciais sênior, em fundo Manteiga, logo depois do topo:** a tela "Todos os moradores" de verdade, com os oito moradores de exemplo, é a peça principal. Ela vem de `/telas/ver/casa`, a mesma página da `/telas`, com os botões travados. Embaixo, o que a casa leva hoje (uma conversa por dia pra cada morador, a casa inteira numa tela só e notícia pra família) e o que entra no piloto (o acesso da família de cada morador só ao dela e as perguntas ajustadas à rotina da casa).
- **Como funciona, em fundo Café:** cinco passos (ela liga, a pessoa atende, o dia, os avisos, a semana), escritos pra servir à casa e à família ("quem acompanha"). Na tela larga o celular fica parado e troca de tela conforme a pessoa rola. No celular de quem lê, cada passo traz a sua tela.
- **A camada de cuidado:** uma aba por necessidade, com o que ela faz hoje.
- **O dinheiro, em fundo amarelo:** a frase aprovada e duas barras, a do cuidador de 12 horas e a da Dona Leda.
- **Confiança.**
- **Pra família:** curta, com "Criar a conta da família".
- **Perguntas frequentes:** primeiro as do residencial (como começa, quem ajuda o morador na primeira ligação, o que a equipe vê, se a família acompanha), depois as gerais. "Quanto custa?" diz que o valor por morador está sendo definido.
- **Fim:** a assinatura, o "Fale conosco" e "Criar a conta da família".

As telas do celular desenhado repetem os textos das telas reais (`components/ChamadaTocando.tsx`, `components/familia/formatos.ts` e `lib/regras.ts`) e usam a pessoa de exemplo de `lib/exemplo.ts`, com a marca "Exemplo". Quando uma tela real mudar de texto, o desenho em `components/landing/Aparelho.tsx` muda junto.

As outras duas direções ficaram no histórico do repositório, na gravação "Landing page: três direções pra escolha". A Carta era uma página de leitura que contava uma ligação de cima a baixo, e a Conta e prova punha os números do cuidador e do país na frente, com a camada em tabela.

**Na página inicial desde 21/11/2026 (decisão do Breno, "Já agora"):** quem abre `/` sem aparelho ligado a um idoso vê a landing, com dois botões grandes no topo, os mesmos da antiga tela de boas-vindas: "Sou da família", que leva pra `/entrar`, e "Este aparelho vai receber as ligações", que leva pra `/parear`, onde entram os 6 números. Aparelho já ligado continua abrindo direto a tela do idoso, sem passar pela landing. Dentro do app de iPhone e Android, o aparelho sem par continua na tela de boas-vindas, sem landing. Quem decide é `components/Inicio.tsx`, que recebe a landing de `app/page.tsx`. Em `/landing` a página aparece sem esses dois botões.

**Fale conosco pelo WhatsApp (decisão do Breno em 21/11/2026, "Sim, pelo WhatsApp"):** o botão "Fale conosco" fica no topo, ao lado de "Criar a conta da família", e no bloco final. Na seção dos residenciais, "Falar com o time" usa o mesmo caminho. A mensagem já vai escrita: "Olá! Quero conhecer a Dona Leda." Na seção dos residenciais ela termina com "pro meu residencial". O número é o que o Breno mandou em 21/11/2026 e fica fora do repositório, que é público: vem da variável `NEXT_PUBLIC_WHATSAPP_DE_CONTATO`, gravada nas variáveis da Vercel e no `.env.local` de quem roda no computador. Sem a variável, os botões abrem um e-mail pro suporte@virte.com.br com a mesma mensagem. Pra trocar o número, basta mudar a variável e publicar de novo. A prova do endereço está em `testes/landing.test.ts`.

Skills de design instaladas em `~/.claude/skills/`: `ui-ux-pro-max`, `impeccable`, `frontend-design`, `brand`, `design-system`, `theme-factory`, `web-design-guidelines`, `apple-design` e `frontend-project-style`.

## Onde gravar e como publicar

- **Rotas:** `/landing` e a página inicial `/` de quem não tem aparelho ligado. Os endereços antigos `/landing/1`, `/landing/2` e `/landing/3` levam pra `/landing`.
- **Arquivos:** `app/landing/` e `components/landing/`. O desenho fica em `components/landing/Landing.tsx` e o texto em `components/landing/conteudo.ts`. As telas do idoso, o painel da família e as rotas de API pertencem a outras conversas.
- **Cópia de trabalho:** uma pasta separada (`git worktree add ~/dev/lia-landing`), com o `node_modules` como link pro de `~/dev/lia`. O envio é `git push origin HEAD:main`, logo depois de buscar o `origin/main` e refazer a base.
- **Conferência:** `next build --webpack` e `next start`, porque o `next dev` na cópia sai sem estilo. Se a montagem cair com um erro de `WasmHash`, apague a pasta `.next` e monte de novo. Olhar no celular (375 de largura) e no computador.
- **Publicação (regra de 21/11, 14h20):** quem publica na Vercel é só a conversa "Servidor, voz e banco". A conversa da landing grava no GitHub e pede a publicação a ela por mensagem, sem rodar `vercel deploy`. Publicação feita de outra cópia pode tirar do ar o trabalho de outra conversa.
