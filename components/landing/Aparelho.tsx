// O celular desenhado da landing page, com as telas que o produto mostra de verdade:
// a ligação tocando e a conversa (aparelho do idoso) e o painel (celular da família).
// Os textos repetem os das telas reais: components/ChamadaTocando.tsx,
// components/familia/formatos.ts e lib/regras.ts. A pessoa é a do exemplo (lib/exemplo.ts).

import { Phone, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SAUDACAO_DE_EXEMPLO } from './conteudo';
import { Disco } from './Disco';

export function Aparelho({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative w-[272px] shrink-0 rounded-[2.75rem] bg-[#140B04] p-[9px] ring-1 ring-white/15',
        'shadow-[0_40px_70px_-30px_rgba(0,0,0,0.75)]',
        className,
      )}
    >
      <div className="relative h-[540px] overflow-hidden rounded-[2.2rem] bg-background text-left text-foreground">
        {children}
      </div>
    </div>
  );
}

const BOTAO_DA_TELA = 'flex w-full items-center justify-center gap-2 rounded-2xl font-titulo font-semibold';

/** "Dona Leda está ligando". Com `onAtender`, o botão verde funciona de verdade. */
export function TelaTocando({ onAtender }: { onAtender?: () => void }) {
  const atender = (
    <>
      <Phone aria-hidden className="h-6 w-6 shrink-0" />
      Atender
    </>
  );
  return (
    <div className="flex h-full flex-col items-center justify-between px-4 pb-5 pt-9 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <span aria-hidden className="lp-anel absolute h-36 w-36 rounded-full bg-accent/60" />
          <Disco girando className="relative h-40 w-40" />
        </div>
        <p className="font-titulo text-[1.7rem] font-semibold leading-tight text-balance">Dona Leda está ligando</p>
        <p className="text-lg text-muted-foreground">Sua assistente virtual</p>
      </div>
      <div className="flex w-full flex-col gap-2.5">
        {onAtender ? (
          <button
            type="button"
            onClick={onAtender}
            className={cn(BOTAO_DA_TELA, 'min-h-[4.5rem] bg-success text-2xl text-white transition-transform hover:bg-[#176A35] active:scale-[0.98]')}
          >
            {atender}
          </button>
        ) : (
          <div className={cn(BOTAO_DA_TELA, 'min-h-[4.5rem] bg-success text-2xl text-white')}>{atender}</div>
        )}
        <div className={cn(BOTAO_DA_TELA, 'min-h-12 border-2 border-border bg-card text-lg')}>Agora não</div>
      </div>
    </div>
  );
}

/** A conversa: o disco fala, a legenda mostra a frase e o botão vermelho desliga. */
export function TelaConversa({ onDesligar }: { onDesligar?: () => void }) {
  const desligar = (
    <>
      <PhoneOff aria-hidden className="h-5 w-5 shrink-0" />
      Desligar
    </>
  );
  return (
    <div className="flex h-full flex-col items-center justify-between px-4 pb-5 pt-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <Disco falando className="h-28 w-28" />
        <p className="text-base text-muted-foreground">Falando</p>
      </div>
      <p className="font-titulo text-[1.2rem] font-semibold leading-snug">{SAUDACAO_DE_EXEMPLO}</p>
      {onDesligar ? (
        <button
          type="button"
          onClick={onDesligar}
          className={cn(BOTAO_DA_TELA, 'min-h-14 bg-destructive text-xl text-white transition-transform hover:bg-[#99311C] active:scale-[0.98]')}
        >
          {desligar}
        </button>
      ) : (
        <div className={cn(BOTAO_DA_TELA, 'min-h-14 bg-destructive text-xl text-white')}>{desligar}</div>
      )}
    </div>
  );
}

function TopoDoPainel() {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border px-4 pb-3 pt-6">
      <p className="font-titulo text-xl font-bold">Dona Helena</p>
      <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm text-muted-foreground">Exemplo</span>
    </div>
  );
}

