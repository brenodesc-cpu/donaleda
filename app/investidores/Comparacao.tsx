'use client';

import { useState } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';

const concorrentes = [
  {
    nome: 'Naian',
    segmento: 'Brasil · Acompanhamento',
    oferta: 'Ligações diárias por IA via WhatsApp, lembretes e relatórios para familiares. Parcerias comerciais com farmácias.',
    comparacao: 'A Dona Leda usa uma tela de chamada com atendimento em um toque e reúne ficha, histórico semanal e avisos em um painel. O WhatsApp da Naian tem a vantagem de usar um canal que muitas famílias já conhecem.',
  },
  {
    nome: 'MemoryLife AI',
    segmento: 'Brasil · Acompanhamento',
    oferta: 'A assistente Helena inicia ligações, lembra de conversas e oferece lembretes. Atende pelo telefone comum e tem oferta para instituições.',
    comparacao: 'A Dona Leda acrescenta uma interface visual à rotina de chamadas. Se a ligação não for atendida, ela repete a tentativa e registra um aviso. O telefone comum da Helena facilita o acesso sem um aparelho com internet.',
  },
  {
    nome: 'Ello Care',
    segmento: 'Brasil · Acompanhamento',
    oferta: 'Ligações de acompanhamento, lembretes e resumos para familiares, com foco na rotina.',
    comparacao: 'O acompanhamento da rotina é um ponto em comum. Na Dona Leda, a família pode consultar a ficha da semana e ver relatos que pedem atenção, como um pedido de Pix ou senha contado durante a ligação.',
  },
  {
    nome: 'ElderCare',
    segmento: 'Brasil · Rede de cuidado',
    oferta: 'Plataforma de apoio a pessoas idosas, famílias e cuidadores, com integração da rede de cuidado.',
    comparacao: 'A Dona Leda começa pela conversa direta com a pessoa idosa e registra o que ela contou. A proposta da ElderCare tem foco mais amplo na articulação entre família e cuidadores.',
  },
  {
    nome: 'Joy Calls',
    segmento: 'EUA · Acompanhamento',
    url: 'https://joycalls.ai',
    oferta: 'Ligações programadas pelo telefone comum, resumo por SMS e avisos de chamadas não atendidas.',
    comparacao: 'As duas iniciam chamadas e avisam a família. Na Dona Leda, a conversa acontece em português do Brasil e a família consulta a ficha do dia e da semana em um painel. O SMS da Joy Calls leva o resumo direto à família.',
  },
  {
    nome: 'inTouch',
    segmento: 'Europa · Acompanhamento',
    url: 'https://intouch.family',
    oferta: 'Conversas por IA no telefone fixo ou celular, com resumos, sinais de humor e alertas para a família.',
    comparacao: 'As duas combinam conversa e acompanhamento familiar. A Dona Leda organiza a ficha em torno dos relatos do dia e inclui avisos sobre possíveis golpes. O telefone da inTouch permite atender sem parear uma tela.',
  },
  {
    nome: 'TeleHelp',
    segmento: 'Brasil · Teleassistência',
    url: 'https://telehelp.com.br',
    oferta: 'Botão de emergência e central de atendimento, com opções de detecção de queda e localização.',
    comparacao: 'A Dona Leda entra na rotina antes de uma urgência, com conversa programada e registro do que a pessoa relatou. A central da TeleHelp atende à necessidade de pedir socorro.',
  },
  {
    nome: 'Tecnosenior',
    segmento: 'Brasil · Teleassistência',
    url: 'https://tecnosenior.com',
    oferta: 'Dispositivos para pedir ajuda, com sensores e localização conforme o equipamento.',
    comparacao: 'A Dona Leda capta o contexto de sono, alimentação ou mal-estar a partir do que a pessoa conta. Sensores e dispositivos da Tecnosenior cumprem um papel próprio de proteção.',
  },
  {
    nome: 'Komp',
    segmento: 'Noruega · Aparelho dedicado',
    url: 'https://komp.family',
    oferta: 'Tela simplificada para familiares enviarem fotos e fazerem chamadas, com atendimento automático para contatos autorizados.',
    comparacao: 'A simplicidade para atender é um ponto em comum. Na Dona Leda, a assistente inicia a conversa no horário combinado e pode usar um celular ou tablet compatível que a pessoa já tenha.',
  },
  {
    nome: 'ElliQ',
    segmento: 'EUA · Aparelho dedicado',
    url: 'https://elliq.com',
    oferta: 'Robô de mesa que inicia interações, faz companhia e sugere atividades.',
    comparacao: 'As duas podem iniciar a interação. A Dona Leda usa uma chamada agendada e organiza o relato para a família acompanhar em um painel, em um aparelho compatível com internet.',
  },
];

