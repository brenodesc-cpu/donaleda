// Sinalização de chamada recebida pro aparelho do idoso, mesmo com o app fechado
// ou a tela bloqueada:
//   1. Agora Signaling (RTM REST API): entrega em tempo real se o aparelho estiver conectado;
//   2. FCM HTTP v1 (Android): push de dados em prioridade alta que acorda a tela nativa;
//   3. APNs VoIP HTTP/2 (iOS): PushKit + CallKit nativo.
//
// Regra de privacidade: o payload nunca carrega dados clínicos ou pessoais do idoso —
// apenas identificador da chamada, motivo e nome da assistente.

import { createSign, randomUUID } from 'node:crypto';
import http2 from 'node:http2';
import { AgoraClient, Area, generateConvoAIToken, generateRtcToken } from 'agora-agents';
import { NOME_DA_ASSISTENTE } from './assistente';
import type { AparelhoPush, Base, Chamada, Escalonamento } from './tipos';

export interface ResultadoDaSinalizacao {
  agoraSignaling: 'enviado' | 'nao_configurado' | 'erro';
  fcmEnviados: number;
  apnsEnviados: number;
  erros: string[];
}

interface ContaDeServicoFirebase {
  project_id: string;
  client_email: string;
  private_key: string;
}

const TIMEOUT_MS = 6_000;
let tokenGoogleCache: { valor: string; expiraEmMs: number } | null = null;

function base64Url(entrada: Buffer | string): string {
  return Buffer.from(entrada)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/** Identificador determinístico do usuário no Agora Signaling (RTM) para este idoso. */
export function usuarioAgoraRtm(idosoId: string): string {
  return `idoso-${idosoId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)}`;
}

export function lerContaDeServicoFirebase(): ContaDeServicoFirebase | null {
  const bruto = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!bruto) return null;
  try {
    const texto = bruto.startsWith('{')
      ? bruto
      : Buffer.from(bruto, 'base64').toString('utf8');
    const json = JSON.parse(texto) as Partial<ContaDeServicoFirebase>;
    if (!json.project_id || !json.client_email || !json.private_key) return null;
    return {
      project_id: json.project_id,
      client_email: json.client_email,
      private_key: json.private_key.replace(/\\n/g, '\n'),
    };
  } catch {
    return null;
  }
}

async function obterTokenOAuthGoogle(conta: ContaDeServicoFirebase): Promise<string> {
  const agoraMs = Date.now();
  if (tokenGoogleCache && tokenGoogleCache.expiraEmMs > agoraMs + 60_000) {
    return tokenGoogleCache.valor;
  }

  const agoraSeg = Math.floor(agoraMs / 1000);
  const cabecalho = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const corpo = base64Url(
    JSON.stringify({
      iss: conta.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: agoraSeg,
      exp: agoraSeg + 3600,
    }),
  );

  const assinador = createSign('RSA-SHA256');
  assinador.update(`${cabecalho}.${corpo}`);
  assinador.end();
  const assinatura = base64Url(assinador.sign(conta.private_key));
  const assertion = `${cabecalho}.${corpo}.${assinatura}`;

  const resposta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!resposta.ok) {
    throw new Error(`oauth_google_${resposta.status}`);
  }
  const dados = (await resposta.json()) as { access_token?: string; expires_in?: number };
  if (!dados.access_token) throw new Error('oauth_google_sem_token');

  tokenGoogleCache = {
    valor: dados.access_token,
    expiraEmMs: agoraMs + (dados.expires_in ?? 3600) * 1000,
  };
  return dados.access_token;
}

/** Publica convite de chamada via Agora Signaling (RTM) REST API para o aparelho do idoso. */
async function enviarAgoraSignaling(
  idosoId: string,
  payload: Record<string, string>,
): Promise<'enviado' | 'nao_configurado' | 'erro'> {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim();
  const customerId = process.env.NEXT_AGORA_CUSTOMER_ID?.trim();
  const customerSecret = process.env.NEXT_AGORA_CUSTOMER_SECRET?.trim();
  if (!appId || !customerId || !customerSecret) return 'nao_configurado';

  const destino = usuarioAgoraRtm(idosoId);
  const auth = Buffer.from(`${customerId}:${customerSecret}`).toString('base64');
  const url = `https://api.agora.io/dev/v2/project/${encodeURIComponent(appId)}/rtm/users/donaleda-server/peer_messages?wait_for_ack=false`;

  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination: destino,
        enable_offline_messaging: true,
        enable_historical_messaging: false,
        payload: JSON.stringify(payload),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return resposta.ok ? 'enviado' : 'erro';
  } catch {
    return 'erro';
  }
}

