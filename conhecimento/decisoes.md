# Decisões

Uma linha por decisão, com a data. A mais nova fica em cima.

| Data | Decisão | Por quê |
|---|---|---|
| 21/11/2026 | Filtro de barulho da Agora (AI Noise Suppression) no microfone do aparelho, nos dois modos, no nível suave | Demonstração em salão cheio e TV ligada na casa do idoso. O nível suave preserva a voz baixa. Se o aparelho não aguentar, o microfone segue sem filtro |
| 21/11/2026 | Foco na voz de quem fala (selective attention locking da Agora) ligado só no modo de três peças | A Agora recusa o foco junto com o Gemini Live: o pedido volta com erro 400, testado em 21/11 |
| 21/11/2026 | Lembrete de silêncio: depois de 9 s calado, ela pergunta com calma se a pessoa ainda está aí | No modo de três peças é o recurso da Agora (`silence_config`). No Gemini a Agora não aplica esse recurso, e a regra fica só nas instruções, sem garantia de que ela fale sozinha |
| 21/11/2026 | Gemini Live no ar como opção (`?modo=gemini`), com o modo de três peças como padrão até o teste com voz | A Agora aceitou o pedido com as ações e a legenda ligadas, e falta medir com gente falando |
| 21/11/2026 | A narrativa do pitch, aprovada pelo Breno: o sonho é que todo brasileiro envelheça ativo até o fim; a frase dele define a Dona Leda como a camada de cuidado de quem envelhece, uma amiga que traz companhia e apoia com necessidades do dia a dia, como segurança, saúde, comunicação e rotina; a aposentadoria média do brasileiro não paga um cuidador, e a Dona Leda leva esse cuidado de todo dia por menos de um décimo do preço; a assinatura é "Dona Leda: longevidade com qualidade de vida". O texto inteiro está em `proposta-de-valor.md` | Ela remete ao idoso, mostra o dinheiro que o mercado já gasta com cuidado e põe a camada de cuidado inteira na frente |
| 21/11/2026 | O produto e a assistente se chamam Dona Leda, e o nome provisório "Lia" saiu. O nome troca num lugar só (`NEXT_PUBLIC_NOME_DA_ASSISTENTE`) | O motivo da escolha não ficou registrado. "Leda" é a forma antiga de "alegre" em português (ver `marca.md`) |
| 21/11/2026 | O produto gira em torno de a assistente ligar pro idoso por chamada de vídeo, na hora marcada ou quando a família pede | O idoso atende ligação, mas não abre aplicativo nem lembra de abrir. Um mentor reforçou: quem tem 100 anos não toca em botão |
| 21/11/2026 | Ligação não atendida tem uma segunda tentativa em 3 minutos e depois vira aviso pra família | Não atender é o sinal mais importante de que algo pode estar errado |
| 21/11/2026 | A ligação pode atender sozinha depois de 10 segundos, se a família ligar essa opção | Tem idoso que não consegue tocar na tela |
| 21/11/2026 | A voz padrão é a da OpenAI emprestada pela Agora (`openai:nova`), trocável pela variável `LIA_VOZ` | Num teste de outubro, as vozes MiniMax em português soaram de Portugal |
| 21/11/2026 | A Lia espera 650 milissegundos de silêncio antes de responder (ajustável por `LIA_SILENCIO_MS`) | No primeiro teste, com 900, a resposta pareceu demorada. Falta medir com idoso de verdade |
| 21/11/2026 | A conversa inteira não é guardada, só a ficha, as lembranças, os avisos e o resumo | A família recebe o que precisa pra agir, e o idoso mantém a privacidade |
| 21/11/2026 | Queda, dor no peito, vontade de morrer e pedido de dinheiro avisam a família por regra fixa do código | Um aviso desses não pode depender de o modelo decidir avisar |
| 21/11/2026 | O primeiro produto é pra família contratar | É o caminho que dá pra demonstrar em dois dias. O residencial fica como segundo canal |
| 21/11/2026 | O remédio é perguntado na conversa, e a falta de confirmação vira aviso pra família | Saber que ele não confirmou já é informação útil |
| 21/11/2026 | A Lia diz que é assistente virtual em toda conversa | Enganar o idoso quebra a confiança e imita o golpe do falso parente |
| 21/11/2026 | O projeto do hackathon é a assistente de voz pra idosos | Dor clara, voz como único jeito de chegar no público e ninguém fazendo em português |

## Em aberto

- Quem paga no pitch: o filho ou a filha que mora longe compra primeiro, e o residencial sênior é o caminho de venda. Esse caminho ainda depende de uma conversa do Vitor com os sócios da rede de residenciais.
- O preço.
- Avatar em vídeo de verdade ou o rosto desenhado. O código já aceita avatar da Anam ou da HeyGen pela Agora (`LIA_AVATAR`), sem teste ainda, porque falta a conta num dos dois.
