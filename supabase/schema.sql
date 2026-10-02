-- ==========================================================
-- REALIZA CONSULTORIA IMOBILIÁRIA — BANCO DE DADOS (SUPABASE)
-- Cole TODO este arquivo em: Supabase → SQL Editor → New query → Run
-- Pode ser executado de novo sem perder dados (idempotente).
-- ==========================================================

create extension if not exists pgcrypto;

-- ---------- TABELAS ----------
create table if not exists public.corretores (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid unique references auth.users(id) on delete set null,
  email          text unique,
  nome           text not null,
  creci          text,
  whatsapp       text,
  especialidades text[] not null default '{}',
  bio            text,
  foto_url       text,
  ativo          boolean not null default true,
  is_admin       boolean not null default false,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

create table if not exists public.imoveis (
  id                   uuid primary key default gen_random_uuid(),
  codigo               text not null unique,
  titulo               text not null,
  tipo                 text not null default 'Apartamento',
  finalidade           text not null default 'venda' check (finalidade in ('venda','locacao')),
  status_obra          text not null default 'pronto' check (status_obra in ('pronto','lancamento','em_construcao')),
  preco                numeric(14,2),
  condominio           numeric(10,2),
  iptu                 numeric(10,2),
  cidade               text,
  bairro               text,
  endereco             text,            -- interno: NÃO é exposto no site público
  area_privativa       numeric(10,2),
  area_total           numeric(10,2),
  quartos              int, suites int, banheiros int, vagas int, andar int, ano int,
  descricao            text,
  diferenciais         text[] not null default '{}',
  fotos                text[] not null default '{}',
  aceita_financiamento boolean not null default true,
  aceita_fgts          boolean not null default false,
  mcmv                 boolean not null default false,
  destaque             boolean not null default false,
  publicado            boolean not null default false,
  video_url            text,
  tour_url             text,
  ficha_pdf_url        text,
  corretor_id          uuid references public.corretores(id) on delete set null,
  criado_em            timestamptz not null default now(),
  atualizado_em        timestamptz not null default now()
);

create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null check (char_length(nome) between 2 and 120),
  telefone        text not null check (char_length(telefone) between 8 and 30),
  email           text check (email is null or char_length(email) <= 160),
  interesse       text check (interesse is null or char_length(interesse) <= 60),
  mensagem        text check (mensagem is null or char_length(mensagem) <= 2000),
  origem          text check (origem is null or char_length(origem) <= 60),
  imovel_id       uuid references public.imoveis(id) on delete set null,
  imovel_ref      text check (imovel_ref is null or char_length(imovel_ref) <= 200),
  corretor_id     uuid references public.corretores(id) on delete set null,
  status          text not null default 'novo'
                  check (status in ('novo','contato','visita','proposta','documentacao','ganho','perdido')),
  valor_estimado  numeric(14,2),
  proximo_contato date,
  motivo_perda    text,
  consentimento   boolean not null default false,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create table if not exists public.lead_interacoes (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  corretor_id uuid references public.corretores(id) on delete set null,
  tipo        text not null default 'nota',
  texto       text not null check (char_length(texto) <= 2000),
  criado_em   timestamptz not null default now()
);

create index if not exists leads_status_idx     on public.leads (status);
create index if not exists leads_corretor_idx   on public.leads (corretor_id);
create index if not exists leads_criado_idx     on public.leads (criado_em desc);
create index if not exists interacoes_lead_idx  on public.lead_interacoes (lead_id, criado_em desc);
create index if not exists imoveis_pub_idx      on public.imoveis (publicado, destaque);

-- ---------- FUNÇÕES AUXILIARES ----------
create or replace function public.meu_corretor_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.corretores where user_id = auth.uid() and ativo limit 1
$$;

create or replace function public.is_corretor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.corretores where user_id = auth.uid() and ativo)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.corretores where user_id = auth.uid() and ativo and is_admin)
$$;

