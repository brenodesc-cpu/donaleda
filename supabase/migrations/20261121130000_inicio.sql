-- Dona Leda: idosos, quem cuida de cada um, a ficha, os aparelhos e os códigos
-- de 6 números que ligam o aparelho ao idoso. Só o servidor (chave secreta) lê
-- e grava: toda tabela tem RLS ligada e nenhuma política.

create table if not exists public.idosos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 120),
  criado_por uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

create table if not exists public.membros (
  idoso_id uuid not null references public.idosos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  papel text not null check (papel in ('responsavel', 'familiar')),
  criado_em timestamptz not null default now(),
  primary key (idoso_id, user_id)
);
create index if not exists membros_por_pessoa on public.membros (user_id, criado_em);

-- A ficha inteira do idoso (o objeto Base de lib/tipos.ts). A versão sobe a cada
-- gravação: quem grava com versão velha perde e lê de novo.
create table if not exists public.fichas (
  idoso_id uuid primary key references public.idosos (id) on delete cascade,
  base jsonb not null,
  versao integer not null default 1,
  atualizado_em timestamptz not null default now()
);

-- O aparelho guarda um token aleatório; aqui fica só o sha256 dele.
create table if not exists public.aparelhos (
  id uuid primary key default gen_random_uuid(),
  idoso_id uuid not null references public.idosos (id) on delete cascade,
  token_hash text not null unique,
  nome text,
  criado_em timestamptz not null default now(),
  visto_em timestamptz
);
create index if not exists aparelhos_por_idoso on public.aparelhos (idoso_id);

create table if not exists public.codigos (
  id bigint generated always as identity primary key,
  codigo text not null unique check (codigo ~ '^[0-9]{6}$'),
  idoso_id uuid not null references public.idosos (id) on delete cascade,
  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '30 minutes'),
  usado_em timestamptz
);
create index if not exists codigos_por_idoso on public.codigos (idoso_id);

alter table public.idosos enable row level security;
alter table public.membros enable row level security;
alter table public.fichas enable row level security;
alter table public.aparelhos enable row level security;
alter table public.codigos enable row level security;

-- Gravação da ficha só se a versão for a que foi lida. Devolve a versão nova,
-- ou nenhuma linha quando outra gravação chegou antes.
create or replace function public.gravar_ficha(p_idoso uuid, p_base jsonb, p_versao integer)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.fichas
     set base = p_base, versao = versao + 1, atualizado_em = now()
   where idoso_id = p_idoso and versao = p_versao
  returning versao;
$$;
revoke all on function public.gravar_ficha(uuid, jsonb, integer) from public, anon, authenticated;

-- Usa o código uma vez só: marca como usado e devolve o idoso, numa operação.
create or replace function public.usar_codigo(p_codigo text)
returns uuid
language sql
security definer
set search_path = public
as $$
  update public.codigos
     set usado_em = now()
   where codigo = p_codigo and usado_em is null and expira_em > now()
  returning idoso_id;
$$;
revoke all on function public.usar_codigo(text) from public, anon, authenticated;
