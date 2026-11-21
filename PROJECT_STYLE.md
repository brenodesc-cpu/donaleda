# PROJECT_STYLE.md
# Guia visual da Dona Leda. Escrito em 21/11/2026 com escolhas pensadas pra quem enxerga e ouve menos. O time edita à vontade.

## Projeto
name: Dona Leda
description: Assistente de voz que conversa todo dia com o idoso que mora sozinho e avisa a família.
tone: acolhedor, calmo, claro e respeitoso. Nada infantil.

## Stack
framework: Next.js 16 (App Router)
typescript: sim
component_library: nenhuma (componentes próprios, com Tailwind)
icons: Lucide
animations: CSS e SVG

## Cores
As cores moram em `app/globals.css`, num bloco de variáveis por direção da marca, e são usadas pelas classes do Tailwind. Nada de cor escrita direto no componente. A direção ativa é `MARCA_ATIVA` em `components/marca/direcoes.ts` (hoje, Varanda). O livro da marca está em `conhecimento/marca.md`, e as três direções, em `/marca`.

primary: terracota (`bg-primary`, texto branco em cima)
background: creme (`bg-background`)
surface: branco (`bg-card`)
border: `border-border`
text_primary: `text-foreground` (marrom quase preto)
text_secondary: `text-muted-foreground`
accent: mostarda (`bg-accent`, texto escuro em cima)
success: `bg-success` (botão Atender, texto branco), `text-success` e `bg-success-soft`
warning: `text-warning` e `bg-warning-soft`
error: `text-destructive`, `bg-destructive` e `bg-danger-soft`
desenho da Dona Leda: `fill-leda-pele`, `fill-leda-cabelo`, `fill-leda-roupa`, `stroke-leda-traco`

Contraste conferido por `python3 recursos/marca/paletas.py`: 7 pra 1 no texto principal e 4,5 pra 1 no resto.

## Dark Mode
dark_mode: light_only

## Tipografia
font_heading: Atkinson Hyperlegible Next, Google Fonts (classe `font-sans`)
font_body: Atkinson Hyperlegible Next, Google Fonts

## Layout & Tokens
border_radius: rounded
density: spacious

## Regras da tela do idoso
- Um botão por tela, com pelo menos 72 px de altura e texto grande.
- Texto de pelo menos 18 px. A legenda da fala usa 24 px ou mais.
- A pessoa precisa conseguir dar zoom.
- Nenhuma palavra técnica e nenhuma palavra em inglês.
- O rosto é um desenho, claramente um personagem.
- Movimento respeita a preferência de reduzir animação do aparelho.

## Regras do painel da família
- Aviso urgente em vermelho, aviso de atenção em âmbar. Cor só onde ajuda a decidir.
- Campo sem resposta aparece como "Ainda sem resposta", apagado.
- Dado de exemplo sempre marcado.
