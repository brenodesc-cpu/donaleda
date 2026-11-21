import type { Dia } from '@/lib/tipos';
import {
  CLASSES_DO_TOM,
  diaDaSemanaCurto,
  diaEMes,
  lerAlimentacao,
  lerDor,
  lerFalouComAlguem,
  lerHumor,
  lerRemedio,
  lerSaiuDeCasa,
  lerSono,
  type Leitura,
  type Tom,
} from './formatos';
import { ResumoDaSemana } from './ResumoDaSemana';

interface SemanaProps {
  semana: Dia[];
  hoje: string;
}

interface Linha {
  id: string;
  nome: string;
  ler: (dia: Dia) => Leitura;
  /** Na linha da dor a célula mostra o número em vez do ponto. */
  numero?: (dia: Dia) => number | undefined;
}

const LINHAS: Linha[] = [
  { id: 'sono', nome: 'Sono', ler: lerSono },
  { id: 'comida', nome: 'Comida', ler: lerAlimentacao },
  { id: 'remedio', nome: 'Remédio', ler: lerRemedio },
  {
    id: 'dor',
    nome: 'Dor',
    ler: lerDor,
    numero: (dia) =>
      typeof dia.dor === 'number' ? Math.round(dia.dor) : undefined,
  },
  { id: 'humor', nome: 'Humor', ler: lerHumor },
  { id: 'saiu', nome: 'Saiu', ler: lerSaiuDeCasa },
  { id: 'conversou', nome: 'Conversou', ler: lerFalouComAlguem },
];

const LEGENDA: { tom: Tom; texto: string }[] = [
  { tom: 'bom', texto: 'Foi bem' },
  { tom: 'atencao', texto: 'Pede atenção' },
  { tom: 'neutro', texto: 'Ficou em casa' },
  { tom: 'vazio', texto: 'Sem resposta' },
];

function Ponto({ tom }: { tom: Tom }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-4 w-4 rounded-full ${CLASSES_DO_TOM[tom].ponto}`}
    />
  );
}

function Celula({ linha, dia }: { linha: Linha; dia: Dia }) {
  const leitura = linha.ler(dia);
  const numero = linha.numero?.(dia);

  return (
    <td className="px-1 py-2 text-center align-middle" title={leitura.texto}>
      {numero !== undefined ? (
        <span
          aria-hidden="true"
          className={`text-base font-semibold ${CLASSES_DO_TOM[leitura.tom].valor}`}
        >
          {numero}
        </span>
      ) : (
        <Ponto tom={leitura.tom} />
      )}
      <span className="sr-only">{leitura.texto}</span>
    </td>
  );
}

export function Semana({ semana, hoje }: SemanaProps) {
  const temExemplo = semana.some((dia) => dia.exemplo);

  return (
    <section
      aria-labelledby="titulo-da-semana"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <h2 id="titulo-da-semana" className="text-xl font-semibold text-foreground">
        A semana
      </h2>

      {semana.length > 0 ? <ResumoDaSemana semana={semana} /> : null}

      {semana.length === 0 ? (
        <p className="text-base text-muted-foreground">
          Ainda não há dias registrados.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th scope="col" className="w-20 text-left">
                  <span className="sr-only">O que foi perguntado</span>
                </th>
                {semana.map((dia) => (
                  <th
                    key={dia.data}
                    scope="col"
                    className={`rounded-t-lg px-1 py-2 text-center text-sm font-medium ${
                      dia.data === hoje
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <span className="block">{diaDaSemanaCurto(dia.data)}</span>
                    <span className="block text-foreground">
                      {diaEMes(dia.data).slice(0, 2)}
                      {dia.exemplo ? (
                        <>
                          <span aria-hidden="true">*</span>
                          <span className="sr-only"> (dado de exemplo)</span>
                        </>
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LINHAS.map((linha) => (
                <tr key={linha.id} className="border-t border-border">
                  <th
                    scope="row"
                    className="py-2 pr-2 text-left text-base font-medium text-foreground"
                  >
                    {linha.nome}
                  </th>
                  {semana.map((dia) => (
                    <Celula key={dia.data} linha={linha} dia={dia} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {LEGENDA.map(({ tom, texto }) => (
          <li key={tom} className="flex items-center gap-2">
            <Ponto tom={tom} />
            {texto}
          </li>
        ))}
        <li>Na linha da dor aparece a nota de 0 a 10.</li>
        {temExemplo ? <li>* Dias marcados são dados de exemplo.</li> : null}
      </ul>
    </section>
  );
}
