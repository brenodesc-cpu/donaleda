export const tiposDeInicio = [
  { id: 'pessoas', rotulo: 'Por uma pessoa' },
  { id: 'evento', rotulo: 'Por botão ou sensor' },
  { id: 'solucao', rotulo: 'Pela solução' },
] as const;

export const tiposDeRetorno = [
  { id: 'resumo', rotulo: 'Resumo ou histórico da conversa' },
  { id: 'avisos', rotulo: 'Avisos ou coordenação' },
  { id: 'contato', rotulo: 'Contato ou companhia' },
] as const;

export type Concorrente = {
  nome: string;
  segmento: string;
  inicio: typeof tiposDeInicio[number]['id'];
  retorno: typeof tiposDeRetorno[number]['id'];
  porte?: string;
  oferta: string;
  comparacao: string;
  url?: string;
};

export const concorrentes: Concorrente[] = [
  {
    nome: 'Naian',
    inicio: 'solucao',
    retorno: 'resumo',
    segmento: 'Brasil · Acompanhamento',
    oferta: 'Ligações diárias por IA via WhatsApp, lembretes e relatórios para familiares. Parcerias comerciais com farmácias.',
    comparacao: 'A Dona Leda usa uma tela de chamada com atendimento em um toque e reúne ficha, histórico semanal e avisos em um painel. O WhatsApp da Naian tem a vantagem de usar um canal que muitas famílias já conhecem.',
  },
  {
    nome: 'MemoryLife AI',
    inicio: 'solucao',
    retorno: 'contato',
    segmento: 'Brasil · Acompanhamento',
    oferta: 'A assistente Helena inicia ligações, lembra de conversas e oferece lembretes. Atende pelo telefone comum e tem oferta para instituições.',
    comparacao: 'A Dona Leda acrescenta uma interface visual à rotina de chamadas. Se a ligação não for atendida, ela repete a tentativa e registra um aviso. O telefone comum da Helena facilita o acesso sem um aparelho com internet.',
  },
  {
    nome: 'Ello Care',
    inicio: 'solucao',
    retorno: 'resumo',
    segmento: 'Brasil · Acompanhamento',
    oferta: 'Ligações de acompanhamento, lembretes e resumos para familiares, com foco na rotina.',
    comparacao: 'O acompanhamento da rotina é um ponto em comum. Na Dona Leda, a família pode consultar a ficha da semana e ver relatos que pedem atenção, como um pedido de Pix ou senha contado durante a ligação.',
  },
  {
    nome: 'ElderCare',
    inicio: 'pessoas',
    retorno: 'avisos',
    segmento: 'Brasil · Rede de cuidado',
    oferta: 'Plataforma de apoio a pessoas idosas, famílias e cuidadores, com integração da rede de cuidado.',
    comparacao: 'A Dona Leda começa pela conversa direta com a pessoa idosa e registra o que ela contou. A proposta da ElderCare tem foco mais amplo na articulação entre família e cuidadores.',
  },
  {
    nome: 'Joy Calls',
    inicio: 'solucao',
    retorno: 'resumo',
    segmento: 'EUA · Acompanhamento',
    url: 'https://joycalls.ai',
    oferta: 'Ligações programadas pelo telefone comum, resumo por SMS e avisos de chamadas não atendidas.',
    comparacao: 'As duas iniciam chamadas e avisam a família. Na Dona Leda, a conversa acontece em português do Brasil e a família consulta a ficha do dia e da semana em um painel. O SMS da Joy Calls leva o resumo direto à família.',
  },
  {
    nome: 'inTouch',
    inicio: 'solucao',
    retorno: 'resumo',
    porte: 'Centenas de usuários em abr. de 2025, segundo a empresa.',
    segmento: 'Europa · Acompanhamento',
    url: 'https://intouch.family',
    oferta: 'Conversas por IA no telefone fixo ou celular, com resumos, sinais de humor e alertas para a família.',
    comparacao: 'As duas combinam conversa e acompanhamento familiar. A Dona Leda organiza a ficha em torno dos relatos do dia e inclui avisos sobre possíveis golpes. O telefone da inTouch permite atender sem parear uma tela.',
  },
  {
    nome: 'TeleHelp',
    inicio: 'evento',
    retorno: 'avisos',
    porte: '1 milhão de atendimentos acumulados, segundo a empresa.',
    segmento: 'Brasil · Teleassistência',
    url: 'https://telehelp.com.br',
    oferta: 'Botão de emergência e central de atendimento, com opções de detecção de queda e localização.',
    comparacao: 'A Dona Leda entra na rotina antes de uma urgência, com conversa programada e registro do que a pessoa relatou. A central da TeleHelp atende à necessidade de pedir socorro.',
  },
  {
    nome: 'Tecnosenior',
    inicio: 'evento',
    retorno: 'avisos',
    porte: 'Mais de 10 anos de atuação no levantamento. Base de clientes não informada.',
    segmento: 'Brasil · Teleassistência',
    url: 'https://tecnosenior.com',
    oferta: 'Dispositivos para pedir ajuda, com sensores e localização conforme o equipamento.',
    comparacao: 'A Dona Leda capta o contexto de sono, alimentação ou mal-estar a partir do que a pessoa conta. Sensores e dispositivos da Tecnosenior cumprem um papel próprio de proteção.',
  },
  {
    nome: 'Komp',
    inicio: 'pessoas',
    retorno: 'contato',
    porte: '14 mil famílias reportadas no levantamento.',
    segmento: 'Noruega · Aparelho dedicado',
    url: 'https://komp.family',
    oferta: 'Tela simplificada para familiares enviarem fotos e fazerem chamadas, com atendimento automático para contatos autorizados.',
    comparacao: 'A simplicidade para atender é um ponto em comum. Na Dona Leda, a assistente inicia a conversa no horário combinado e pode usar um celular ou tablet compatível que a pessoa já tenha.',
  },
  {
    nome: 'ElliQ',
    inicio: 'solucao',
    retorno: 'contato',
    porte: '800 pessoas idosas no piloto de Nova York.',
    segmento: 'EUA · Aparelho dedicado',
    url: 'https://elliq.com',
    oferta: 'Robô de mesa que inicia interações, faz companhia e sugere atividades.',
    comparacao: 'As duas podem iniciar a interação. A Dona Leda usa uma chamada agendada e organiza o relato para a família acompanhar em um painel, em um aparelho compatível com internet.',
  },
];
