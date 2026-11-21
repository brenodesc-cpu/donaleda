import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacidade | Dona Leda',
  description: 'O que a Dona Leda guarda, quem vê e como apagar.',
};

const PARTES: { titulo: string; texto: string[] }[] = [
  {
    titulo: 'O que a Dona Leda é',
    texto: [
      'A Dona Leda é uma assistente virtual de voz, um programa de computador. Ela liga para a pessoa idosa, conversa e conta para a família como a pessoa está. Ela se apresenta sempre como assistente virtual.',
      'Este é um protótipo feito no hackathon UNMUTE by Agora, em 21 e 22 de novembro de 2026.',
    ],
  },
  {
    titulo: 'O que fica guardado',
    texto: [
      'Da família: nome, e-mail e senha da conta, usados só para entrar no aplicativo.',
      'Da pessoa idosa: o nome, como ela gosta de ser chamada, a idade, os remédios e os horários das ligações, que a família cadastra; e, depois de cada conversa, a ficha do dia (sono, comida, remédio, dor, humor, se saiu de casa e se falou com alguém), as lembranças que ajudam a puxar assunto, os avisos para a família e um resumo curto da conversa.',
      'A conversa inteira não é guardada. A fala só fica registrada quando dispara um aviso de segurança, como uma queda ou um pedido de dinheiro por telefone, dentro desse aviso.',
    ],
  },
  {
    titulo: 'Quem vê',
    texto: [
      'Só as pessoas da família que cadastraram a pessoa idosa veem a ficha, as lembranças, os avisos e o resumo.',
      'Quando a pessoa pede pra algo ficar só entre ela e a Dona Leda, essa lembrança fica reservada: a família vê quantas existem, não o que dizem.',
      'A conversa por voz passa pela Agora, que leva o áudio, e pelo modelo de inteligência artificial que entende e responde (Google ou OpenAI, conforme a configuração). Os dados ficam guardados no Supabase.',
      'Nada é vendido nem usado para propaganda.',
    ],
  },
  {
    titulo: 'Saúde e emergência',
    texto: [
      'A Dona Leda não é médica, não dá diagnóstico e não muda remédio. Ela não substitui serviço de emergência: em caso de urgência, orienta ligar para o SAMU no 192 e avisa a família.',
    ],
  },
  {
    titulo: 'Como apagar',
    texto: [
      'Quem cadastrou a pessoa idosa apaga todos os dados dela no aplicativo, em Ajustes, no botão "Apagar os dados". A ficha, as lembranças, os avisos e os aparelhos ligados somem na hora.',
      'Cada lembrança também pode ser corrigida ou apagada uma por uma no painel da família, no quadro "O que a Dona Leda sabe de" seguido do nome da pessoa.',
      'Para apagar a conta da família ou tirar qualquer dúvida, escreva para suporte@virte.com.br.',
    ],
  },
];

export default function PrivacidadePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 bg-background px-5 py-10 text-foreground">
      <h1 className="text-2xl font-semibold md:text-3xl">Privacidade da Dona Leda</h1>
      <p className="text-base text-muted-foreground">Atualizado em 21 de novembro de 2026.</p>
      {PARTES.map((parte) => (
        <section key={parte.titulo} className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{parte.titulo}</h2>
          {parte.texto.map((paragrafo) => (
            <p key={paragrafo.slice(0, 40)} className="text-lg leading-relaxed">
              {paragrafo}
            </p>
          ))}
        </section>
      ))}
      <Link href="/" className="inline-flex min-h-11 items-center self-start text-base text-primary underline underline-offset-4">
        Voltar para a Dona Leda
      </Link>
    </main>
  );
}
