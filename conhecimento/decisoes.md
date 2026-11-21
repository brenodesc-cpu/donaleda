# Decisões

Uma linha por decisão, com a data. A mais nova fica em cima.

| Data | Decisão | Por quê |
|---|---|---|
| 21/11/2026 | O produto gira em torno de a assistente ligar pro idoso por chamada de vídeo, na hora marcada ou quando a família pede | O idoso atende ligação, mas não abre aplicativo nem lembra de abrir. Um mentor reforçou: quem tem 100 anos não toca em botão |
| 21/11/2026 | Ligação não atendida tem uma segunda tentativa em 3 minutos e depois vira aviso pra família | Não atender é o sinal mais importante de que algo pode estar errado |
| 21/11/2026 | A ligação pode atender sozinha depois de 10 segundos, se a família ligar essa opção | Tem idoso que não consegue tocar na tela |
| 21/11/2026 | A voz padrão é a da OpenAI emprestada pela Agora (`openai:nova`), trocável pela variável `LIA_VOZ` | Num teste de outubro, as vozes MiniMax em português soaram de Portugal |
| 21/11/2026 | A Lia espera quase um segundo de silêncio antes de responder | Quem tem mais idade faz pausas longas no meio da frase |
| 21/11/2026 | A conversa inteira não é guardada, só a ficha, as lembranças, os avisos e o resumo | A família recebe o que precisa pra agir, e o idoso mantém a privacidade |
| 21/11/2026 | Queda, dor no peito, vontade de morrer e pedido de dinheiro avisam a família por regra fixa do código | Um aviso desses não pode depender de o modelo decidir avisar |
| 21/11/2026 | O primeiro produto é pra família contratar | É o caminho que dá pra demonstrar em dois dias. O residencial fica como segundo canal |
| 21/11/2026 | O remédio é perguntado na conversa, e a falta de confirmação vira aviso pra família | Saber que ele não confirmou já é informação útil |
| 21/11/2026 | A Lia diz que é assistente virtual em toda conversa | Enganar o idoso quebra a confiança e imita o golpe do falso parente |
| 21/11/2026 | O projeto do hackathon é a assistente de voz pra idosos | Dor clara, voz como único jeito de chegar no público e ninguém fazendo em português |

## Em aberto

- O nome. "Lia" é provisório e troca num lugar só (`NEXT_PUBLIC_NOME_DA_ASSISTENTE`).
- Quem paga no pitch: a família ou o residencial.
- O preço.
- Avatar em vídeo de verdade ou o rosto desenhado. O código já aceita avatar da Anam ou da HeyGen pela Agora (`LIA_AVATAR`), sem teste ainda, porque falta a conta num dos dois.