/** Envia push de dados em prioridade alta via FCM HTTP v1 (acorda Android com app fechado). */
async function enviarFcmV1(
  conta: ContaDeServicoFirebase,
  accessToken: string,
  deviceToken: string,
  dados: Record<string, string>,
): Promise<boolean> {
  const url = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(conta.project_id)}/messages:send`;
  const resposta = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        // Data-only + HIGH priority: garante que onMessageReceived rode mesmo com o app morto
        // e abra a tela nativa de ligação em tela cheia (CallStyle + Full-Screen Intent).
        data: dados,
        android: {
          priority: 'HIGH',
          ttl: '45s',
        },
      },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return resposta.ok;
}

/** Envia PushKit VoIP via APNs HTTP/2 para acordar CallKit no iOS mesmo com app fechado. */
async function enviarApnsVoip(
  deviceToken: string,
  dados: Record<string, string>,
): Promise<boolean> {
  const keyId = process.env.APNS_KEY_ID?.trim();
  const teamId = process.env.APNS_TEAM_ID?.trim();
  const privateKey = process.env.APNS_PRIVATE_KEY?.trim()?.replace(/\\n/g, '\n');
  if (!keyId || !teamId || !privateKey) return false;

  const bundleId = process.env.APNS_BUNDLE_ID?.trim() || 'app.donaleda';
  const host =
    process.env.APNS_SANDBOX === '1'
      ? 'https://api.sandbox.push.apple.com'
      : 'https://api.push.apple.com';

  const cabecalho = base64Url(JSON.stringify({ alg: 'ES256', kid: keyId }));
  const corpo = base64Url(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) }));
  const assinador = createSign('SHA256');
  assinador.update(`${cabecalho}.${corpo}`);
  assinador.end();
  const assinatura = base64Url(
    assinador.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }),
  );
  const jwt = `${cabecalho}.${corpo}.${assinatura}`;

  return new Promise<boolean>((resolve) => {
    const client = http2.connect(host);
    const timer = setTimeout(() => {
      client.close();
      resolve(false);
    }, TIMEOUT_MS);

    client.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${encodeURIComponent(deviceToken)}`,
      authorization: `bearer ${jwt}`,
      'apns-topic': `${bundleId}.voip`,
      'apns-push-type': 'voip',
      'apns-priority': '10',
      'apns-expiration': String(Math.floor(Date.now() / 1000) + 45),
      'content-type': 'application/json',
    });

    let status = 0;
    req.on('response', (headers) => {
      status = Number(headers[':status'] ?? 0);
    });
    req.on('end', () => {
      clearTimeout(timer);
      client.close();
      resolve(status >= 200 && status < 300);
    });
    req.on('error', () => {
      clearTimeout(timer);
      client.close();
      resolve(false);
    });

    req.end(
      JSON.stringify({
        aps: { 'content-available': 1 },
        ...dados,
      }),
    );
  });
}

/** Envia notificação push padrão (Alert) via APNs HTTP/2 para o iPhone do familiar responsável. */
async function enviarApnsAlerta(
  deviceToken: string,
  titulo: string,
  mensagem: string,
  urgente: boolean,
  dados: Record<string, string>,
): Promise<boolean> {
  const keyId = process.env.APNS_KEY_ID?.trim();
  const teamId = process.env.APNS_TEAM_ID?.trim();
  const privateKey = process.env.APNS_PRIVATE_KEY?.trim()?.replace(/\\n/g, '\n');
  if (!keyId || !teamId || !privateKey) return false;

  const bundleId = process.env.APNS_BUNDLE_ID?.trim() || 'app.donaleda';
  const host =
    process.env.APNS_SANDBOX === '1'
      ? 'https://api.sandbox.push.apple.com'
      : 'https://api.push.apple.com';

  const cabecalho = base64Url(JSON.stringify({ alg: 'ES256', kid: keyId }));
  const corpo = base64Url(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) }));
  const assinador = createSign('SHA256');
  assinador.update(`${cabecalho}.${corpo}`);
  assinador.end();
  const assinatura = base64Url(
    assinador.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }),
  );
  const jwt = `${cabecalho}.${corpo}.${assinatura}`;

  return new Promise<boolean>((resolve) => {
    const client = http2.connect(host);
    const timer = setTimeout(() => {
      client.close();
      resolve(false);
    }, TIMEOUT_MS);

    client.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${encodeURIComponent(deviceToken)}`,
      authorization: `bearer ${jwt}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': urgente ? '10' : '5',
      'content-type': 'application/json',
    });

    let status = 0;
    req.on('response', (headers) => {
      status = Number(headers[':status'] ?? 0);
    });
    req.on('end', () => {
      clearTimeout(timer);
      client.close();
      resolve(status >= 200 && status < 300);
    });
    req.on('error', () => {
      clearTimeout(timer);
      client.close();
      resolve(false);
    });

    req.end(
      JSON.stringify({
        aps: {
          alert: { title: titulo, body: mensagem },
          sound: 'default',
          'interruption-level': urgente ? 'time-sensitive' : 'active',
        },
        ...dados,
      }),
    );
  });
}