-- Vincula o usuário logado ao cadastro de corretor com o mesmo e-mail (1º acesso)
create or replace function public.reivindicar_corretor() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  if exists (select 1 from public.corretores where user_id = auth.uid()) then return; end if;
  perform set_config('rz.reivindicando', '1', true);
  update public.corretores
     set user_id = auth.uid()
   where user_id is null
     and lower(email) = lower(auth.jwt() ->> 'email');
end $$;

revoke all on function public.reivindicar_corretor() from public, anon;
grant execute on function public.reivindicar_corretor() to authenticated;

-- Atualiza "atualizado_em"
create or replace function public.tocar_atualizado() returns trigger language plpgsql as $$
begin new.atualizado_em := now(); return new; end $$;

drop trigger if exists t_corretores_upd on public.corretores;
create trigger t_corretores_upd before update on public.corretores for each row execute function public.tocar_atualizado();
drop trigger if exists t_imoveis_upd on public.imoveis;
create trigger t_imoveis_upd before update on public.imoveis for each row execute function public.tocar_atualizado();
drop trigger if exists t_leads_upd on public.leads;
create trigger t_leads_upd before update on public.leads for each row execute function public.tocar_atualizado();

-- Corretor comum não pode se promover a admin, reativar-se ou trocar e-mail/vínculo
create or replace function public.proteger_corretor() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('rz.reivindicando', true), '') = '1' then return new; end if;
  if not public.is_admin() then
    new.is_admin := old.is_admin;
    new.ativo    := old.ativo;
    new.email    := old.email;
    new.user_id  := old.user_id;
  end if;
  return new;
end $$;
drop trigger if exists t_corretores_proteger on public.corretores;
create trigger t_corretores_proteger before update on public.corretores for each row execute function public.proteger_corretor();

-- ---------- PERMISSÕES DE COLUNA (o público só vê o necessário) ----------
revoke all on public.corretores, public.imoveis, public.lead_interacoes from anon;
revoke all on public.leads from anon;
grant select (id, nome, creci, whatsapp, especialidades, bio, foto_url, ativo) on public.corretores to anon;
grant select (id, codigo, titulo, tipo, finalidade, status_obra, preco, condominio, iptu, cidade, bairro,
              area_privativa, area_total, quartos, suites, banheiros, vagas, andar, ano, descricao,
              diferenciais, fotos, aceita_financiamento, aceita_fgts, mcmv, destaque, publicado,
              video_url, tour_url, ficha_pdf_url, corretor_id, criado_em) on public.imoveis to anon;
grant insert (nome, telefone, email, interesse, mensagem, origem, imovel_id, imovel_ref, corretor_id, status, consentimento)
  on public.leads to anon;
grant select, insert, update, delete on public.corretores, public.imoveis, public.leads, public.lead_interacoes to authenticated;

-- ---------- RLS ----------
alter table public.corretores      enable row level security;
alter table public.imoveis         enable row level security;
alter table public.leads           enable row level security;
alter table public.lead_interacoes enable row level security;

-- corretores
drop policy if exists corretores_publico on public.corretores;
create policy corretores_publico on public.corretores for select to anon using (ativo);
drop policy if exists corretores_equipe_ver on public.corretores;
create policy corretores_equipe_ver on public.corretores for select to authenticated using (ativo or public.is_corretor());
drop policy if exists corretores_admin_inserir on public.corretores;
create policy corretores_admin_inserir on public.corretores for insert to authenticated with check (public.is_admin());
drop policy if exists corretores_editar on public.corretores;
create policy corretores_editar on public.corretores for update to authenticated
  using (public.is_admin() or user_id = auth.uid()) with check (public.is_admin() or user_id = auth.uid());
drop policy if exists corretores_admin_excluir on public.corretores;
create policy corretores_admin_excluir on public.corretores for delete to authenticated using (public.is_admin());

