-- ==========================================================
-- REALIZA — CRIAR / TROCAR SENHA DA EQUIPE PELO PAINEL
-- Rode UMA vez: Supabase → SQL Editor → New query → cole tudo → Run
-- Permite que um ADMINISTRADOR crie o acesso (ou troque a senha) de um
-- corretor direto na Área do Corretor → Equipe, sem entrar no Supabase.
-- ==========================================================

create or replace function public.admin_definir_senha(p_corretor_id uuid, p_senha text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text;
  v_user  uuid;
  v_hash  text;
begin
  if not public.is_admin() then
    raise exception 'Somente administradores podem definir senhas.';
  end if;
  if p_senha is null or char_length(p_senha) < 8 then
    raise exception 'A senha precisa ter pelo menos 8 caracteres.';
  end if;

  select lower(trim(email)), user_id into v_email, v_user
    from public.corretores where id = p_corretor_id;
  if not found then raise exception 'Corretor não encontrado.'; end if;
  if v_email is null or v_email = '' then
    raise exception 'Cadastre o e-mail de acesso do corretor e clique em Salvar antes.';
  end if;

  v_hash := extensions.crypt(p_senha, extensions.gen_salt('bf'));

  -- já existe usuário de login com esse e-mail?
  if v_user is null then
    select id into v_user from auth.users where lower(email) = v_email limit 1;
  end if;

  if v_user is not null then
    update auth.users
       set encrypted_password = v_hash,
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     where id = v_user;
    if not exists (select 1 from auth.identities where user_id = v_user and provider = 'email') then
      insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), v_user, v_user::text, 'email',
              jsonb_build_object('sub', v_user::text, 'email', v_email, 'email_verified', true),
              now(), now(), now());
    end if;
  else
    v_user := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user, 'authenticated', 'authenticated', v_email, v_hash, now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_user, v_user::text, 'email',
            jsonb_build_object('sub', v_user::text, 'email', v_email, 'email_verified', true),
            now(), now(), now());
  end if;

  -- liga o login ao cadastro do corretor
  perform set_config('rz.reivindicando', '1', true);
  update public.corretores set user_id = v_user where id = p_corretor_id;
end $$;

revoke all on function public.admin_definir_senha(uuid, text) from public, anon;
grant execute on function public.admin_definir_senha(uuid, text) to authenticated;
