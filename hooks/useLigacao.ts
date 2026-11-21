'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RTMClient } from 'agora-rtm';
import type {
  AgoraRenewalTokens,
  DadosDaLigacao,
  MotivoDaFalha,
} from '@/types/conversation';
import {
  chamarAssistente,
  conseguirMicrofone,
  fecharNoServidor,
  ligarRtm,
  pedirToken,
} from './pedidosDaLigacao';

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

  // Os módulos da Agora são pesados: carregar antes deixa o toque no botão mais rápido.
  useEffect(() => {
    import('agora-rtc-react').catch(() => {});
    import('agora-rtm').catch(() => {});
  }, []);

  const desligar = useCallback(
    (proximaFase: FaseDaLigacao, falha: MotivoDaFalha | null) => {
      if (fimAvisado.current) return;
      fimAvisado.current = true;
      // A tela troca na hora (o som para já); o servidor é avisado em seguida.
      setMotivo(falha);
      setFase(proximaFase);
      setDados(null);
      setRtm(null);
      ocupado.current = false;
      if (dados) void fecharNoServidor(dados.conversaId, dados.agentId);
      rtm?.logout().catch(() => {});
    },
    [dados, rtm],
  );

  const ligar = useCallback(async (chamadaId?: string) => {
    if (ocupado.current) return;
    ocupado.current = true;
    ultimaChamada.current = chamadaId;
    setFase('ligando');
    setMotivo(null);
    try {
      if (!(await conseguirMicrofone())) {
        ocupado.current = false;
        setMotivo('microfone');
        setFase('erro');
        return;
      }
      const token = await pedirToken();
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
      });
      setFase('conversando');
    } catch (erro) {
      console.error('Não consegui ligar:', erro);
      ocupado.current = false;
      setMotivo('conexao');
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

  const encerrar = useCallback(() => desligar('parada', null), [desligar]);

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
      void fecharNoServidor(dados.conversaId, dados.agentId);
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
    renovarTokens,
  };
}