/**
 * Envia notificação push (Android FCM + iOS APNs Alert) para todos os celulares
 * cadastrados da família responsável. Nunca lança exceção para não travar a conversa.
 */
export async function notificarFamiliaPorPush(
  base: Base,
  aviso: {
    alertaId?: string;
    titulo: string;
    mensagem: string;
    gravidade: 'atencao' | 'urgente';
    tipo: string;
    /** Rota relativa para abrir direto ao tocar (ex.: "/familia/ligacao?idoso=..."). */
    urlDestino?: string;
    /** true quando a ligação com o idoso está ao vivo e a família pode entrar agora. */
    entrarAoVivo?: boolean;
  },
): Promise<{ fcmEnviados: number; apnsEnviados: number }> {
  const aparelhosFamilia = base.aparelhosFamiliaPush ?? [];
  if (aparelhosFamilia.length === 0) return { fcmEnviados: 0, apnsEnviados: 0 };

  const urgente = aviso.gravidade === 'urgente';
  const payload: Record<string, string> = {
    tipo: urgente ? 'alerta_urgente' : 'alerta_familia',
    gravidade: aviso.gravidade,
    categoria: aviso.tipo,
    alertaId: aviso.alertaId ?? '',
    assistente: NOME_DA_ASSISTENTE,
    titulo: aviso.titulo.slice(0, 120),
    mensagem: aviso.mensagem.slice(0, 240),
    urlDestino: aviso.urlDestino ?? '/familia',
    entrarAoVivo: aviso.entrarAoVivo ? '1' : '0',
  };

  let fcmEnviados = 0;
  let apnsEnviados = 0;

  const androids = aparelhosFamilia.filter((a) => a.plataforma === 'android');
  const ioss = aparelhosFamilia.filter((a) => a.plataforma === 'ios');

  const tarefaAndroid = (async () => {
    if (androids.length === 0) return;
    const conta = lerContaDeServicoFirebase();
    if (!conta) return;
    try {
      const token = await obterTokenOAuthGoogle(conta);
      const envios = await Promise.all(
        androids.map((a) => enviarFcmV1(conta, token, a.token, payload).catch(() => false)),
      );
      fcmEnviados = envios.filter(Boolean).length;
    } catch {
      // Falha silenciosa: o alerta continua garantido no painel.
    }
  })();

  const tarefaIos = (async () => {
    if (ioss.length === 0) return;
    const envios = await Promise.all(
      ioss.map((a) =>
        enviarApnsAlerta(a.token, payload.titulo, payload.mensagem, urgente, payload).catch(() => false),
      ),
    );
    apnsEnviados = envios.filter(Boolean).length;
  })();

  await Promise.allSettled([tarefaAndroid, tarefaIos]);
  return { fcmEnviados, apnsEnviados };
}

/**
 * Monta o payload mínimo sem dados pessoais/clínicos para acordar o aparelho do idoso.
 */
export function montarPayloadDeChamada(chamada: Chamada): Record<string, string> {
  return {
    tipo: 'chamada',
    chamadaId: chamada.id,
    motivo: chamada.motivo,
    horario: chamada.horario ?? '',
    assistente: NOME_DA_ASSISTENTE,
    pedidaEm: chamada.pedidaEm,
  };
}

/**
 * Dispara o convite de ligação por todos os canais configurados (Agora Signaling + FCM + APNs VoIP).
 * Nunca lança exceção para não travar a resposta da família ou do agendador.
 */
