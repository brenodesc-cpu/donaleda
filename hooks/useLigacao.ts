'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RTMClient } from 'agora-rtm';
import type { FalaDaSessao } from '@/lib/tipos';
import type {
  AgoraRenewalTokens,
  DadosDaLigacao,
  MotivoDaFalha,
} from '@/types/conversation';
import {
  aquecerServidorDaLigacao,
  chamarAssistente,
  conseguirMicrofone,
  fecharNoServidor,
  ligarRtm,
  pedirToken,
  LimiteDoDiaAcabou,
  type TokenDaAgora,
} from './pedidosDaLigacao';

/** Token pré-aquecido vale por 40 min (a Agora emite com 60 min). */
const VALIDADE_TOKEN_PREAQUECIDO_MS = 40 * 60_000;

export type FaseDaLigacao = 'parada' | 'ligando' | 'conversando' | 'erro';

/**
 * Cuida de ligar e desligar a conversa: token, assistente, canal de mensagens e
 * avisos ao servidor. `ligar(chamadaId)` serve pra ligação que a assistente fez
 * e o idoso atendeu; `ligar()` sem nada, pra quando é o idoso que chama.
 */
export function useLigacao() {
  const [fase, setFase] = useState<FaseDaLigacao>('parada');
  const [motivo, setMotivo] = useState<MotivoDaFalha | null>(null);
  const [dados, setDados] = useState<DadosDaLigacao | null>(null);
  const [rtm, setRtm] = useState<RTMClient | null>(null);
  // Evita mandar o fim da conversa duas vezes (botão, falha e fechar a aba).
  const fimAvisado = useRef(false);
  // Trava contra duas conversas ao mesmo tempo (toque em Atender junto com o atender sozinho).
  const ocupado = useRef(false);
  // A ligação da última tentativa, pra "Tentar de novo" repetir a mesma.
  const ultimaChamada = useRef<string | undefined>(undefined);
  // Falas efêmeras em memória pra consolidar ficha/resumo mesmo se a aba fechar.
  const ultimasFalas = useRef<FalaDaSessao[]>([]);
  // Token pré-aquecido em segundo plano: zera a espera de ~450 ms ao tocar em Ligar/Atender.
  const tokenPreaquecido = useRef<{ valor: TokenDaAgora; criadoEm: number } | null>(null);
  const tokenEmVoo = useRef<Promise<TokenDaAgora> | null>(null);

  const preaquecerToken = useCallback(() => {
    if (tokenEmVoo.current) return;
    const promessa = pedirToken()
      .then((valor) => {
        tokenPreaquecido.current = { valor, criadoEm: Date.now() };
        return valor;
      })
      .finally(() => {
        if (tokenEmVoo.current === promessa) tokenEmVoo.current = null;
      });
    tokenEmVoo.current = promessa;
    void promessa.catch(() => undefined);
  }, []);

  const atualizarFalas = useCallback((falas: FalaDaSessao[]) => {
    ultimasFalas.current = falas;
  }, []);

  // Os módulos da Agora e a tela da conversa são pesados: pré-carrega tudo + aquece rotas + 1 token pronto.
  useEffect(() => {
    import('agora-rtc-react').catch(() => {});
    import('agora-rtm').catch(() => {});
    import('@/components/Conversa').catch(() => {});
    import('@/components/ProvedorDaAgora').catch(() => {});
    aquecerServidorDaLigacao();
    preaquecerToken();
  }, [preaquecerToken]);

  const desligar = useCallback(
    (proximaFase: FaseDaLigacao, falha: MotivoDaFalha | null, falas?: FalaDaSessao[]) => {
      if (fimAvisado.current) return;
      fimAvisado.current = true;
      const falasParaEnviar = falas && falas.length > 0 ? falas : ultimasFalas.current;
      ultimasFalas.current = [];
      // A tela troca na hora (o som para já); o servidor é avisado em seguida.
      setMotivo(falha);
      setFase(proximaFase);
      setDados(null);
      setRtm(null);
      ocupado.current = false;
      if (dados) void fecharNoServidor(dados.conversaId, dados.agentId, falasParaEnviar);
      rtm?.logout().catch(() => {});
      // Já deixa um token novo pronto pra próxima ligação abrir instantaneamente.
      preaquecerToken();
    },
    [dados, rtm, preaquecerToken],
  );

  const ligar = useCallback(async (chamadaId?: string) => {
    if (ocupado.current) return;
    ocupado.current = true;
    ultimaChamada.current = chamadaId;
    setFase('ligando');
    setMotivo(null);
    try {
      // Consome o token pré-aquecido (ou a promessa já em voo) para evitar 2 pedidos concorrentes.
      const cache = tokenPreaquecido.current;
      tokenPreaquecido.current = null;
      const tokenFresco =
        cache && Date.now() - cache.criadoEm < VALIDADE_TOKEN_PREAQUECIDO_MS ? cache.valor : null;
      const emVoo = tokenEmVoo.current;
      tokenEmVoo.current = null;

      const [temMicrofone, token] = await Promise.all([
        conseguirMicrofone(),
        tokenFresco
          ? Promise.resolve(tokenFresco)
          : emVoo
            ? emVoo.catch(() => pedirToken())
            : pedirToken(),
      ]);
      if (!temMicrofone) {
        ocupado.current = false;
        setMotivo('microfone');
        setFase('erro');
        return;
      }
      // O canal de mensagens precisa estar pronto antes de a conversa aparecer na tela.
      const [inicio, mensagens] = await Promise.allSettled([
        chamarAssistente(token, chamadaId),
        ligarRtm(token),
      ]);
      if (inicio.status !== 'fulfilled' || mensagens.status !== 'fulfilled') {
        // Metade ligou: desfaz essa metade pra não deixar assistente sozinha na linha.
        if (mensagens.status === 'fulfilled') {
          mensagens.value.logout().catch(() => {});
        }
        if (inicio.status === 'fulfilled') {
          void fecharNoServidor(inicio.value.conversa_id, inicio.value.agent_id);
        }
        if (inicio.status === 'rejected' && inicio.reason instanceof LimiteDoDiaAcabou) {
          throw inicio.reason;
        }
        throw new Error('a ligação não completou');
      }
      fimAvisado.current = false;
      setRtm(mensagens.value);
      setDados({
        ...token,
        agentId: inicio.value.agent_id,
        conversaId: inicio.value.conversa_id,
        avatar: Boolean(inicio.value.avatar),
        modo: inicio.value.modo,
        direto: inicio.value.direto,
        tetoMs: inicio.value.teto_ms,
        nomeDaFamilia: inicio.value.nomeDaFamilia,
      });
      setFase('conversando');
    } catch (erro) {
      console.error('Não consegui ligar:', erro);
      ocupado.current = false;
      setMotivo(erro instanceof LimiteDoDiaAcabou ? 'limite' : 'conexao');
      setFase('erro');
    }
  }, []);

  /** Repete a última tentativa: a mesma ligação atendida, ou a chamada que o idoso fez. */
  const tentarDeNovo = useCallback(
    () => ligar(ultimaChamada.current),
    [ligar],
  );

  /** Sai do aviso de falha e volta a esperar a próxima ligação. */
  const voltar = useCallback(() => {
    setMotivo(null);
    setFase((atual) => (atual === 'erro' ? 'parada' : atual));
  }, []);

  const encerrar = useCallback(
    (falas?: FalaDaSessao[]) => desligar('parada', null, falas),
    [desligar],
  );

  const falhar = useCallback(
    (falha: MotivoDaFalha) => desligar('erro', falha),
    [desligar],
  );

  const renovarTokens = useCallback(
    async (uid: string): Promise<AgoraRenewalTokens> => {
      if (!dados) throw new Error('sem conversa pra renovar o token');
      const [rtc, mensagens] = await Promise.all([
        pedirToken(`?channel=${dados.channel}&uid=${uid}`),
        pedirToken(`?channel=${dados.channel}&uid=${dados.uid}`),
      ]);
      return { rtcToken: rtc.token, rtmToken: mensagens.token };
    },
    [dados],
  );

  // Se a pessoa fechar a aba no meio da conversa, o servidor ainda fica sabendo do fim.
  useEffect(() => {
    if (fase !== 'conversando' || !dados) return;
    const aoSair = () => {
      if (fimAvisado.current) return;
      fimAvisado.current = true;
      const falasParaEnviar = ultimasFalas.current;
      ultimasFalas.current = [];
      void fecharNoServidor(dados.conversaId, dados.agentId, falasParaEnviar, true);
    };
    window.addEventListener('pagehide', aoSair);
    return () => window.removeEventListener('pagehide', aoSair);
  }, [fase, dados]);

  return {
    fase,
    motivo,
    dados,
    rtm,
    ligar,
    tentarDeNovo,
    voltar,
    encerrar,
    falhar,
    atualizarFalas,
    renovarTokens,
  };
}