const DIA_DE_EXEMPLO: Array<{ nome: string; valor: string; bom: boolean }> = [
  { nome: 'Sono', valor: 'Dormiu bem', bom: true },
  { nome: 'Alimentação', valor: 'Comeu bem', bom: true },
  { nome: 'Remédio', valor: 'Tomou o remédio', bom: true },
  { nome: 'Dor (0 a 10)', valor: 'Dor 3 no joelho direito', bom: false },
  { nome: 'Humor', valor: 'Bem', bom: true },
  { nome: 'Saiu de casa', valor: 'Saiu de casa', bom: true },
];

/** O painel da família no celular de quem mora longe, em três momentos. */
export function TelaPainel({ parte }: { parte: 'dia' | 'aviso' | 'semana' }) {
  return (
    <div className="flex h-full flex-col">
      <TopoDoPainel />
      <div className="flex flex-1 flex-col gap-3 px-3.5 py-4">
        {parte === 'dia' ? (
          <>
            <p className="font-titulo text-lg font-bold">Hoje</p>
            <ul className="grid grid-cols-2 gap-2">
              {DIA_DE_EXEMPLO.map((item) => (
                <li
                  key={item.nome}
                  className={cn(
                    'flex min-h-[4.4rem] flex-col justify-between rounded-xl border px-2.5 py-2',
                    item.bom ? 'border-success/30 bg-success-soft' : 'border-border bg-card',
                  )}
                >
                  <span className="text-[0.8rem] leading-tight text-muted-foreground">{item.nome}</span>
                  <span className={cn('text-[0.95rem] font-semibold leading-tight', item.bom ? 'text-success' : 'text-foreground')}>
                    {item.valor}
                  </span>
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-border bg-card px-3 py-2.5">
              <p className="text-[0.8rem] text-muted-foreground">Resumo da conversa</p>
              <p className="mt-1 text-[0.95rem] leading-snug">
                Dormiu bem, tomou o remédio da pressão e foi à hidroginástica de manhã.
              </p>
            </div>
          </>
        ) : null}

        {parte === 'aviso' ? (
          <>
            <p className="font-titulo text-lg font-bold">Avisos</p>
            <div className="rounded-xl bg-destructive px-3.5 py-3 text-white">
              <p className="text-[0.8rem] font-semibold">Urgente</p>
              <p className="mt-1 text-[0.98rem] font-semibold leading-snug">
                Pode ser uma emergência: “Eu caí no banheiro”. Ligue agora e, se precisar, chame o SAMU no 192.
              </p>
            </div>
            <div className="rounded-xl border border-foreground bg-warning-soft px-3.5 py-3 text-warning">
              <p className="text-[0.8rem] font-semibold">Atenção</p>
              <p className="mt-1 text-[0.98rem] font-semibold leading-snug">
                Contou de um pedido de dinheiro ou de senha: “Me ligaram pedindo o código do cartão”. Pode ser golpe.
              </p>
            </div>
            <div className="rounded-xl border border-foreground bg-warning-soft px-3.5 py-3 text-warning">
              <p className="text-[0.8rem] font-semibold">Atenção</p>
              <p className="mt-1 text-[0.98rem] font-semibold leading-snug">
                Não atendeu a ligação das 09:00, em 2 tentativas.
              </p>
            </div>
          </>
        ) : null}

        {parte === 'semana' ? (
          <>
            <p className="font-titulo text-lg font-bold">A semana</p>
            {[
              { valor: 4, rotulo: 'Saiu de casa' },
              { valor: 5, rotulo: 'Conversou com alguém' },
            ].map((numero) => (
              <div key={numero.rotulo} className="rounded-xl border border-success/30 bg-success-soft px-3.5 py-3">
                <p className="font-titulo text-3xl font-bold text-success">
                  {numero.valor}
                  <span className="font-sans text-base font-medium text-muted-foreground"> de 6 dias</span>
                </p>
                <p className="text-base font-medium">{numero.rotulo}</p>
              </div>
            ))}
            <div className={cn(BOTAO_DA_TELA, 'mt-auto min-h-14 bg-primary text-xl text-primary-foreground')}>
              <Phone aria-hidden className="h-5 w-5 shrink-0" />
              Ligar agora
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
