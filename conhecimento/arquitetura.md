# Arquitetura

Contrato de 21/11/2026, 13h, entre o servidor, o painel da família e o app do idoso. Quem mudar o contrato atualiza este arquivo e `lib/tipos.ts` no mesmo envio.

## Nome

O produto e a assistente se chamam **Dona Leda**. Ela se apresenta sempre como assistente: "Oi, aqui é a Dona Leda, a assistente que a sua filha contratou." O nome vem de `NOME_DA_ASSISTENTE` em `lib/assistente.ts`.

## Peças

- **Servidor:** este projeto Next.js, publicado na Vercel em `https://donaleda.vercel.app`.
- **Banco:** Supabase, projeto `donaleda` (organização Dona Leda, plano grátis, São Paulo). As chaves ficam no `.env.local` e nas variáveis da Vercel.
- **App:** o mesmo site dentro de um app (Capacitor), apontando pro endereço da Vercel. Um app só pros dois lados: na primeira abertura a pessoa escolhe "Sou da família" ou "Este aparelho é do idoso".
- **Conversa:** Agora, como já está.

## Quem é quem

| Quem | Como se identifica | Onde |
|---|---|---|
| Família | Login por e-mail e senha do Supabase, em cookie | `lib/sessao.ts` (`familiaLogada`, `exigirIdosoDaFamilia`) |
| Aparelho do idoso | Token guardado no aparelho, mandado no cabeçalho `x-donaleda-aparelho` | `lib/sessao.ts` (`idosoDoAparelho`) e `lib/aparelho.ts` no navegador |
| Agora (ações) | `?idoso=<id>&chave=<hmac do id>` no endereço `/api/mcp` | `lib/servidor.ts` |

O aparelho nunca tem login. A família gera um código de 6 números no painel, digita no aparelho uma vez, e o aparelho recebe o token.

## Banco

- `idosos`: id, nome, criado_por, criado_em.
- `membros`: idoso_id, user_id, papel (`responsavel` ou `familiar`).
- `fichas`: idoso_id, base (jsonb com o objeto `Base` inteiro de `lib/tipos.ts`), versao, atualizado_em. As funções puras de `lib/dados.ts` continuam mexendo no objeto `Base`; `lerBase(idosoId)` e `mudarBase(idosoId, fn)` leem e gravam esta linha, com a versão pra duas mudanças ao mesmo tempo não se apagarem.
- `aparelhos`: id, idoso_id, token_hash, nome, criado_em, visto_em.
- `codigos`: codigo, idoso_id, expira_em, usado_em.

Toda tabela tem RLS ligada sem política: só o servidor, com a chave secreta, lê e grava. O navegador fala só com as rotas `/api`.

## Rotas

| Rota | Quem chama | O que faz |
|---|---|---|
| `GET /api/idosos` | família | lista `IdosoDaFamilia[]` |
| `POST /api/idosos` | família | cadastra (`NovoIdoso`), devolve `{ id }` |
| `GET /api/familia?idoso=<id>` | família | `PainelDaFamilia` |
| `POST /api/familia` | família | ações de `AcaoDaFamilia` com `idosoId`, mais `{ acao: 'gerar_codigo', idosoId }` |
| `POST /api/aparelho/parear` | aparelho | `{ codigo }` → `AparelhoPareado` |
| `GET` e `POST /api/chamada` | aparelho | como hoje, com o cabeçalho |
| `POST /api/conversa` | aparelho | como hoje, com o cabeçalho |
| `POST /api/invite-agent` | aparelho | como hoje, com o cabeçalho |
| `GET /api/generate-agora-token` | aparelho | como hoje, com o cabeçalho |
| `POST /api/stop-conversation` | aparelho | como hoje, com o cabeçalho |
| `POST /api/mcp?idoso=&chave=` | Agora | ações da assistente no idoso certo |

## Telas

| Endereço | Quem vê |
|---|---|
| `/` | Aparelho pareado: a tela do idoso. Sem par: escolha entre "Sou da família" e "Este aparelho é do idoso" |
| `/parear` | O idoso (ou quem está com ele) digita o código de 6 números |
| `/entrar` | Família: entrar ou criar conta |
| `/familia` | Painel. Quem não entrou é levado pra `/entrar`, e quem ainda não cadastrou ninguém, pra `/familia/novo` |
| `/familia/novo` | Cadastrar o idoso |
| `/familia/aparelho` | Gerar o código pra ligar o aparelho |
| `/familia/ajustes` | Horários das ligações, atender sozinho, remédios |
| `/marca` | As três direções de marca, pro time escolher |

## Demonstração

Toda família nova recebe a opção "Ver com um exemplo", que cria a dona Helena com os dias de exemplo marcados, pra a banca ver o painel cheio.
