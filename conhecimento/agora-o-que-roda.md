# O que a Dona Leda usa da Agora

O que cada pessoa do time pode dizer no pitch, nas perguntas e no README sobre a Agora. A banca dá 25% pra técnica e uso da Agora e pode pedir pra ver, então no palco só entra o que roda numa ligação comum pelo site. Conferido no código em 22/11/2026, na gravação c54295f.

## Pode dizer e mostrar

Roda numa ligação comum pelo site, no modo padrão.

- **O motor de conversa da Agora** (Conversational AI Engine) põe o Gemini ao vivo na ligação (`app/api/invite-agent/route.ts`).
- **A voz passa pela sala de áudio da Agora** (RTC).
- **A legenda e o estado da Dona Leda** ("Estou te ouvindo", "Pensando...", "Falando") aparecem na tela do idoso pelas mensagens em tempo real da Agora (RTM, com o Agent Client Toolkit). Com `?medir=1` no endereço aparece o tempo de resposta medido pela Agora.
- **O filtro de ruído da Agora** (AI Denoiser) limpa o microfone no site (`hooks/useFiltroDeRuido.ts`). No app de celular ele fica desligado, porque o próprio celular já filtra. Dá pra dizer, e a tela não mostra que ele ligou.
- **A família entra na mesma sala** com voz e vídeo. A Dona Leda anuncia com uma frase fixa e sai da sala (`lib/familiaNaLigacao.ts`). O botão só aparece num aviso urgente ou quando o idoso pede pra chamar a família.
- **O fim gentil aos 8 minutos e 30 segundos:** o servidor manda pela Agora uma instrução pra ela se despedir (`lib/pararAssistente.ts`).
- **Chaves temporárias** pra sala de áudio, pras mensagens e pro motor de conversa. Elas vencem em uma hora.

## Pronto no código, sem mostrar

- **O modo de reserva** (`?modo=tres`): Deepgram escuta, o GPT-4o-mini responde e uma voz sintética fala, com o fim de fala por sentido da frase, frases de espera e as ações pelo campo oficial do SDK. Ele só entra quando alguém escolhe à mão.
- **A ligação por telefone comum pra rede de apoio** depois de 3 tentativas sem atendimento, pela telefonia da Agora (`lib/sinalizacaoChamada.ts`). Falta um número na conta da Agora e um teste de verdade. Sem a variável `AGORA_TELEPHONY_FROM_NUMBER`, ninguém recebe ligação.
- **O avatar em vídeo** (Anam ou HeyGen), só no modo de reserva e com a chave do fornecedor.

## Não dizer

- **Que a troca pro modo de reserva é automática.** Se o Gemini falha no modo padrão, a ligação não abre. A troca é feita à mão.
- **Que a ligação padrão tem fim de fala por sentido da frase ou frases de espera.** No modo do Gemini ela espera 500 milissegundos de silêncio e não usa frase de espera.
- **Que há vídeo entre o idoso, a Dona Leda e a família.** Só a família manda vídeo. A câmera do idoso fica desligada, e a Dona Leda é um rosto desenhado.
- **Que o convite da ligação chega pelas mensagens em tempo real.** O aparelho toca porque pergunta ao servidor a cada 2 segundos se tem ligação (`hooks/useChamada.ts`).
- **Que o UIKit da Agora é usado.** Ele está instalado e não tem uso. O que é usado é o Agent Client Toolkit.
- **Que a ligação telefônica pra várias pessoas ou o avatar funcionam.** Os dois estão no código e desligados.

## Em aberto

No modo do Gemini, o código põe o endereço das ações (`/api/mcp`) na configuração à mão, porque o SDK ainda não leva esse protocolo nesse modo. Até a conversa do servidor confirmar nos registros uma chamada em `/api/mcp` vinda de uma ligação no modo do Gemini, ninguém diz "MCP" nem "a Agora chama as ações" falando da ligação padrão. Dá pra dizer que a Dona Leda anota a ficha do dia e avisa a família, sem dizer por qual caminho.
