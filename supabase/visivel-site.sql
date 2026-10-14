-- ==========================================================
-- REALIZA — CORRETOR ATIVO SEM APARECER NO SITE
-- Rode UMA vez: Supabase → SQL Editor → New query → cole tudo → Run
-- Cria a opção "Aparece no site", separada de "Ativo".
-- ==========================================================

alter table public.corretores add column if not exists visivel_site boolean not null default true;

-- o site público só enxerga corretores ativos E visíveis
grant select (visivel_site) on public.corretores to anon;
drop policy if exists corretores_publico on public.corretores;
create policy corretores_publico on public.corretores for select to anon using (ativo and visivel_site);

-- só administrador muda a visibilidade (o corretor comum não consegue alterar a própria)
create or replace function public.proteger_corretor() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('rz.reivindicando', true), '') = '1' then return new; end if;
  if not public.is_admin() then
    new.is_admin     := old.is_admin;
    new.ativo        := old.ativo;
    new.visivel_site := old.visivel_site;
    new.email        := old.email;
    new.user_id      := old.user_id;
  end if;
  return new;
end $$;
