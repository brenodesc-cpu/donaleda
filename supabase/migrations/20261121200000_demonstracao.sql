-- A conta de minutos da demonstração pública (/experimente). Uma linha por
-- ligação reservada: o dia, a hora e dois códigos embaralhados que mudam todo
-- dia (do visitante e da rede). Não guarda endereço, nome nem nada do que foi dito.

create table if not exists public.demonstracoes (
  id bigint generated always as identity primary key,
  dia date not null,
  visitante text not null check (char_length(visitante) between 1 and 64),
  rede text not null check (char_length(rede) between 1 and 64),
  segundos integer not null check (segundos between 1 and 600),
  criado_em timestamptz not null default now()
);
create index if not exists demonstracoes_por_dia on public.demonstracoes (dia);

alter table public.demonstracoes enable row level security;

-- Confere o total do dia, o do visitante e o da rede e reserva numa operação só.
-- Devolve 'ok', 'cheia', 'visitante' ou 'rede'.
create or replace function public.reservar_demonstracao(
  p_dia date,
  p_visitante text,
  p_rede text,
  p_segundos integer,
  p_teto_dia integer,
  p_teto_visitante integer,
  p_teto_rede integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_do_visitante integer;
  v_da_rede integer;
begin
  -- Uma reserva por vez em cada dia, pra duas ao mesmo tempo não passarem do total.
  perform pg_advisory_xact_lock(hashtext('demonstracao:' || p_dia::text));
  select coalesce(sum(segundos), 0) into v_total from public.demonstracoes where dia = p_dia;
  if v_total + p_segundos > p_teto_dia then
    return 'cheia';
  end if;
  select count(*) into v_do_visitante from public.demonstracoes where dia = p_dia and visitante = p_visitante;
  if v_do_visitante >= p_teto_visitante then
    return 'visitante';
  end if;
  select count(*) into v_da_rede from public.demonstracoes where dia = p_dia and rede = p_rede;
  if v_da_rede >= p_teto_rede then
    return 'rede';
  end if;
  insert into public.demonstracoes (dia, visitante, rede, segundos)
  values (p_dia, p_visitante, p_rede, p_segundos);
  return 'ok';
end;
$$;
revoke all on function public.reservar_demonstracao(date, text, text, integer, integer, integer, integer)
  from public, anon, authenticated;
