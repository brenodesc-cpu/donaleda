'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { escutarRotaDaFamiliaNativa } from '@/lib/pushNativo';
import type {
  Alerta,
  CategoriaDeLembranca,
  ContatoDeEmergencia,
  PainelDaFamilia,
  RespostaDoAviso,
} from '@/lib/tipos';
import { arrumarHorarios } from './formatos';
import {
  buscarPainel,
  deuCerto,
  enviarAcao,
  enviarDocumento,
  type AcaoComIdoso,
  type PerfilDoIdoso,
} from './api';

const INTERVALO_MS = 2000;

/** Os campos de uma lembrança que a família ensina ou corrige. */
export interface CamposDaLembranca {
  texto?: string;
  categoria?: CategoriaDeLembranca;
  sobre?: string;
  data?: string;
  hora?: string;
}

/** Resultado de ensinar, corrigir ou apagar: deu certo, ou o motivo de não ter dado. */
export type ResultadoDaLembranca = { ok: true } | { ok: false; motivo: string | null };

function motivoDa(dado: unknown): string | null {
  if (!dado || typeof dado !== 'object') return null;
  const motivo = (dado as { motivo?: unknown }).motivo;
  return typeof motivo === 'string' && motivo.trim() ? motivo.trim() : null;
}

/** Como está o pedido de "Ligar agora" feito neste painel. */
export type PedidoDeLigacao = 'parado' | 'pedindo' | 'falhou';

/** O aviso marcado agora neste painel, enquanto o servidor não devolve quem viu. */
export function vistoAqui(alerta: Alerta): Alerta {
  if (alerta.visto && alerta.vistoEm) return alerta;
  return { ...alerta, visto: true, vistoEm: alerta.vistoEm ?? new Date().toISOString(), vistoPor: alerta.vistoPor ?? 'Você' };
}

export function pareceUmPainel(dado: unknown): dado is PainelDaFamilia {
  if (!dado || typeof dado !== 'object') return false;
  const p = dado as Partial<PainelDaFamilia>;
  return (
    !!p.idoso &&
    !!p.hoje &&
    Array.isArray(p.alertas) &&
    Array.isArray(p.semana) &&
    Array.isArray(p.lembrancas)
  );
}

/** Campo que faltar na resposta vira vazio, pra tela nunca quebrar. */
export function completar(dado: PainelDaFamilia): PainelDaFamilia {
  const { idoso } = dado;
  return {
    ...dado,
    chamadaTocando: dado.chamadaTocando ?? null,
    chamadas: Array.isArray(dado.chamadas) ? dado.chamadas : [],
    documentos: Array.isArray(dado.documentos) ? dado.documentos : [],
    redeDeApoio: Array.isArray(dado.redeDeApoio) ? dado.redeDeApoio : [],
    escalonamentos: Array.isArray(dado.escalonamentos) ? dado.escalonamentos : [],
    reservadas: typeof dado.reservadas === 'number' ? dado.reservadas : 0,
    idoso: {
      ...idoso,
      remedios: Array.isArray(idoso.remedios) ? idoso.remedios : [],
      horariosDeLigacao: Array.isArray(idoso.horariosDeLigacao) ? idoso.horariosDeLigacao : [],
      atenderSozinho: idoso.atenderSozinho === true,
    },
  };
}

/**
 * Busca o painel do idoso escolhido a cada 2 segundos e guarda o último dado
 * bom, pra tela nunca piscar nem esvaziar quando uma busca falha. As mudanças
 * feitas aqui aparecem na hora e se acertam com o servidor na busca seguinte.
 */
