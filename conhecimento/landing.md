# A landing page da Dona Leda

Pedido do Breno em 21/11/2026: uma página de apresentação da Dona Leda em três direções de famílias diferentes, pra ele escolher uma, com o link pronto no fim. Este arquivo é o briefing de quem monta a página.

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

## As três direções

As três usam a marca Gema de `marca.md`: Café e Casca, o amarelo só em área grande, Gabarito nos títulos, Atkinson Hyperlegible Next no texto e o disco de telefone como símbolo. A família de cada uma muda de verdade: estrutura, ritmo e imagem. O Breno reprova variação do mesmo esqueleto.

Pontos de partida, que podem mudar depois da pesquisa nas skills:

1. **Carta:** página de leitura, com letra grande, que conta uma ligação da Dona Leda de cima a baixo.
2. **Produto em cena:** a ligação tocando na tela, com o disco girando, o botão Atender e o painel da família aparecendo conforme a pessoa rola.
3. **Conta e prova:** os números do cuidador e do mercado na frente, com a camada em blocos, pra quem decide com planilha.

Skills de design instaladas em `~/.claude/skills/`, todas pra usar: `ui-ux-pro-max` (começar pelo `search.py --design-system`), `impeccable`, `frontend-design`, `brand`, `design-system`, `theme-factory`, `web-design-guidelines`, `apple-design` e `frontend-project-style`.

## Onde gravar e como publicar

- **Rotas:** `/landing/1`, `/landing/2` e `/landing/3`, e `/landing` com as três lado a lado pra escolher. A página inicial `/` é o aparelho do idoso e fica como está até o Breno escolher uma direção.
- **Arquivos:** `app/landing/` e `components/landing/`. As telas do idoso, o painel da família e as rotas de API pertencem a outras conversas.
- **Cópia de trabalho:** uma pasta separada (`git worktree add ~/dev/lia-landing`), com o `node_modules` como link pro de `~/dev/lia`. O envio é `git push origin HEAD:main`, logo depois de buscar o `origin/main` e refazer a base.
- **Conferência:** `next build --webpack` e `next start`, porque o `next dev` na cópia sai sem estilo. Olhar no celular (375 de largura) e no computador.
- **Publicação:** `npx vercel deploy --prod --yes` de uma cópia em dia com o `origin/main`, com o `.vercel/project.json` copiado de `~/dev/lia`. Cópia velha desfaz o que as outras conversas puseram no ar.

A entrega está pronta com as três direções no ar, cada uma inteira e funcionando no celular, e o link de `/landing` mandado ao Breno com uma linha sobre cada direção e a recomendação de qual seguir.
