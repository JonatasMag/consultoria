# Realiza Consultoria Imobiliária — Site + Área do Corretor

Site estático (HTML, CSS e JavaScript puro, sem build) hospedado no **GitHub + Cloudflare Pages**, com banco de dados, login e fotos no **Supabase** — o mesmo modelo do projeto *Oração e Palavra*. Tudo no plano gratuito.

---

## 1. Estrutura

```
realiza/
├── index.html            ← site público (página única, em seções)
├── imovel.html           ← ficha técnica de cada imóvel (?id=...)
├── 404.html
├── corretor/
│   ├── index.html        ← login da equipe
│   └── painel.html       ← funil de leads, imóveis, indicadores, equipe
├── assets/
│   ├── css/style.css     ← identidade visual (cores da logo)
│   ├── css/painel.css
│   ├── js/config.js      ← ★ ÚNICO arquivo que você precisa editar
│   ├── js/data.js        ← acesso aos dados (site)
│   ├── js/main.js        ← página inicial
│   ├── js/imovel.js      ← ficha técnica
│   ├── js/painel.js      ← área do corretor
│   ├── js/demo-data.js   ← dados de exemplo (modo demonstração)
│   └── img/              ← logo, ícone, favicon
├── supabase/schema.sql   ← cria tabelas, segurança (RLS) e storage
├── _headers              ← segurança/cache no Cloudflare
└── robots.txt
```

### Jornada do cliente (ordem das seções)

1. **Início + busca rápida** — proposta de valor e filtro imediato (comprar/alugar, tipo, bairro, quartos, valor).
2. **Ofertas** — vitrine com filtros, ordenação e selos (Lançamento, Destaque, MCMV). Cada card abre a **ficha técnica**.
3. **Como trabalhamos** — metodologia em 5 etapas + compromissos.
4. **Financiamento** — modalidades (SFH/SFI, MCMV, FGTS, planta), documentos e **simulador SAC/PRICE** com verificação de renda.
5. **Corretores** — perfis com CRECI, especialidades, WhatsApp direto e agendamento.
6. **Contato** — formulário que gera o lead no funil + canais diretos.
7. **CTA para proprietários** — captação de imóveis para venda/locação.

**Ficha técnica (`imovel.html`)**: galeria com tela cheia, quadro técnico completo (áreas, R$/m², cômodos, custos), descrição, diferenciais, vídeo/tour/PDF, mapa da região, simulação de parcela, imóveis semelhantes, agendamento de visita com o corretor responsável e versão para impressão.

**Área do Corretor (`/corretor/`)**: funil Kanban com arrastar e soltar (Novos → Em contato → Visita → Proposta → Crédito & documentação → Fechado / Perdido), alertas de lead parado e retorno atrasado, histórico de interações, botão de WhatsApp com mensagem pronta, aviso em tempo real de novo lead, exportação CSV, cadastro de imóveis com upload de fotos, indicadores e gestão da equipe.

---

## 2. Testar agora (modo demonstração)

Sem configurar nada, o site já funciona com imóveis e corretores **de exemplo**. Na área do corretor, qualquer e-mail/senha entra no painel e os dados ficam só no navegador. Uma faixa avisa que é demonstração.

Para ver no computador: abra a pasta no VS Code e use a extensão *Live Server*, ou rode `python -m http.server` dentro da pasta e acesse `http://localhost:8000`.

---

## 3. Personalizar

Edite **`assets/js/config.js`**: telefone, WhatsApp (formato `5547999999999`), e-mail, endereço, cidade, CRECI, redes sociais e a taxa de juros de referência do simulador.

Para trocar textos das seções, edite `index.html` (cada seção tem um comentário `<!-- ============ ... ============ -->`). Cores ficam no topo de `assets/css/style.css` (`:root`).

---

## 4. Banco de dados (Supabase)

1. Crie um projeto novo em **supabase.com** (região *South America – São Paulo*).
2. **SQL Editor → New query** → cole todo o `supabase/schema.sql` → **Run**.
3. **Authentication → Sign In / Providers → Email**: deixe **"Allow new users to sign up" DESLIGADO** (só o administrador cria acessos).
4. Crie o **primeiro administrador**:
   - No final do `schema.sql` há um bloco comentado. Troque nome/e-mail, remova os `--` e rode só esse trecho.
   - Em **Authentication → Users → Add user**, crie o usuário com o **mesmo e-mail** e marque *Auto Confirm User*.
5. **Project Settings → API**: copie a *Project URL* e a *anon public key* para `supabase.supabaseUrl` / `supabaseAnonKey` em `config.js`.
6. **Authentication → URL Configuration**: em *Site URL* coloque o endereço do site (ex.: `https://realiza.pages.dev`).

### Cadastrar corretores
Painel → **Equipe → Novo corretor** (informe o e-mail) → depois crie o usuário com esse e-mail em *Authentication → Users*. No primeiro login o acesso é vinculado automaticamente. Para bloquear alguém, desmarque **Ativo**.

### O que a segurança (RLS) garante — testado
- O site **só insere** leads; ninguém de fora consegue ler leads, e-mails dos corretores ou o endereço interno dos imóveis.
- Imóveis ocultos não aparecem no site.
- Cada corretor vê **os próprios leads + os leads livres**; ao assumir/movimentar um lead livre, ele passa a ser dele.
- Corretor não edita lead de outro, não transfere lead, não exclui, não se promove a administrador.
- Administrador vê e redistribui tudo, gerencia equipe e exclui registros.

---

## 5. Publicar (GitHub + Cloudflare Pages)

1. **GitHub** → *New repository* (ex.: `realiza-imobiliaria`) → envie todo o conteúdo desta pasta (pela web: *Add file → Upload files*, arrastando os arquivos e pastas).
2. **Cloudflare** → *Workers & Pages → Create → Pages → Connect to Git* → escolha o repositório.
   - Framework preset: **None**
   - Build command: *(vazio)*
   - Build output directory: **/** 
3. **Save and Deploy**. A cada alteração enviada ao GitHub, o site atualiza sozinho.
4. Domínio próprio: no projeto do Pages → *Custom domains* → adicione `www.seudominio.com.br`.
5. Opcional: ative *Web Analytics* no Cloudflare (gratuito, sem cookies).

> A chave *anon* do Supabase pode ficar pública no código — quem protege os dados são as regras RLS do `schema.sql`. **Nunca** coloque a chave *service_role* no site.

---

## 6. Checklist antes de divulgar

- [ ] Dados reais em `config.js` (telefone, WhatsApp, CRECI, endereço)
- [ ] Supabase configurado e faixa "modo demonstração" sumiu
- [ ] Corretores reais cadastrados (com foto, CRECI e WhatsApp)
- [ ] Imóveis reais cadastrados e marcados como **Publicado**
- [ ] Teste: enviar um contato pelo site e vê-lo chegar no funil
- [ ] Revisar a taxa de referência do simulador conforme os bancos parceiros
- [ ] Textos legais (LGPD) revisados por quem cuida da parte jurídica

Os imóveis, corretores e leads de exemplo são fictícios e somem automaticamente quando o Supabase é configurado. Fotos de demonstração: Unsplash.
