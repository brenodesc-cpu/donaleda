# PROJECT_STYLE.md
# Guia visual da Lia. Escrito em 21/11/2026 com escolhas pensadas pra quem enxerga e ouve menos. O time edita à vontade.

## Projeto
name: Lia
description: Assistente de voz que conversa todo dia com o idoso que mora sozinho e avisa a família.
tone: acolhedor, calmo, claro e respeitoso. Nada infantil.

## Stack
framework: Next.js 16 (App Router)
typescript: sim
component_library: nenhuma (componentes próprios, com Tailwind)
icons: Lucide
animations: CSS e SVG

## Cores
As cores moram em `app/globals.css` como variáveis e são usadas pelas classes do Tailwind. Nada de cor escrita direto no componente.

primary: verde-azulado escuro (`bg-primary`, texto branco em cima)
background: branco quente (`bg-background`)
surface: branco (`bg-card`)
border: `border-border`
text_primary: `text-foreground`
text_secondary: `text-muted-foreground`
success: `text-success` e `bg-success-soft`
warning: `text-warning` e `bg-warning-soft`
error: `text-destructive`, `bg-destructive` e `bg-danger-soft`

## Dark Mode
dark_mode: light_only

## Tipografia
font_heading: fonte do sistema
font_body: fonte do sistema

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