export async function dispararConviteDeChamada(
  idosoId: string,
  aparelhos: AparelhoPush[] | undefined,
  chamada: Chamada,
): Promise<ResultadoDaSinalizacao> {
  const payload = montarPayloadDeChamada(chamada);
  const resultado: ResultadoDaSinalizacao = {
    agoraSignaling: 'nao_configurado',
    fcmEnviados: 0,
    apnsEnviados: 0,
    erros: [],
  };

  const lista = aparelhos ?? [];
  const androids = lista.filter((a) => a.plataforma === 'android');
  const ioss = lista.filter((a) => a.plataforma === 'ios');

  const tarefaAgora = enviarAgoraSignaling(idosoId, payload).then((status) => {
    resultado.agoraSignaling = status;
  });

  const tarefaAndroid = (async () => {
    if (androids.length === 0) return;
    const conta = lerContaDeServicoFirebase();
    if (!conta) return;
    try {
      const accessToken = await obterTokenOAuthGoogle(conta);
      const envios = await Promise.all(
        androids.map((a) => enviarFcmV1(conta, accessToken, a.token, payload).catch(() => false)),
      );
      resultado.fcmEnviados = envios.filter(Boolean).length;
    } catch (e) {
      resultado.erros.push(e instanceof Error ? e.message : 'fcm_erro');
    }
  })();

  const tarefaIos = (async () => {
    if (ioss.length === 0) return;
    const envios = await Promise.all(
      ioss.map((a) => enviarApnsVoip(a.token, payload).catch(() => false)),
    );
    resultado.apnsEnviados = envios.filter(Boolean).length;
  })();

  await Promise.allSettled([tarefaAgora, tarefaAndroid, tarefaIos]);
  return resultado;
}

/**
 * Dispara ligação telefônica real (PSTN/SIP) via SDK oficial da Agora (`client.telephony.call`)
 * para um familiar da rede de apoio quando AGORA_TELEPHONY_FROM_NUMBER estiver configurado.
 */
