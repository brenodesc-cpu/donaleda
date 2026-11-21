# Infraestrutura

Atualizado em 21/11/2026, 12h40. O que está de pé, o que falta pra virar aplicativo e quem decide o quê.

## O que está de pé hoje

- **Servidor no Mac do Breno**, em `http://localhost:3210`, com as chaves da Agora no `.env.local`.
- **Endereço público temporário** (túnel do localhost.run) apontando pra esse servidor. Com ele o celular abre as telas por HTTPS, e a Agora alcança as ações da assistente em `/api/mcp`. O endereço muda quando o túnel cai, e aí `LIA_URL_PUBLICA` precisa ser trocada.
- **Conversa pela Agora funcionando**, testada pelo Breno às 12h de 21/11.
- **Ficha num arquivo local** (`dados/base.json`), com um idoso só.

Serve pra desenvolver e pra testar no celular de quem está na sala. Cai se o Mac dormir.

## O que falta pra ser um aplicativo de verdade

| Peça | Pra que serve | Como fazer | Quanto leva |
|---|---|---|---|
| Servidor na nuvem com endereço fixo | O app e a Agora param de depender do Mac | Vercel, que publica este projeto direto do GitHub | 30 minutos, com a conta criada |
| Banco de dados na nuvem | Ficha de vários idosos, que não some | Supabase (Postgres). Troca só o fim de `lib/dados.ts` | 2 horas |
| Login da família | Só a família vê a ficha do idoso dela | Login por e-mail do próprio Supabase | 1 a 2 horas |
| Ligar o aparelho do idoso à família | O aparelho sabe de qual idoso ele é, sem senha | Código de 6 números que a família digita no aparelho uma vez | 1 hora |
| Aplicativo de iPhone | Ícone na tela e microfone e câmera liberados de vez | Capacitor: o mesmo site dentro de um app. Sobe pelo TestFlight | 2 a 3 horas, com a conta de desenvolvedor da Apple |
| Aplicativo de Android | A maior parte dos idosos brasileiros usa Android | Capacitor. O arquivo do app (APK) instala direto, sem loja | 1 a 2 horas |
| Ligação tocando com a tela bloqueada | O aparelho toca como telefone | CallKit no iPhone e notificação de tela cheia no Android | Dias. Fica fora do hackathon |
| Aviso pra família fora do painel | A filha recebe o aviso sem estar olhando | Notificação do app ou mensagem de WhatsApp | 2 horas pra notificação |
| Marca | Nome, ícone, cores, rosto e voz | O nome vem primeiro: ele define o ícone e o registro do app | Decisão do time |

## TestFlight

- **Teste interno:** até 100 pessoas, sem revisão da Apple. Cada pessoa precisa ser adicionada à conta de desenvolvedor de quem publica. Dá pra fazer no sábado.
- **Teste externo (link público):** passa por uma revisão da Apple que costuma levar até um dia. Não dá pra garantir antes das 12h de domingo.
- A banca não precisa do TestFlight: o regulamento pede repositório, vídeo e demonstração. O app instalado conta como acabamento.

## No hackathon, o aparelho do idoso

Um celular ou tablet com o app aberto e a tela sempre ligada, apoiado num suporte. A ligação toca na tela e pode atender sozinha. É o "aparelho próprio" que o mentor sugeriu, feito com o que a gente tem.

## Ordem sugerida

1. Voz natural e resposta rápida (vale 25% da nota).
2. Servidor na nuvem e banco, pra a demonstração não depender do Mac.
3. Login da família e código do aparelho.
4. Marca aplicada nas duas telas.
5. App de Android e de iPhone, se sobrar tempo no sábado à noite.

## Problemas que seguem abertos

- **Custo da conversa:** R$ 505 por mês por idoso com 30 minutos por dia no preço de tabela. Conta em `tese.md`.
- **Voz robótica e demora** com a voz grátis da Agora.
- **Sem login:** hoje qualquer pessoa com o endereço vê o painel.