export function usePainel(idosoId: string | null) {
  const router = useRouter();
  const [bruto, setBruto] = useState<PainelDaFamilia | null>(null);
  const [semConexao, setSemConexao] = useState(false);
  const [vistosAqui, setVistosAqui] = useState<ReadonlySet<string>>(() => new Set<string>());
  const [horariosAqui, setHorariosAqui] = useState<string[] | null>(null);
  const [atenderSozinhoAqui, setAtenderSozinhoAqui] = useState<boolean | null>(null);
  const [pedidoDeLigacao, setPedidoDeLigacao] = useState<PedidoDeLigacao>('parado');

  const buscarAgora = useRef<() => Promise<void>>(async () => {});
  const versaoDosHorarios = useRef(0);
  const versaoDoAtender = useRef(0);
  const alertasNotificados = useRef<Set<string> | null>(null);
  const conviteAvisado = useRef<string | null>(null);

  // No app Android/iOS, ao tocar na notificação urgente, abre direto na sala ao vivo.
  useEffect(() => {
    return escutarRotaDaFamiliaNativa((rota) => {
      router.push(rota);
    });
  }, [router]);

  useEffect(() => {
    setBruto(null);
    alertasNotificados.current = null;
    conviteAvisado.current = null;
    if (!idosoId) return;
    let vivo = true;
    let espera: ReturnType<typeof setTimeout> | undefined;

    const buscar = async () => {
      const { status, dado } = await buscarPainel(idosoId);
      if (!vivo) return;
      if (status === 401) {
        router.replace('/entrar');
        return;
      }
      if (deuCerto(status) && pareceUmPainel(dado)) {
        setBruto(completar(dado));
        setSemConexao(false);
      } else {
        setSemConexao(true);
      }
    };

    const ciclo = async () => {
      await buscar();
      if (vivo) espera = setTimeout(ciclo, INTERVALO_MS);
    };

    buscarAgora.current = buscar;
    void ciclo();
    return () => {
      vivo = false;
      if (espera) clearTimeout(espera);
    };
  }, [idosoId, router]);

  /** Manda a ação do idoso escolhido e devolve o status. Zero: nem chegou. */
  const mandar = useCallback(
    async (acao: AcaoComIdoso): Promise<number> => {
      const { status } = await enviarAcao(acao);
      if (status === 401) router.replace('/entrar');
      if (status === 0) setSemConexao(true);
      return status;
    },
    [router],
  );

  const marcarVisto = useCallback(
    async (alertaId: string) => {
      if (!idosoId) return;
      setVistosAqui((antes) => new Set(antes).add(alertaId));
      if (deuCerto(await mandar({ acao: 'visto', alertaId, idosoId }))) return;
      setVistosAqui((antes) => {
        const depois = new Set(antes);
        depois.delete(alertaId);
        return depois;
      });
    },
    [idosoId, mandar],
  );

  /** Conta o que a pessoa fez com o aviso. Devolve true quando o servidor guardou. */
  const responderAviso = useCallback(
    async (alertaId: string, resposta: RespostaDoAviso, nota: string): Promise<boolean> => {
      if (!idosoId) return false;
      const guardou = deuCerto(await mandar({ acao: 'desfecho', alertaId, resposta, nota, idosoId }));
      if (guardou) await buscarAgora.current();
      return guardou;
    },
    [idosoId, mandar],
  );

  const ligar = useCallback(async () => {
    if (!idosoId) return;
    setPedidoDeLigacao('pedindo');
    const status = await mandar({ acao: 'ligar', idosoId });
    // 409: já está tocando ou em ligação, então não é falha.
    if (!deuCerto(status) && status !== 409) {
      setPedidoDeLigacao('falhou');
      return;
    }
    await buscarAgora.current();
    setPedidoDeLigacao('parado');
  }, [idosoId, mandar]);

  const trocarHorarios = useCallback(
    async (horarios: string[]) => {
      if (!idosoId) return;
      const lista = arrumarHorarios(horarios);
      const versao = (versaoDosHorarios.current += 1);
      setHorariosAqui(lista);
      if (deuCerto(await mandar({ acao: 'horarios', horarios: lista, idosoId }))) {
        await buscarAgora.current();
      }
      if (versao === versaoDosHorarios.current) setHorariosAqui(null);
    },
    [idosoId, mandar],
  );

  const trocarAtenderSozinho = useCallback(
    async (ligado: boolean) => {
      if (!idosoId) return;
      const versao = (versaoDoAtender.current += 1);
      setAtenderSozinhoAqui(ligado);
      if (deuCerto(await mandar({ acao: 'atender_sozinho', ligado, idosoId }))) {
        await buscarAgora.current();
      }
      if (versao === versaoDoAtender.current) setAtenderSozinhoAqui(null);
    },
    [idosoId, mandar],
  );

  /** Grava o que mudou no cadastro. Devolve true quando o servidor guardou. */
  const salvarPerfil = useCallback(
    async (perfil: PerfilDoIdoso): Promise<boolean> => {
      if (!idosoId) return false;
      const guardou = deuCerto(await mandar({ acao: 'perfil', idosoId, ...perfil }));
      if (guardou) await buscarAgora.current();
      return guardou;
    },
    [idosoId, mandar],
  );

  /** Manda uma ação de lembrança e busca o painel de novo quando deu certo. */
  const mandarLembranca = useCallback(
    async (acao: AcaoComIdoso): Promise<ResultadoDaLembranca> => {
      const { status, dado } = await enviarAcao(acao);
      if (status === 401) router.replace('/entrar');
      if (status === 0) setSemConexao(true);
      if (deuCerto(status)) {
        await buscarAgora.current();
        return { ok: true };
      }
      return { ok: false, motivo: status === 422 ? motivoDa(dado) : null };
    },
    [router],
  );

  const ensinarLembranca = useCallback(
    async (campos: CamposDaLembranca & { texto: string; categoria: CategoriaDeLembranca }) => {
      if (!idosoId) return { ok: false, motivo: null } as const;
      return mandarLembranca({ acao: 'ensinar', idosoId, ...campos });
    },
    [idosoId, mandarLembranca],
  );

  const corrigirLembranca = useCallback(
    async (lembrancaId: string, campos: CamposDaLembranca) => {
      if (!idosoId) return { ok: false, motivo: null } as const;
      return mandarLembranca({ acao: 'corrigir_lembranca', idosoId, lembrancaId, ...campos });
    },
    [idosoId, mandarLembranca],
  );

  const apagarLembranca = useCallback(
    async (lembrancaId: string) => {
      if (!idosoId) return { ok: false, motivo: null } as const;
      return mandarLembranca({ acao: 'apagar_lembranca', idosoId, lembrancaId });
    },
    [idosoId, mandarLembranca],
  );

  const anexarDocumento = useCallback(
    async (
      arquivo: File,
      nota?: string,
    ): Promise<{ ok: true; compromissosCriados: number } | { ok: false; erro: string }> => {
      if (!idosoId) return { ok: false, erro: 'Nenhum idoso selecionado.' };
      const { status, dado } = await enviarDocumento(idosoId, arquivo, nota);
      if (status === 401) router.replace('/entrar');
      if (deuCerto(status) && dado?.ok) {
        await buscarAgora.current();
        return { ok: true, compromissosCriados: dado.compromissosCriados ?? 0 };
      }
      return {
        ok: false,
        erro: dado?.detalhe ?? 'Não consegui ler esse documento agora. Tente outra foto ou PDF.',
      };
    },
    [idosoId, router],
  );

  const apagarDocumento = useCallback(
    async (documentoId: string): Promise<boolean> => {
      if (!idosoId) return false;
      const ok = deuCerto(await mandar({ acao: 'apagar_documento', documentoId, idosoId }));
      if (ok) await buscarAgora.current();
      return ok;
    },
    [idosoId, mandar],
  );

  const salvarRedeDeApoio = useCallback(
    async (
      contatos: Omit<ContatoDeEmergencia, 'id'>[] | ContatoDeEmergencia[],
    ): Promise<ContatoDeEmergencia[] | null> => {
      if (!idosoId) return null;
      const { status, dado } = await enviarAcao({ acao: 'salvar_rede_de_apoio', contatos, idosoId });
      if (status === 401) router.replace('/entrar');
      if (status === 0) setSemConexao(true);
      if (!deuCerto(status)) return null;
      await buscarAgora.current();
      const lista =
        dado && typeof dado === 'object' && Array.isArray((dado as { redeDeApoio?: unknown }).redeDeApoio)
          ? ((dado as { redeDeApoio: ContatoDeEmergencia[] }).redeDeApoio)
          : [];
      return lista;
    },
    [idosoId, router],
  );

  const registrarPushFamilia = useCallback(
    async (plataforma: 'android' | 'ios', token: string, voipToken?: string): Promise<boolean> => {
      if (!idosoId || (!token.trim() && !voipToken?.trim())) return false;
      const ok = deuCerto(
        await mandar({
          acao: 'registrar_push_familia',
          plataforma,
          token: token.trim(),
          ...(voipToken?.trim() ? { voipToken: voipToken.trim() } : {}),
          idosoId,
        }),
      );
      if (ok) await buscarAgora.current();
      return ok;
    },
    [idosoId, mandar],
  );

  // Toca sinal sonoro curto e dispara notificação clicável no Web quando chega alerta/convite novo.
  useEffect(() => {
    if (!bruto) return;

    // Quando abre um convite ao vivo novo (emergência ou pedido do idoso), toca alerta sonoro no Web.
    const chaveConvite = bruto.convite ? `${bruto.convite.conversaId}:${bruto.convite.abertoEm}` : null;
    if (chaveConvite && conviteAvisado.current !== chaveConvite) {
      const jaInicializado = alertasNotificados.current !== null;
      conviteAvisado.current = chaveConvite;
      if (jaInicializado && typeof window !== 'undefined') {
        try {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const agoraAudio = ctx.currentTime;
            for (const offset of [0, 0.25, 0.5]) {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.value = 880;
              gain.gain.setValueAtTime(0.18, agoraAudio + offset);
              gain.gain.exponentialRampToValueAtTime(0.001, agoraAudio + offset + 0.18);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(agoraAudio + offset);
              osc.stop(agoraAudio + offset + 0.2);
            }
            setTimeout(() => void ctx.close().catch(() => undefined), 1000);
          }
        } catch {
          // Navegador pode exigir interação prévia para áudio.
        }
      }
    }

    if (alertasNotificados.current === null) {
      alertasNotificados.current = new Set(bruto.alertas.map((a) => a.id));
      return;
    }
    const conhecidos = alertasNotificados.current;
    const novos = bruto.alertas.filter((a) => !conhecidos.has(a.id));
    for (const a of novos) conhecidos.add(a.id);

    if (
      novos.length === 0 ||
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      Notification.permission !== 'granted'
    ) {
      return;
    }

    const rotaLigacao = idosoId ? `/familia/ligacao?idoso=${encodeURIComponent(idosoId)}` : '/familia';
    for (const alerta of novos) {
      if (alerta.visto) continue;
      const aoVivo = Boolean(bruto.convite) && (alerta.gravidade === 'urgente' || alerta.tipo === 'ligacao');
      const titulo =
        alerta.gravidade === 'urgente'
          ? `Urgente: ${bruto.idoso.tratamento}${aoVivo ? ' — toque pra entrar na ligação' : ''}`
          : `Aviso: ${bruto.idoso.tratamento}`;
      try {
        const notif = new Notification(titulo, {
          body: alerta.texto,
          tag: alerta.id,
          requireInteraction: alerta.gravidade === 'urgente',
        });
        notif.onclick = () => {
          window.focus();
          if (aoVivo) router.push(rotaLigacao);
          notif.close();
        };
      } catch {
        // Alguns browsers mobile bloqueiam `new Notification` sem Service Worker.
      }
    }
  }, [bruto, idosoId, router]);

  const painel = useMemo<PainelDaFamilia | null>(() => {
    if (!bruto) return null;
    return {
      ...bruto,
      idoso: {
        ...bruto.idoso,
        horariosDeLigacao: horariosAqui ?? bruto.idoso.horariosDeLigacao,
        atenderSozinho: atenderSozinhoAqui ?? bruto.idoso.atenderSozinho,
      },
      alertas:
        vistosAqui.size === 0
          ? bruto.alertas
          : bruto.alertas.map((alerta) =>
              vistosAqui.has(alerta.id) ? vistoAqui(alerta) : alerta,
            ),
    };
  }, [bruto, vistosAqui, horariosAqui, atenderSozinhoAqui]);

  return {
    painel,
    semConexao,
    marcarVisto,
    responderAviso,
    pedidoDeLigacao,
    ligar,
    trocarHorarios,
    trocarAtenderSozinho,
    salvarPerfil,
    ensinarLembranca,
    corrigirLembranca,
    apagarLembranca,
    anexarDocumento,
    apagarDocumento,
    salvarRedeDeApoio,
    registrarPushFamilia,
  };
}
