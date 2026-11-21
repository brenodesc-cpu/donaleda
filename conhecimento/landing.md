# A landing page da Dona Leda

Atualizado em 21/11/2026. A página mora em `/landing`. O Breno pediu três direções de famílias diferentes e escolheu a segunda, "Produto em cena", no mesmo dia. Este arquivo é o briefing de quem mexe na página.

## Quem lê e o que a página pede

- **A filha ou o filho de 40 a 60 anos** que mora longe do pai ou da mãe. É quem compra, e a página fala com essa pessoa.
- **A banca do hackathon**, no domingo, 22/11, que abre o link pra ver se o produto existe.
- **O dono de residencial sênior**, que é o segundo canal de venda e ganha uma seção curta.

O botão principal leva pra `/entrar`, o cadastro que já existe. Se outro destino fizer mais sentido (uma conversa de demonstração, por exemplo), a decisão é do Breno.

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

- **Topo, em fundo Café:** o sonho, a definição, o botão e um celular desenhado com a tela da ligação tocando. O botão Atender do desenho funciona e leva pra tela da conversa.
- **Como funciona:** cinco passos (ela liga, a pessoa atende, o dia, os avisos, a semana). Na tela larga o celular fica parado e troca de tela conforme a pessoa rola. No celular de quem lê, cada passo traz a sua tela.
- **A camada de cuidado:** uma aba por necessidade, com o que ela faz hoje.
- **O dinheiro, em fundo amarelo:** a frase aprovada e duas barras, a do cuidador de 12 horas e a da Dona Leda.
- **Depois:** confiança, residenciais, perguntas frequentes e o botão de novo.

As telas do celular desenhado repetem os textos das telas reais (`components/ChamadaTocando.tsx`, `components/familia/formatos.ts` e `lib/regras.ts`) e usam a pessoa de exemplo de `lib/exemplo.ts`, com a marca "Exemplo". Quando uma tela real mudar de texto, o desenho em `components/landing/Aparelho.tsx` muda junto.

As outras duas direções ficaram no histórico do repositório, na gravação "Landing page: três direções pra escolha". A Carta era uma página de leitura que contava uma ligação de cima a baixo, e a Conta e prova punha os números do cuidador e do país na frente, com a camada em tabela.

**Em aberto, com o Breno:** a página inicial `/` continua sendo o aparelho do idoso, porque o aplicativo e os celulares já ligados a um idoso abrem nesse endereço. Falta decidir se quem chega em `/` sem aparelho ligado passa a ver a landing.

Skills de design instaladas em `~/.claude/skills/`: `ui-ux-pro-max`, `impeccable`, `frontend-design`, `brand`, `design-system`, `theme-factory`, `web-design-guidelines`, `apple-design` e `frontend-project-style`.

## Onde gravar e como publicar

- **Rotas:** `/landing`. Os endereços antigos `/landing/1`, `/landing/2` e `/landing/3` levam pra ela. A página inicial `/` é o aparelho do idoso.
- **Arquivos:** `app/landing/` e `components/landing/`. O texto fica todo em `components/landing/conteudo.ts`. As telas do idoso, o painel da família e as rotas de API pertencem a outras conversas.
- **Cópia de trabalho:** uma pasta separada (`git worktree add ~/dev/lia-landing`), com o `node_modules` como link pro de `~/dev/lia`. O envio é `git push origin HEAD:main`, logo depois de buscar o `origin/main` e refazer a base.
- **Conferência:** `next build --webpack` e `next start`, porque o `next dev` na cópia sai sem estilo. Olhar no celular (375 de largura) e no computador.
- **Publicação (regra de 21/11, 14h20):** quem publica na Vercel é só a conversa "Servidor, voz e banco". A conversa da landing grava no GitHub e pede a publicação a ela por mensagem, sem rodar `vercel deploy`. Publicação feita de outra cópia pode tirar do ar o trabalho de outra conversa.