async function ligarFamiliarViaAgoraTelephony(
  idosoId: string,
  tratamento: string,
  contato: { nome: string; telefone: string },
  motivo: string,
): Promise<boolean> {
  const fromNumber = process.env.AGORA_TELEPHONY_FROM_NUMBER?.trim();
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim();
  const appCertificate = process.env.NEXT_AGORA_APP_CERTIFICATE?.trim();
  if (!fromNumber || !appId || !appCertificate) return false;

  const customerId = process.env.NEXT_AGORA_CUSTOMER_ID?.trim();
  const customerSecret = process.env.NEXT_AGORA_CUSTOMER_SECRET?.trim();
  const canal = `alerta-familia-${idosoId.slice(0, 8)}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const sipUid = 2001;
  const agentUid = 2002;
  const sipToken = generateRtcToken({ appId, appCertificate, channel: canal, uid: sipUid });
  const agentToken = generateRtcToken({ appId, appCertificate, channel: canal, uid: agentUid });
  const pipelineId = process.env.AGORA_TELEPHONY_PIPELINE_ID?.trim();

  const client =
    customerId && customerSecret
      ? new AgoraClient({ area: Area.US, appId, appCertificate, customerId, customerSecret })
      : new AgoraClient({
          area: Area.US,
          appId,
          appCertificate,
          authToken: generateConvoAIToken({ appId, appCertificate, channelName: canal, uid: 0 }),
        });

  const saudacao = `Olá ${contato.nome}, aqui é a ${NOME_DA_ASSISTENTE}, assistente virtual de ${tratamento}. ${motivo} Por favor, entre em contato com ${tratamento} assim que possível.`;
  const propriedadesBase = {
    channel: canal,
    token: agentToken,
    agent_rtc_uid: String(agentUid),
    remote_rtc_uids: [String(sipUid)],
    idle_timeout: 45,
  };

  // Contrato oficial da Agora (`CallTelephonyRequest`):
  // - Com `pipeline_id` (AI Studio): basta channel, token, agent_rtc_uid e remote_rtc_uids.
  // - Sem `pipeline_id`: exige configuração completa (llm + asr + tts) dentro de `properties`.
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const properties = pipelineId
    ? propriedadesBase
    : {
        ...propriedadesBase,
        asr: { language: 'pt-BR' },
        llm: {
          url: 'https://api.openai.com/v1/chat/completions',
          ...(openaiKey ? { api_key: openaiKey } : {}),
          system_messages: [
            {
              role: 'system',
              content: `Você é a ${NOME_DA_ASSISTENTE}, assistente virtual de voz. Avise ${contato.nome} de forma curta, calma e clara sobre o ocorrido com ${tratamento}: ${motivo} Peça para ligar ou ir verificar como ${tratamento} está.`,
            },
          ],
          greeting_message: saudacao,
          failure_message: 'Só um instante, por favor.',
          max_history: 10,
          params: { model: 'gpt-4o-mini' },
        },
        tts: {
          vendor: 'openai',
          params: {
            ...(openaiKey ? { api_key: openaiKey } : {}),
            model: 'tts-1',
            voice: 'nova',
          },
        },
      };

  try {
    await client.telephony.call({
      appid: appId,
      name: `escalonamento-${canal}`,
      sip: {
        to_number: contato.telefone,
        from_number: fromNumber,
        rtc_uid: String(sipUid),
        rtc_token: sipToken,
      },
      ...(pipelineId ? { pipeline_id: pipelineId } : {}),
      properties,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Dispara ligação telefônica em paralelo via Agora Telephony (quando configurado) para a
 * rede de apoio em uma emergência urgente durante a conversa, sem encerrar a call do idoso.
 */
export async function dispararLigacaoDeEmergenciaParaRede(
  idosoId: string,
  base: Base,
  motivo: string,
): Promise<number> {
  const contatos = base.redeDeApoio ?? [];
  const temTelephonyAgora = Boolean(
    contatos.length > 0 &&
      process.env.AGORA_TELEPHONY_FROM_NUMBER?.trim() &&
      process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim() &&
      process.env.NEXT_AGORA_APP_CERTIFICATE?.trim(),
  );
  if (!temTelephonyAgora) return 0;

  const resultados = await Promise.allSettled(
    contatos.map((c) =>
      ligarFamiliarViaAgoraTelephony(idosoId, base.idoso.tratamento, c, motivo),
    ),
  );
  return resultados.filter((r) => r.status === 'fulfilled' && r.value).length;
}

/**
 * Escalonamento quando as tentativas da hora marcada acabam sem atendimento:
 *   1. Aciona todos os contatos da rede de apoio via Agora Conversational AI Telephony (se configurado);
 *   2. Dispara push crítico (Agora Signaling + FCM / APNs) pros aparelhos de familiares cadastrados;
 *   3. Devolve registro auditável (`Escalonamento`) pra ficar visível no painel da família.
 */
export async function dispararEscalonamentoEmMassa(
  idosoId: string,
  base: Base,
  chamada: Chamada,
  agora: Date = new Date(),
): Promise<Escalonamento> {
  const hora = chamada.horario ?? '';
  const motivo = `${base.idoso.tratamento} não atendeu ${chamada.tentativa} tentativas da ligação${hora ? ` das ${hora}` : ''}.`;
  const contatos = base.redeDeApoio ?? [];
  const temTelephonyAgora = Boolean(
    process.env.AGORA_TELEPHONY_FROM_NUMBER?.trim() &&
      process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim() &&
      process.env.NEXT_AGORA_APP_CERTIFICATE?.trim(),
  );

  // 1. Disparo de ligação telefônica em paralelo via Agora Telephony (quando configurado).
  const resultadosContatos = await Promise.all(
    contatos.map(async (c) => {
      if (temTelephonyAgora) {
        const ligou = await ligarFamiliarViaAgoraTelephony(
          idosoId,
          base.idoso.tratamento,
          c,
          motivo,
        );
        return {
          nome: c.nome,
          telefone: c.telefone,
          canal: 'agora_telephony' as const,
          ok: ligou,
        };
      }
      // Sem a telefonia ligada, ninguém da rede recebeu nada: fica registrado como não acionado.
      return {
        nome: c.nome,
        telefone: c.telefone,
        canal: 'painel' as const,
        ok: false,
      };
    }),
  );

  // 2. Push de alerta urgente pros celulares de familiares cadastrados (Android FCM + iOS APNs Alert).
  await notificarFamiliaPorPush(base, {
    alertaId: chamada.id,
    titulo: `Urgente: ${base.idoso.tratamento} não atendeu`,
    mensagem: motivo,
    gravidade: 'urgente',
    tipo: 'ligacao',
  });

  return {
    id: randomUUID(),
    chamadaId: chamada.id,
    criadoEm: agora.toISOString(),
    motivo,
    contatosAcionados: resultadosContatos,
  };
}