-- imóveis
drop policy if exists imoveis_publico on public.imoveis;
create policy imoveis_publico on public.imoveis for select to anon using (publicado);
drop policy if exists imoveis_equipe_ver on public.imoveis;
create policy imoveis_equipe_ver on public.imoveis for select to authenticated using (publicado or public.is_corretor());
drop policy if exists imoveis_inserir on public.imoveis;
create policy imoveis_inserir on public.imoveis for insert to authenticated with check (public.is_corretor());
drop policy if exists imoveis_editar on public.imoveis;
create policy imoveis_editar on public.imoveis for update to authenticated
  using (public.is_admin() or (public.is_corretor() and (corretor_id is null or corretor_id = public.meu_corretor_id())))
  with check (public.is_admin() or corretor_id = public.meu_corretor_id());
drop policy if exists imoveis_excluir on public.imoveis;
create policy imoveis_excluir on public.imoveis for delete to authenticated using (public.is_admin());

-- leads: o site só INSERE; nunca lê
drop policy if exists leads_site_inserir on public.leads;
create policy leads_site_inserir on public.leads for insert to anon, authenticated
  with check (status = 'novo' and consentimento = true);
drop policy if exists leads_ver on public.leads;
create policy leads_ver on public.leads for select to authenticated
  using (public.is_admin() or (public.is_corretor() and (corretor_id is null or corretor_id = public.meu_corretor_id())));
drop policy if exists leads_editar on public.leads;
create policy leads_editar on public.leads for update to authenticated
  using (public.is_admin() or (public.is_corretor() and (corretor_id is null or corretor_id = public.meu_corretor_id())))
  with check (public.is_admin() or corretor_id = public.meu_corretor_id());
drop policy if exists leads_excluir on public.leads;
create policy leads_excluir on public.leads for delete to authenticated using (public.is_admin());

-- interações (histórico): visíveis para quem vê o lead
drop policy if exists interacoes_ver on public.lead_interacoes;
create policy interacoes_ver on public.lead_interacoes for select to authenticated
  using (lead_id in (select id from public.leads));
drop policy if exists interacoes_inserir on public.lead_interacoes;
create policy interacoes_inserir on public.lead_interacoes for insert to authenticated
  with check (public.is_corretor() and corretor_id = public.meu_corretor_id() and lead_id in (select id from public.leads));
drop policy if exists interacoes_excluir on public.lead_interacoes;
create policy interacoes_excluir on public.lead_interacoes for delete to authenticated using (public.is_admin());

-- ---------- TEMPO REAL (aviso de novo lead no painel) ----------
do $$ begin
  alter publication supabase_realtime add table public.leads;
exception when duplicate_object then null; end $$;

-- ---------- STORAGE: fotos dos imóveis ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imoveis', 'imoveis', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists fotos_enviar on storage.objects;
create policy fotos_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'imoveis' and public.is_corretor());
drop policy if exists fotos_alterar on storage.objects;
create policy fotos_alterar on storage.objects for update to authenticated
  using (bucket_id = 'imoveis' and public.is_corretor());
drop policy if exists fotos_excluir on storage.objects;
create policy fotos_excluir on storage.objects for delete to authenticated
  using (bucket_id = 'imoveis' and public.is_corretor());

-- ==========================================================
-- PRIMEIRO ADMINISTRADOR
-- 1) Troque nome e e-mail abaixo e rode este bloco.
-- 2) Em Authentication → Users → "Add user", crie o usuário com o MESMO e-mail
--    (marque "Auto Confirm User").
-- 3) Entre em /corretor/ — o vínculo é feito automaticamente no 1º login.
-- ==========================================================
-- insert into public.corretores (nome, email, creci, whatsapp, is_admin)
-- values ('Seu Nome', 'seu-email@dominio.com', 'CRECI 00000-F', '5547999999999', true)
-- on conflict (email) do update set is_admin = true, ativo = true;
