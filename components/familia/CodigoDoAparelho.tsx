'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Link2 } from 'lucide-react';
import type { CodigoDoAparelho as Codigo, IdosoDaFamilia } from '@/lib/tipos';
import { deuCerto, gerarCodigo } from './api';
import { CLASSE_DO_BOTAO_PRINCIPAL, CLASSE_DO_BOTAO_SECUNDARIO, Erro } from './campos';

interface CodigoDoAparelhoProps {
  idoso: IdosoDaFamilia;
  /** Busca de novo a lista, pra ver se o aparelho já foi ligado. */
  onConferir: () => void;
}

function separar(codigo: string): string {
  const digitos = codigo.replace(/\D/g, '');
  return digitos.length === 6 ? `${digitos.slice(0, 3)} ${digitos.slice(3)}` : codigo;
}

function relogio(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos}:${String(resto).padStart(2, '0')}`;
}

/** Gera o código de 6 números e acompanha até o aparelho do idoso usar. */
export function CodigoDoAparelho({ idoso, onConferir }: CodigoDoAparelhoProps) {
  const [codigo, setCodigo] = useState<Codigo | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [restam, setRestam] = useState(0);
  const [aparelhosAntes, setAparelhosAntes] = useState(idoso.aparelhos);
  const [copiado, setCopiado] = useState(false);
  const ligouAgora = codigo !== null && idoso.aparelhos > aparelhosAntes;

  useEffect(() => {
    if (!codigo || ligouAgora) return;
    const fim = new Date(codigo.expiraEm).getTime();
    const contar = () => setRestam(Math.max(0, Math.round((fim - Date.now()) / 1000)));
    contar();
    const relogioId = setInterval(contar, 1000);
    const conferirId = setInterval(onConferir, 4000);
    return () => {
      clearInterval(relogioId);
      clearInterval(conferirId);
    };
  }, [codigo, ligouAgora, onConferir]);

  const handleGerar = async () => {
    setGerando(true);
    setErro(null);
    setAparelhosAntes(idoso.aparelhos);
    const { status, dado } = await gerarCodigo(idoso.id);
    setGerando(false);
    if (deuCerto(status) && dado?.codigo) {
      setRestam(Math.max(0, Math.round((new Date(dado.expiraEm).getTime() - Date.now()) / 1000)));
      setCodigo(dado);
    } else setErro('Não deu pra gerar o código agora. Tente de novo.');
  };

  const handleCopiarLink = async () => {
    if (!codigo) return;
    const link = `${window.location.origin}/parear?codigo=${codigo.codigo}`;
    const texto = `Abra este link no seu celular pra ligar a Dona Leda: ${link}`;
    try {
      if (navigator.share) await navigator.share({ text: texto });
      else await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };

  if (ligouAgora) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-2xl bg-success-soft p-6 text-center">
        <CheckCircle2 aria-hidden="true" className="h-12 w-12 text-success" />
        <p className="text-xl font-semibold text-success">Aparelho ligado</p>
        <p className="text-base text-foreground">
          A partir de agora a Dona Leda liga pra {idoso.tratamento} nesse aparelho.
        </p>
      </div>
    );
  }

  if (!codigo || restam === 0) {
    return (
      <div className="flex flex-col gap-3">
        {codigo ? <p className="text-base text-warning">O código venceu. Gere outro.</p> : null}
        <Erro texto={erro} />
        <button type="button" onClick={handleGerar} disabled={gerando} className={CLASSE_DO_BOTAO_PRINCIPAL}>
          {gerando ? 'Gerando...' : 'Gerar o código'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-base text-muted-foreground">Código do aparelho</p>
      <p
        aria-label={`Código ${codigo.codigo.split('').join(' ')}`}
        className="font-mono text-6xl font-bold tracking-widest text-foreground md:text-7xl"
      >
        {separar(codigo.codigo)}
      </p>
      <p className="text-base text-muted-foreground" aria-live="off">
        Vale por mais {relogio(restam)}
      </p>
      <button type="button" onClick={handleCopiarLink} className={CLASSE_DO_BOTAO_PRINCIPAL}>
        <Link2 aria-hidden="true" className="h-5 w-5" />
        {copiado ? 'Link pronto pra mandar' : `Mandar o link pra ${idoso.tratamento}`}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Quem abre o link no celular de {idoso.tratamento} liga o aparelho sem digitar nada.
      </p>
      <button type="button" onClick={handleGerar} disabled={gerando} className={`${CLASSE_DO_BOTAO_SECUNDARIO} sm:w-auto`}>
        Gerar outro código
      </button>
    </div>
  );
}