export function Comparacao() {
  const [selecionado, selecionar] = useState(concorrentes[0]);

  return (
    <>
      <p id="instrucao-comparacao" className="mt-3 max-w-2xl text-muted-foreground">
        Selecione uma empresa para ver o que as duas ofertas têm em comum e onde a Dona Leda se diferencia.
      </p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <table aria-describedby="instrucao-comparacao" className="w-full table-fixed border-collapse text-left text-sm sm:text-base">
          <thead className="bg-foreground text-background">
            <tr>
              <th scope="col" className="w-[40%] p-3 sm:w-[28%] sm:px-5">Concorrente</th>
              <th scope="col" className="hidden w-[34%] p-3 sm:table-cell">O que oferece</th>
              <th scope="col" className="p-3 sm:px-5">Dona Leda na comparação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {concorrentes.map((concorrente) => {
              const { nome, segmento, oferta, comparacao, url } = concorrente;
              const ativo = selecionado.nome === nome;

              return (
                <tr
                  key={nome}
                  onClick={() => selecionar(concorrente)}
                  className={ativo ? 'bg-primary/5' : 'cursor-pointer hover:bg-muted/50'}
                >
                  <th scope="row" className="align-top">
                    <button
                      type="button"
                      onClick={() => selecionar(concorrente)}
                      aria-pressed={ativo}
                      className="flex min-h-14 w-full items-start justify-between gap-1 p-3 text-left focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-ring sm:gap-3 sm:px-5"
                    >
                      <span>
                        <span className={ativo ? 'block font-bold text-primary' : 'block font-bold'}>{nome}</span>
                        <span className="mt-1 block text-xs font-normal text-muted-foreground sm:text-sm">{segmento}</span>
                      </span>
                      <ChevronRight aria-hidden size={16} className={ativo ? 'mt-1 shrink-0 rotate-90 text-primary' : 'mt-1 shrink-0 text-muted-foreground'} />
                    </button>
                  </th>
                  <td className="hidden p-3 align-top text-muted-foreground sm:table-cell">
                    {oferta}
                    {url && (
                      <a href={url} onClick={(evento) => evento.stopPropagation()} className="mt-2 flex w-fit items-center gap-1 font-semibold text-primary underline underline-offset-4">
                        Site de {nome} <ExternalLink aria-hidden size={13} />
                      </a>
                    )}
                  </td>
                  <td className="p-3 align-top sm:px-5">
                    {ativo ? (
                      <div className="space-y-2">
                        <p className="text-muted-foreground sm:hidden">{oferta}</p>
                        <p className="font-semibold text-foreground">{comparacao}</p>
                        {url && (
                          <a href={url} onClick={(evento) => evento.stopPropagation()} className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4 sm:hidden">
                            Site de {nome} <ExternalLink aria-hidden size={13} />
                          </a>
                        )}
                      </div>
                    ) : (
                      <span aria-hidden className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p role="status" className="sr-only">{selecionado.nome}. {selecionado.oferta} {selecionado.comparacao}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Comparação qualitativa com base no levantamento da equipe e nos perfis fornecidos para a apresentação. As ofertas podem mudar.
      </p>
    </>
  );
}
