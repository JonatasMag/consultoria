/* ==========================================================
   PAINEL DO CORRETOR — funil de leads, imóveis, indicadores, equipe
   Supabase (produção) ou localStorage (modo demonstração)
   ========================================================== */
(() => {
  "use strict";
  const cfg = window.REALIZA_CONFIG;
  const ONLINE = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const sb = ONLINE ? supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  const ETAPAS = [
    { id: "novo", nome: "Novos", curto: "Novo", cor: "#F35B12" },
    { id: "contato", nome: "Em contato", curto: "Contato", cor: "#E59A0B" },
    { id: "visita", nome: "Visita agendada", curto: "Visita", cor: "#3B7DDD" },
    { id: "proposta", nome: "Proposta", curto: "Proposta", cor: "#8B5CF6" },
    { id: "documentacao", nome: "Crédito & documentação", curto: "Crédito", cor: "#0E9BC9" },
    { id: "ganho", nome: "Fechado", curto: "Fechado", cor: "#1F9D55" },
    { id: "perdido", nome: "Perdido", cor: "#9A9BA1" }
  ];
  const ET = Object.fromEntries(ETAPAS.map((e) => [e.id, e]));
  const INTERESSES = ["Comprar", "Alugar", "Financiamento", "Vender meu imóvel", "Investir", "Encomendar imóvel"];
  const ORIGENS_MANUAIS = ["Telefone", "WhatsApp", "Indicação", "Plantão", "Portal imobiliário", "Redes sociais", "Outro"];
  const TIPOS_INT = { nota: ["Nota", "sticky-note"], ligacao: ["Ligação", "phone"], whatsapp: ["WhatsApp", "message-circle"], email: ["E-mail", "mail"], visita: ["Visita", "key-round"], proposta: ["Proposta", "file-signature"], etapa: ["Etapa", "git-commit-horizontal"] };
  const MOTIVOS_PERDA = ["Comprou com outra imobiliária", "Crédito não aprovado", "Desistiu da compra", "Preço acima do orçamento", "Sem retorno do cliente", "Outro"];

  /* ---------- utilidades ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ic = () => window.lucide && lucide.createIcons();
  const moeda = (v) => v ? Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "—";
  const iniciais = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  const hojeISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const dataBR = (iso) => iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
  const dataHoraBR = (iso) => iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "";
  const rel = (iso) => {
    const m = (Date.now() - new Date(iso)) / 60000;
    if (m < 1) return "agora"; if (m < 60) return Math.floor(m) + " min";
    if (m < 1440) return Math.floor(m / 60) + " h"; const d = Math.floor(m / 1440);
    return d < 30 ? d + " d" : dataBR(iso);
  };
  const soDigitos = (s) => String(s || "").replace(/\D/g, "");
  const waLink = (tel, txt) => { let d = soDigitos(tel); if (d.length <= 11) d = "55" + d; return `https://wa.me/${d}?text=${encodeURIComponent(txt || "")}`; };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "x" + Date.now() + Math.random().toString(16).slice(2));
  let toastT;
  function toast(msg, erro) {
    const t = $("#toast"); t.innerHTML = msg; t.className = "toast on" + (erro ? " erro" : "");
    clearTimeout(toastT); toastT = setTimeout(() => t.className = "toast", 3800);
  }

  /* ==========================================================
     CAMADA DE DADOS
     ========================================================== */
  const DEMO_KEY = "rz_demo_painel_v1";
  const demo = {
    carregar() {
      try { const d = JSON.parse(localStorage.getItem(DEMO_KEY)); if (d) return this.mesclarSite(d); } catch (_) {}
      const corretores = window.DEMO_CORRETORES.map((c, i) => ({ ...c, email: `corretor${i + 1}@realiza.demo`, is_admin: i === 0 }));
      const imoveis = window.DEMO_IMOVEIS.map((p) => ({ ...p, criado_em: new Date(Date.now() - 864e5 * 20).toISOString() }));
      const nomes = ["Mariana Costa", "João Pedro Martins", "Luciana Freitas", "Rafael Moreira", "Patrícia Gomes", "Bruno Henrique", "Camila Duarte", "Diego Nascimento", "Juliana Prado", "Thiago Barros", "Aline Teixeira", "Gustavo Rocha"];
      const st = ["novo", "novo", "novo", "contato", "contato", "visita", "visita", "proposta", "documentacao", "ganho", "perdido", "contato"];
      const orig = ["site-contato", "ficha-imovel", "simulador", "site-contato", "WhatsApp", "ficha-imovel", "Indicação", "ficha-imovel", "simulador", "Indicação", "Portal imobiliário", "site-contato"];
      const leads = nomes.map((n, i) => {
        const im = imoveis[i % imoveis.length];
        return {
          id: "L" + (i + 1), nome: n, telefone: `(47) 9${8800 + i * 37}-${1000 + i * 91}`, email: n.split(" ")[0].toLowerCase() + "@email.com",
          interesse: im.finalidade === "locacao" ? "Alugar" : (orig[i] === "simulador" ? "Financiamento" : "Comprar"),
          mensagem: i % 3 === 0 ? "Gostaria de agendar uma visita no fim de semana." : i % 3 === 1 ? "Tenho FGTS para usar na entrada." : null,
          origem: orig[i], imovel_id: i % 4 === 3 ? null : im.id, imovel_ref: i % 4 === 3 ? null : `${im.codigo} — ${im.titulo}`,
          corretor_id: i < 2 ? null : corretores[i % corretores.length].id, status: st[i],
          valor_estimado: ["proposta", "documentacao", "ganho"].includes(st[i]) ? im.preco : null,
          proximo_contato: ["contato", "visita", "proposta"].includes(st[i]) ? new Date(Date.now() + (i % 3 - 1) * 864e5).toISOString().slice(0, 10) : null,
          motivo_perda: st[i] === "perdido" ? "Preço acima do orçamento" : null, consentimento: true,
          criado_em: new Date(Date.now() - (i * 2.3 + (i < 3 ? 0.05 : 1)) * 864e5).toISOString(),
          atualizado_em: new Date(Date.now() - i * 864e5).toISOString()
        };
      });
      const interacoes = leads.filter((l) => l.status !== "novo").map((l) => ({ id: uid(), lead_id: l.id, corretor_id: l.corretor_id, tipo: "ligacao", texto: "Primeiro contato realizado. Cliente confirmou interesse.", criado_em: l.atualizado_em }));
      const d = { corretores, imoveis, leads, interacoes };
      this.salvar(d); return this.mesclarSite(d);
    },
    mesclarSite(d) { // leads enviados pelo site em modo demonstração
      try {
        const site = JSON.parse(localStorage.getItem("rz_demo_leads_site") || "[]");
        if (site.length) { site.forEach((l) => { if (!d.leads.find((x) => x.id === l.id)) d.leads.unshift(l); }); localStorage.removeItem("rz_demo_leads_site"); this.salvar(d); }
      } catch (_) {}
      return d;
    },
    salvar(d) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(d)); } catch (_) {} }
  };

  const DB = {
    d: null,
    async eu() {
      if (!ONLINE) {
        this.d = demo.carregar();
        const email = sessionStorage.getItem("rz_demo_user");
        if (!email) { location.replace("./"); return null; }
        return this.d.corretores[0];
      }
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { location.replace("./"); return null; }
      await sb.rpc("reivindicar_corretor"); // vincula o usuário ao cadastro pelo e-mail (1º acesso)
      const { data, error } = await sb.from("corretores").select("*").eq("user_id", session.user.id).maybeSingle();
      if (error || !data || !data.ativo) {
        await sb.auth.signOut();
        document.body.innerHTML = `<div style="display:grid;place-items:center;min-height:100vh;padding:24px;text-align:center"><div><h2>Acesso não autorizado</h2><p style="margin:10px 0 20px;color:#6A6B72">Seu usuário não está ativo na equipe. Fale com o administrador.</p><a class="btn btn-primario" href="./">Voltar</a></div></div>`;
        return null;
      }
      return data;
    },
    async leads() {
      if (!ONLINE) return this.d.leads;
      const { data, error } = await sb.from("leads").select("*").order("criado_em", { ascending: false }).limit(2000);
      if (error) { toast("Erro ao carregar leads", true); console.error(error); return []; }
      return data;
    },
    async imoveis() {
      if (!ONLINE) return this.d.imoveis;
      const { data, error } = await sb.from("imoveis").select("*").order("criado_em", { ascending: false });
      if (error) { console.error(error); return []; }
      return data;
    },
    async corretores() {
      if (!ONLINE) return this.d.corretores;
      const { data, error } = await sb.from("corretores").select("*").order("nome");
      if (error) { console.error(error); return []; }
      return data;
    },
    async salvar(tabela, obj) {
      const agora = new Date().toISOString();
      if (!ONLINE) {
        const lista = this.d[tabela];
        if (obj.id) { const i = lista.findIndex((x) => x.id === obj.id); if (i >= 0) lista[i] = { ...lista[i], ...obj, atualizado_em: agora }; else lista.unshift({ ...obj, criado_em: agora }); }
        else { obj = { ...obj, id: uid(), criado_em: agora, atualizado_em: agora }; lista.unshift(obj); }
        demo.salvar(this.d); return { data: lista.find((x) => x.id === obj.id) };
      }
      const { id, criado_em, atualizado_em, ...campos } = obj;
      const q = id ? sb.from(tabela).update(campos).eq("id", id) : sb.from(tabela).insert(campos);
      const { data, error } = await q.select().single();
      if (error) { console.error(error); toast("Não foi possível salvar: " + esc(error.message), true); }
      return { data, error };
    },
    async interacoes(leadId) {
      if (!ONLINE) return this.d.interacoes.filter((i) => i.lead_id === leadId).sort((a, b) => b.criado_em.localeCompare(a.criado_em));
      const { data } = await sb.from("lead_interacoes").select("*").eq("lead_id", leadId).order("criado_em", { ascending: false });
      return data || [];
    },
    async addInteracao(leadId, tipo, texto) {
      const reg = { lead_id: leadId, corretor_id: S.eu.id, tipo, texto };
      if (!ONLINE) { this.d.interacoes.push({ ...reg, id: uid(), criado_em: new Date().toISOString() }); demo.salvar(this.d); return; }
      const { error } = await sb.from("lead_interacoes").insert(reg);
      if (error) console.error(error);
    },
    async uploadFoto(file, pasta) {
      if (!ONLINE) return { erro: "Upload disponível somente com o Supabase configurado. No modo demonstração, cole URLs de imagens." };
      const nome = `${pasta}/${Date.now()}-${file.name.normalize("NFD").replace(/[^\w.-]/g, "_")}`;
      const { error } = await sb.storage.from("imoveis").upload(nome, file, { cacheControl: "31536000", upsert: false });
      if (error) return { erro: error.message };
      return { url: sb.storage.from("imoveis").getPublicUrl(nome).data.publicUrl };
    },
    async sair() { if (ONLINE) await sb.auth.signOut(); else sessionStorage.removeItem("rz_demo_user"); location.replace("./"); }
  };

  /* ==========================================================
     ESTADO
     ========================================================== */
  const S = { eu: null, leads: [], imoveis: [], corretores: [], vista: "funil", buscaFunil: "", dono: "todos" };
  const corretor = (id) => S.corretores.find((c) => c.id === id);
  const imovel = (id) => S.imoveis.find((p) => p.id === id);
  const podeEditarLead = (l) => S.eu.is_admin || !l.corretor_id || l.corretor_id === S.eu.id;
  const atrasado = (l) => l.proximo_contato && l.proximo_contato < hojeISO() && !["ganho", "perdido"].includes(l.status);
  const semRetorno = (l) => l.status === "novo" && (Date.now() - new Date(l.criado_em)) > 864e5;

  async function recarregar() {
    [S.leads, S.imoveis, S.corretores] = await Promise.all([DB.leads(), DB.imoveis(), DB.corretores()]);
    renderTudo();
  }
  function renderTudo() {
    $("#badge-novos").textContent = S.leads.filter((l) => l.status === "novo").length;
    renderFunil(); renderLeads(); renderImoveis(); renderIndicadores(); renderEquipe(); ic();
  }

  /* ==========================================================
     FUNIL (KANBAN)
     ========================================================== */
  function leadsFiltrados(busca, dono) {
    const t = (busca || "").trim().toLowerCase();
    return S.leads.filter((l) =>
      (dono === "meus" ? l.corretor_id === S.eu.id : dono === "livres" ? !l.corretor_id : true) &&
      (!t || [l.nome, l.telefone, l.email, l.imovel_ref, l.interesse, l.mensagem].join(" ").toLowerCase().includes(t)));
  }
  function cardLead(l) {
    const c = corretor(l.corretor_id);
    const etq = [`<span class="etq">${esc(l.interesse || "—")}</span>`];
    if (atrasado(l)) etq.push('<span class="etq verm">Retorno atrasado</span>');
    else if (l.proximo_contato === hojeISO()) etq.push('<span class="etq laranja">Retornar hoje</span>');
    if (semRetorno(l)) etq.push('<span class="etq verm">+24h sem contato</span>');
    if (l.valor_estimado) etq.push(`<span class="etq verde">${moeda(l.valor_estimado)}</span>`);
    return `<article class="lead" draggable="true" data-id="${esc(l.id)}" style="border-left-color:${ET[l.status]?.cor || "#ccc"}">
      <h4>${esc(l.nome)}<small>${rel(l.criado_em)}</small></h4>
      <div class="ref">${esc(l.imovel_ref || l.mensagem || l.telefone)}</div>
      <div class="rod">${etq.join("")}<span class="mini-av ${c ? "" : "livre"}" title="${esc(c ? c.nome : "Sem corretor — clique para assumir")}">${c ? iniciais(c.nome) : "+"}</span></div>
    </article>`;
  }
  function renderFunil() {
    const lista = leadsFiltrados(S.buscaFunil, S.dono);
    const ativos = S.leads.filter((l) => !["ganho", "perdido"].includes(l.status));
    const mes = S.leads.filter((l) => (Date.now() - new Date(l.criado_em)) < 30 * 864e5);
    const ganhos = mes.filter((l) => l.status === "ganho").length;
    $("#kpis").innerHTML = [
      ["Novos aguardando", S.leads.filter((l) => l.status === "novo").length, `${S.leads.filter(semRetorno).length} há mais de 24h`],
      ["Em andamento", ativos.length, `${S.leads.filter(atrasado).length} retornos atrasados`],
      ["Leads (30 dias)", mes.length, `${ganhos} fechados no período`],
      ["Potencial em negociação", moeda(S.leads.filter((l) => ["proposta", "documentacao"].includes(l.status)).reduce((s, l) => s + Number(l.valor_estimado || 0), 0)), "propostas + documentação"]
    ].map(([a, b, c]) => `<div class="kpi"><span>${a}</span><b>${b}</b><small>${c}</small></div>`).join("");

    $("#kanban").innerHTML = ETAPAS.map((e) => {
      const ls = lista.filter((l) => l.status === e.id);
      const soma = ls.reduce((s, l) => s + Number(l.valor_estimado || 0), 0);
      return `<div class="coluna" data-etapa="${e.id}">
        <div class="coluna-cab"><span class="ponto" style="background:${e.cor}"></span><span>${e.nome}${soma ? `<span class="valor">${moeda(soma)}</span>` : ""}</span><span class="qtd">${ls.length}</span></div>
        <div class="cards-col">${ls.map(cardLead).join("")}</div>
      </div>`;
    }).join("");
    ligarArrastar();
  }
  function ligarArrastar() {
    $$("#kanban .lead").forEach((card) => {
      card.addEventListener("click", () => abrirLead(card.dataset.id));
      card.addEventListener("dragstart", (ev) => { ev.dataTransfer.setData("text/plain", card.dataset.id); ev.dataTransfer.effectAllowed = "move"; card.classList.add("arrastando"); });
      card.addEventListener("dragend", () => card.classList.remove("arrastando"));
    });
    $$("#kanban .coluna").forEach((col) => {
      col.addEventListener("dragover", (ev) => { ev.preventDefault(); col.classList.add("alvo"); });
      col.addEventListener("dragleave", (ev) => { if (!col.contains(ev.relatedTarget)) col.classList.remove("alvo"); });
      col.addEventListener("drop", (ev) => {
        ev.preventDefault(); col.classList.remove("alvo");
        const l = S.leads.find((x) => x.id === ev.dataTransfer.getData("text/plain"));
        if (l && l.status !== col.dataset.etapa) mudarEtapa(l, col.dataset.etapa);
      });
    });
  }
  async function mudarEtapa(l, etapa, motivo) {
    if (!podeEditarLead(l)) { toast("Este lead pertence a outro corretor.", true); return false; }
    if (etapa === "perdido" && !motivo) {
      motivo = prompt("Motivo da perda:\n" + MOTIVOS_PERDA.map((m, i) => `${i + 1}. ${m}`).join("\n") + "\n\nDigite o número ou descreva:", "");
      if (motivo === null) return false;
      motivo = MOTIVOS_PERDA[Number(motivo) - 1] || motivo || "Não informado";
    }
    const antes = l.status;
    const patch = { id: l.id, status: etapa };
    if (!l.corretor_id) patch.corretor_id = S.eu.id; // quem movimenta um lead livre assume o atendimento
    if (etapa === "perdido") patch.motivo_perda = motivo;
    const { error } = await DB.salvar("leads", patch);
    if (error) return false;
    Object.assign(l, patch);
    await DB.addInteracao(l.id, "etapa", `${ET[antes].nome} → ${ET[etapa].nome}${motivo ? " (" + motivo + ")" : ""}`);
    toast(`<b>${esc(l.nome)}</b> movido para ${ET[etapa].nome}`);
    renderTudo(); return true;
  }

  /* ==========================================================
     GAVETA: DETALHE / NOVO LEAD
     ========================================================== */
  function abrirGaveta(html) { $("#gaveta").innerHTML = html; $("#gaveta").classList.add("aberta"); $("#veu").classList.add("aberto"); ic(); }
  function fecharGaveta() { $("#gaveta").classList.remove("aberta"); $("#veu").classList.remove("aberto"); }

  const optImoveis = (sel) => `<option value="">— Nenhum —</option>` + S.imoveis.map((p) => `<option value="${esc(p.id)}" ${p.id === sel ? "selected" : ""}>${esc(p.codigo)} — ${esc(p.titulo)}</option>`).join("");
  const optCorretores = (sel) => `<option value="">— Sem corretor —</option>` + S.corretores.filter((c) => c.ativo).map((c) => `<option value="${esc(c.id)}" ${c.id === sel ? "selected" : ""}>${esc(c.nome)}</option>`).join("");

  async function abrirLead(id) {
    const l = S.leads.find((x) => x.id === id); if (!l) return;
    const pode = podeEditarLead(l);
    const c = corretor(l.corretor_id);
    const idx = ETAPAS.findIndex((e) => e.id === l.status);
    const primeiro = l.nome.split(" ")[0];
    const msgWa = `Olá, ${primeiro}! Aqui é ${S.eu.nome.split(" ")[0]}, da Realiza Consultoria Imobiliária. Recebi seu contato${l.imovel_ref ? " sobre o imóvel " + l.imovel_ref : ""}. Podemos conversar?`;
    abrirGaveta(`
      <div class="gaveta-cab">
        <div class="avatar" style="width:52px;height:52px;margin:0;border:0;font-size:1rem;flex:0 0 52px">${iniciais(l.nome)}</div>
        <div><h2>${esc(l.nome)}</h2><p>Recebido em ${dataHoraBR(l.criado_em)} · origem: ${esc(l.origem || "—")}</p></div>
        <button class="fechar-g" aria-label="Fechar" data-fechar><i data-lucide="x"></i></button>
      </div>
      <div class="gaveta-corpo">
        <div class="etapas-trilha">${ETAPAS.filter((e) => e.id !== "perdido").map((e, i) => `<button type="button" data-etapa="${e.id}" class="${e.id === l.status ? "atual" : (l.status !== "perdido" && i < idx) ? "feita" : ""}" title="${e.nome}">${e.curto}</button>`).join("")}</div>
        <div class="acoes-rapidas">
          <a class="btn btn-wa btn-sm" href="${waLink(l.telefone, msgWa)}" target="_blank" rel="noopener" data-log="whatsapp"><i data-lucide="message-circle"></i> WhatsApp</a>
          <a class="btn btn-escuro btn-sm" href="tel:${soDigitos(l.telefone)}" data-log="ligacao"><i data-lucide="phone"></i> Ligar</a>
          ${l.email ? `<a class="btn btn-contorno btn-sm" href="mailto:${esc(l.email)}" data-log="email"><i data-lucide="mail"></i> E-mail</a>` : ""}
          ${l.status !== "perdido" ? `<button class="btn btn-contorno btn-sm" data-etapa="perdido" style="margin-left:auto;color:#A12A1A"><i data-lucide="x-circle"></i> Perdido</button>` : `<span class="etq verm" style="margin-left:auto;align-self:center">Perdido: ${esc(l.motivo_perda || "")}</span>`}
        </div>
        ${!l.corretor_id ? `<div class="faixa-demo" style="margin:0;display:flex;align-items:center;gap:10px;justify-content:space-between">Lead sem corretor responsável.<button class="btn btn-primario btn-sm" id="assumir"><i data-lucide="hand"></i> Assumir lead</button></div>` : ""}
        ${l.mensagem ? `<div><div class="titulo-sub"><i data-lucide="quote"></i> Mensagem do cliente</div><p style="background:var(--fundo-suave);padding:12px 14px;border-radius:10px;margin-top:8px;font-size:.9rem;white-space:pre-line">${esc(l.mensagem)}</p></div>` : ""}

        <form id="f-lead" class="grade-2">
          <div class="campo"><label>Nome</label><input name="nome" value="${esc(l.nome)}" ${pode ? "" : "disabled"}></div>
          <div class="campo"><label>Telefone</label><input name="telefone" value="${esc(l.telefone)}" ${pode ? "" : "disabled"}></div>
          <div class="campo"><label>E-mail</label><input name="email" type="email" value="${esc(l.email || "")}" ${pode ? "" : "disabled"}></div>
          <div class="campo"><label>Interesse</label><select name="interesse" ${pode ? "" : "disabled"}>${INTERESSES.map((i) => `<option ${i === l.interesse ? "selected" : ""}>${i}</option>`).join("")}</select></div>
          <div class="campo cheia"><label>Imóvel</label><select name="imovel_id" ${pode ? "" : "disabled"}>${optImoveis(l.imovel_id)}</select>${!l.imovel_id && l.imovel_ref ? `<span class="ajuda">Informado pelo site: ${esc(l.imovel_ref)}</span>` : ""}</div>
          <div class="campo"><label>Valor estimado (R$)</label><input name="valor_estimado" inputmode="numeric" value="${l.valor_estimado ? Number(l.valor_estimado).toLocaleString("pt-BR") : ""}" ${pode ? "" : "disabled"}></div>
          <div class="campo"><label>Próximo contato</label><input name="proximo_contato" type="date" value="${esc(l.proximo_contato || "")}" ${pode ? "" : "disabled"}></div>
          <div class="campo cheia"><label>Corretor responsável</label>${S.eu.is_admin ? `<select name="corretor_id">${optCorretores(l.corretor_id)}</select>` : `<input value="${esc(c ? c.nome : "Sem corretor")}" disabled>`}</div>
        </form>

        <div>
          <div class="titulo-sub"><i data-lucide="history"></i> Histórico de atendimento</div>
          ${pode ? `<form class="nova-interacao" id="f-int" style="margin:10px 0 14px">
            <select name="tipo" class="sel-app" style="border-radius:10px">${Object.entries(TIPOS_INT).filter(([k]) => k !== "etapa").map(([k, [n]]) => `<option value="${k}">${n}</option>`).join("")}</select>
            <input name="texto" class="sel-app" style="border-radius:10px" placeholder="O que foi conversado / combinado…" required>
            <button class="btn btn-escuro btn-sm" type="submit"><i data-lucide="plus"></i></button>
          </form>` : ""}
          <div class="historico" id="historico"><p style="color:var(--texto-suave);font-size:.85rem">Carregando…</p></div>
        </div>
      </div>
      <div class="gaveta-rod">
        <button class="btn btn-contorno btn-sm" data-fechar>Fechar</button>
        ${pode ? `<button class="btn btn-primario btn-sm" id="salvar-lead"><i data-lucide="save"></i> Salvar alterações</button>` : ""}
      </div>`);

    const g = $("#gaveta");
    $$("[data-fechar]", g).forEach((b) => b.onclick = fecharGaveta);
    $$("[data-etapa]", g).forEach((b) => b.onclick = async () => { if (b.dataset.etapa !== l.status && await mudarEtapa(l, b.dataset.etapa)) abrirLead(l.id); });
    $$("[data-log]", g).forEach((a) => a.addEventListener("click", () => { if (pode) DB.addInteracao(l.id, a.dataset.log, `${TIPOS_INT[a.dataset.log][0]} iniciado pelo painel`).then(() => carregarHistorico(l.id)); }));
    const assumir = $("#assumir", g);
    if (assumir) assumir.onclick = async () => {
      const { error } = await DB.salvar("leads", { id: l.id, corretor_id: S.eu.id });
      if (!error) { l.corretor_id = S.eu.id; await DB.addInteracao(l.id, "nota", `Lead assumido por ${S.eu.nome}`); toast("Lead assumido!"); renderTudo(); abrirLead(l.id); }
    };
    const fi = $("#f-int", g);
    if (fi) fi.onsubmit = async (ev) => { ev.preventDefault(); const t = fi.texto.value.trim(); if (!t) return; await DB.addInteracao(l.id, fi.tipo.value, t); fi.reset(); carregarHistorico(l.id); };
    const bs = $("#salvar-lead", g);
    if (bs) bs.onclick = async () => {
      const f = $("#f-lead", g);
      const patch = {
        id: l.id, nome: f.nome.value.trim(), telefone: f.telefone.value.trim(), email: f.email.value.trim() || null, interesse: f.interesse.value,
        imovel_id: f.imovel_id.value || null, valor_estimado: Number(soDigitos(f.valor_estimado.value)) || null, proximo_contato: f.proximo_contato.value || null
      };
      if (patch.imovel_id) { const p = imovel(patch.imovel_id); if (p) patch.imovel_ref = `${p.codigo} — ${p.titulo}`; }
      if (S.eu.is_admin && f.corretor_id) patch.corretor_id = f.corretor_id.value || null;
      const { error } = await DB.salvar("leads", patch);
      if (!error) { Object.assign(l, patch); toast("Lead atualizado"); renderTudo(); fecharGaveta(); }
    };
    carregarHistorico(l.id);
  }
  async function carregarHistorico(id) {
    const h = await DB.interacoes(id);
    const el = $("#historico"); if (!el) return;
    el.innerHTML = h.length ? h.map((i) => {
      const [n, icone] = TIPOS_INT[i.tipo] || TIPOS_INT.nota; const c = corretor(i.corretor_id);
      return `<div class="hist"><span class="ic"><i data-lucide="${icone}"></i></span><div><b>${n}</b> — ${esc(i.texto)}<small>${dataHoraBR(i.criado_em)}${c ? " · " + esc(c.nome) : ""}</small></div></div>`;
    }).join("") : `<p style="color:var(--texto-suave);font-size:.85rem">Nenhuma interação registrada ainda.</p>`;
    ic();
  }

  function novoLead() {
    abrirGaveta(`
      <div class="gaveta-cab"><div><h2>Novo lead</h2><p>Cadastro manual (telefone, indicação, plantão…)</p></div><button class="fechar-g" data-fechar aria-label="Fechar"><i data-lucide="x"></i></button></div>
      <form class="gaveta-corpo" id="f-novo">
        <div class="grade-2">
          <div class="campo cheia"><label>Nome *</label><input name="nome" required></div>
          <div class="campo"><label>Telefone / WhatsApp *</label><input name="telefone" required></div>
          <div class="campo"><label>E-mail</label><input name="email" type="email"></div>
          <div class="campo"><label>Interesse</label><select name="interesse">${INTERESSES.map((i) => `<option>${i}</option>`).join("")}</select></div>
          <div class="campo"><label>Origem</label><select name="origem">${ORIGENS_MANUAIS.map((o) => `<option>${o}</option>`).join("")}</select></div>
          <div class="campo cheia"><label>Imóvel</label><select name="imovel_id">${optImoveis()}</select></div>
          ${S.eu.is_admin ? `<div class="campo cheia"><label>Corretor responsável</label><select name="corretor_id">${optCorretores(S.eu.id)}</select></div>` : ""}
          <div class="campo cheia"><label>Observações</label><textarea name="mensagem"></textarea></div>
        </div>
      </form>
      <div class="gaveta-rod"><button class="btn btn-contorno btn-sm" data-fechar>Cancelar</button><button class="btn btn-primario btn-sm" id="criar-lead"><i data-lucide="plus"></i> Criar lead</button></div>`);
    $$("[data-fechar]").forEach((b) => b.onclick = fecharGaveta);
    $("#criar-lead").onclick = async () => {
      const f = $("#f-novo");
      if (!f.nome.value.trim() || soDigitos(f.telefone.value).length < 10) { toast("Informe nome e telefone com DDD.", true); return; }
      const p = imovel(f.imovel_id.value);
      const { data, error } = await DB.salvar("leads", {
        nome: f.nome.value.trim(), telefone: f.telefone.value.trim(), email: f.email.value.trim() || null, interesse: f.interesse.value,
        origem: f.origem.value, imovel_id: p ? p.id : null, imovel_ref: p ? `${p.codigo} — ${p.titulo}` : null,
        corretor_id: f.corretor_id ? (f.corretor_id.value || null) : S.eu.id, mensagem: f.mensagem.value.trim() || null, status: "novo", consentimento: true
      });
      if (!error && data) { if (!ONLINE) S.leads = DB.d.leads; else S.leads.unshift(data); toast("Lead criado"); fecharGaveta(); renderTudo(); }
    };
  }

  /* ==========================================================
     LISTA DE LEADS + CSV
     ========================================================== */
  function renderLeads() {
    const etapa = $("#filtro-etapa").value;
    const lista = leadsFiltrados($("#busca-leads").value, "todos").filter((l) => !etapa || l.status === etapa);
    $("#tb-leads").innerHTML = lista.length ? lista.map((l) => {
      const c = corretor(l.corretor_id);
      return `<tr data-id="${esc(l.id)}"><td>${dataBR(l.criado_em)}<br><small style="color:var(--texto-suave)">${rel(l.criado_em)}</small></td>
        <td><b>${esc(l.nome)}</b></td><td>${esc(l.telefone)}<br><small style="color:var(--texto-suave)">${esc(l.email || "")}</small></td>
        <td>${esc(l.interesse || "")}</td><td style="max-width:220px">${esc(l.imovel_ref || "—")}</td><td>${esc(l.origem || "")}</td>
        <td><span class="st" style="color:${ET[l.status]?.cor}">${ET[l.status]?.nome || l.status}</span></td><td>${c ? esc(c.nome) : '<span class="etq laranja">Livre</span>'}</td></tr>`;
    }).join("") : `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--texto-suave)">Nenhum lead encontrado.</td></tr>`;
    $$("#tb-leads tr[data-id]").forEach((tr) => tr.onclick = () => abrirLead(tr.dataset.id));
  }
  function exportarCSV() {
    const cols = ["criado_em", "nome", "telefone", "email", "interesse", "imovel_ref", "origem", "status", "corretor", "valor_estimado", "proximo_contato", "motivo_perda", "mensagem"];
    const linhas = S.leads.map((l) => cols.map((k) => {
      let v = k === "corretor" ? (corretor(l.corretor_id)?.nome || "") : k === "status" ? (ET[l.status]?.nome || l.status) : k === "criado_em" ? dataHoraBR(l.criado_em) : (l[k] ?? "");
      v = String(v).replace(/"/g, '""'); if (/^[=+\-@]/.test(v)) v = "'" + v; // evita injeção de fórmulas no Excel
      return `"${v}"`;
    }).join(";"));
    const blob = new Blob(["﻿" + cols.join(";") + "\n" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `leads-realiza-${hojeISO()}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ==========================================================
     IMÓVEIS
     ========================================================== */
  function renderImoveis() {
    const t = ($("#busca-imoveis").value || "").toLowerCase();
    const lista = S.imoveis.filter((p) => !t || [p.codigo, p.titulo, p.bairro, p.tipo].join(" ").toLowerCase().includes(t));
    $("#tb-imoveis").innerHTML = lista.length ? lista.map((p) => {
      const n = S.leads.filter((l) => l.imovel_id === p.id).length;
      const pode = S.eu.is_admin || !p.corretor_id || p.corretor_id === S.eu.id;
      return `<tr data-id="${esc(p.id)}">
        <td>${p.fotos && p.fotos[0] ? `<img class="thumb" src="${esc(p.fotos[0])}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : '<div class="thumb"></div>'}</td>
        <td><b>${esc(p.codigo)}</b></td><td>${esc(p.titulo)}${p.destaque ? ' <span class="etq laranja">Destaque</span>' : ""}</td><td>${esc(p.bairro)}</td>
        <td>${moeda(p.preco)}${p.finalidade === "locacao" ? "/mês" : ""}</td><td>${{ pronto: "Pronto", lancamento: "Lançamento", em_construcao: "Em obra" }[p.status_obra] || ""}</td>
        <td>${n}</td><td><label class="switch" onclick="event.stopPropagation()"><input type="checkbox" data-pub="${esc(p.id)}" ${p.publicado ? "checked" : ""} ${pode ? "" : "disabled"}> ${p.publicado ? "Publicado" : "Oculto"}</label></td></tr>`;
    }).join("") : `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--texto-suave)">Nenhum imóvel cadastrado.</td></tr>`;
    $$("#tb-imoveis tr[data-id]").forEach((tr) => tr.onclick = () => abrirImovel(tr.dataset.id));
    $$("[data-pub]").forEach((cb) => cb.onchange = async () => {
      const { error } = await DB.salvar("imoveis", { id: cb.dataset.pub, publicado: cb.checked });
      if (!error) { imovel(cb.dataset.pub).publicado = cb.checked; toast(cb.checked ? "Imóvel publicado no site" : "Imóvel ocultado do site"); renderImoveis(); } else cb.checked = !cb.checked;
    });
  }
  function proximoCodigo() {
    const n = S.imoveis.map((p) => Number(String(p.codigo || "").replace(/\D/g, "")) || 0);
    return "RZ-" + String(Math.max(100, ...n) + 1);
  }
  function abrirImovel(id) {
    const p = id ? imovel(id) : { codigo: proximoCodigo(), tipo: "Apartamento", finalidade: "venda", status_obra: "pronto", cidade: (cfg.empresa.cidade || "").split(" - ")[0], fotos: [], diferenciais: [], aceita_financiamento: true, publicado: false, corretor_id: S.eu.id };
    const pode = !id || S.eu.is_admin || !p.corretor_id || p.corretor_id === S.eu.id;
    const dis = pode ? "" : "disabled";
    const v = (k) => esc(p[k] ?? "");
    let fotos = [...(p.fotos || [])];
    abrirGaveta(`
      <div class="gaveta-cab"><div><h2>${id ? esc(p.codigo) + " — editar imóvel" : "Novo imóvel"}</h2><p>${id ? `<a href="../imovel.html?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener" style="color:var(--laranja);font-weight:700">Ver ficha no site ↗</a>` : "Preencha a ficha técnica completa."}</p></div><button class="fechar-g" data-fechar aria-label="Fechar"><i data-lucide="x"></i></button></div>
      <form class="gaveta-corpo" id="f-imovel">
        ${!pode ? '<div class="faixa-demo" style="margin:0">Somente o corretor responsável ou um administrador pode editar este imóvel.</div>' : ""}
        <div class="titulo-sub"><i data-lucide="tag"></i> Identificação</div>
        <div class="grade-3">
          <div class="campo"><label>Código</label><input name="codigo" value="${v("codigo")}" ${dis} required></div>
          <div class="campo"><label>Tipo</label><select name="tipo" ${dis}>${["Apartamento", "Casa", "Sobrado", "Cobertura", "Terreno", "Comercial", "Galpão", "Chácara"].map((o) => `<option ${o === p.tipo ? "selected" : ""}>${o}</option>`).join("")}</select></div>
          <div class="campo"><label>Finalidade</label><select name="finalidade" ${dis}><option value="venda" ${p.finalidade === "venda" ? "selected" : ""}>Venda</option><option value="locacao" ${p.finalidade === "locacao" ? "selected" : ""}>Locação</option></select></div>
          <div class="campo cheia"><label>Título do anúncio</label><input name="titulo" value="${v("titulo")}" maxlength="90" ${dis} required placeholder="Ex.: Apartamento 3 quartos com sacada gourmet"></div>
          <div class="campo"><label>Situação</label><select name="status_obra" ${dis}><option value="pronto" ${p.status_obra === "pronto" ? "selected" : ""}>Pronto</option><option value="lancamento" ${p.status_obra === "lancamento" ? "selected" : ""}>Lançamento</option><option value="em_construcao" ${p.status_obra === "em_construcao" ? "selected" : ""}>Em construção</option></select></div>
          <div class="campo"><label>Valor (R$)</label><input name="preco" inputmode="numeric" value="${p.preco ? Number(p.preco).toLocaleString("pt-BR") : ""}" ${dis}></div>
          <div class="campo"><label>Corretor responsável</label>${S.eu.is_admin ? `<select name="corretor_id">${optCorretores(p.corretor_id)}</select>` : `<input value="${esc(corretor(p.corretor_id)?.nome || "—")}" disabled>`}</div>
        </div>
        <div class="titulo-sub"><i data-lucide="map-pin"></i> Localização</div>
        <div class="grade-3">
          <div class="campo"><label>Cidade</label><input name="cidade" value="${v("cidade")}" ${dis}></div>
          <div class="campo"><label>Bairro</label><input name="bairro" value="${v("bairro")}" ${dis}></div>
          <div class="campo"><label>Endereço (interno)</label><input name="endereco" value="${v("endereco")}" ${dis}></div>
        </div>
        <div class="titulo-sub"><i data-lucide="ruler"></i> Ficha técnica</div>
        <div class="grade-3">
          ${[["area_privativa", "Área privativa (m²)"], ["area_total", "Área total (m²)"], ["quartos", "Quartos"], ["suites", "Suítes"], ["banheiros", "Banheiros"], ["vagas", "Vagas"], ["andar", "Andar"], ["ano", "Ano / entrega"], ["condominio", "Condomínio (R$/mês)"], ["iptu", "IPTU (R$/ano)"]]
            .map(([k, r]) => `<div class="campo"><label>${r}</label><input name="${k}" type="number" step="any" min="0" value="${v(k)}" ${dis}></div>`).join("")}
        </div>
        <div class="campo"><label>Descrição</label><textarea name="descricao" rows="5" ${dis}>${v("descricao")}</textarea></div>
        <div class="campo"><label>Diferenciais (um por linha)</label><textarea name="diferenciais" rows="4" ${dis}>${esc((p.diferenciais || []).join("\n"))}</textarea></div>
        <div class="titulo-sub"><i data-lucide="landmark"></i> Condições</div>
        <div style="display:flex;gap:18px;flex-wrap:wrap">
          <label class="switch"><input type="checkbox" name="aceita_financiamento" ${p.aceita_financiamento ? "checked" : ""} ${dis}> Aceita financiamento</label>
          <label class="switch"><input type="checkbox" name="aceita_fgts" ${p.aceita_fgts ? "checked" : ""} ${dis}> Aceita FGTS</label>
          <label class="switch"><input type="checkbox" name="mcmv" ${p.mcmv ? "checked" : ""} ${dis}> Minha Casa Minha Vida</label>
          <label class="switch"><input type="checkbox" name="destaque" ${p.destaque ? "checked" : ""} ${dis}> Destaque</label>
          <label class="switch"><input type="checkbox" name="publicado" ${p.publicado ? "checked" : ""} ${dis}> Publicado no site</label>
        </div>
        <div class="titulo-sub"><i data-lucide="image"></i> Fotos <small style="font-weight:500;color:var(--texto-suave)">(a 1ª é a capa)</small></div>
        <div class="fotos-prev" id="fotos-prev"></div>
        ${pode ? `<div class="grade-2"><div class="campo"><label>Enviar fotos</label><input type="file" id="up-fotos" accept="image/*" multiple></div>
          <div class="campo"><label>…ou colar URL</label><div style="display:flex;gap:6px"><input id="url-foto" placeholder="https://…"><button type="button" class="btn btn-escuro btn-sm" id="add-url">+</button></div></div></div>` : ""}
        <div class="titulo-sub"><i data-lucide="play-circle"></i> Material complementar</div>
        <div class="grade-3">
          <div class="campo"><label>Vídeo (YouTube)</label><input name="video_url" value="${v("video_url")}" ${dis}></div>
          <div class="campo"><label>Tour virtual (link)</label><input name="tour_url" value="${v("tour_url")}" ${dis}></div>
          <div class="campo"><label>Memorial / planta (PDF)</label><input name="ficha_pdf_url" value="${v("ficha_pdf_url")}" ${dis}></div>
        </div>
      </form>
      <div class="gaveta-rod"><button class="btn btn-contorno btn-sm" data-fechar>Fechar</button>${pode ? `<button class="btn btn-primario btn-sm" id="salvar-imovel"><i data-lucide="save"></i> Salvar imóvel</button>` : ""}</div>`);
    $$("[data-fechar]").forEach((b) => b.onclick = fecharGaveta);

    const prev = () => {
      $("#fotos-prev").innerHTML = fotos.length ? fotos.map((f, i) => `<div><img src="${esc(f)}" alt="" onerror="this.style.opacity=.3">${pode ? `<button type="button" data-rm="${i}" title="Remover">×</button>` : ""}</div>`).join("") : '<p style="color:var(--texto-suave);font-size:.85rem">Nenhuma foto.</p>';
      $$("[data-rm]").forEach((b) => b.onclick = () => { fotos.splice(Number(b.dataset.rm), 1); prev(); });
    };
    prev();
    if (pode) {
      $("#add-url").onclick = () => { const u = $("#url-foto").value.trim(); if (/^https?:\/\//.test(u)) { fotos.push(u); $("#url-foto").value = ""; prev(); } else toast("URL inválida", true); };
      $("#up-fotos").onchange = async (ev) => {
        const files = [...ev.target.files];
        for (const f of files) {
          if (f.size > 5 * 1024 * 1024) { toast(`${esc(f.name)}: máximo 5 MB`, true); continue; }
          toast(`Enviando ${esc(f.name)}…`);
          const r = await DB.uploadFoto(f, ($("#f-imovel").codigo.value || "sem-codigo").replace(/[^\w-]/g, ""));
          if (r.erro) { toast(esc(r.erro), true); break; }
          fotos.push(r.url); prev();
        }
        ev.target.value = "";
      };
      $("#salvar-imovel").onclick = async () => {
        const f = $("#f-imovel");
        if (!f.codigo.value.trim() || !f.titulo.value.trim()) { toast("Código e título são obrigatórios.", true); return; }
        const n = (k) => f[k].value === "" ? null : Number(f[k].value);
        const obj = {
          id: p.id, codigo: f.codigo.value.trim().toUpperCase(), titulo: f.titulo.value.trim(), tipo: f.tipo.value, finalidade: f.finalidade.value, status_obra: f.status_obra.value,
          preco: Number(soDigitos(f.preco.value)) || null, cidade: f.cidade.value.trim(), bairro: f.bairro.value.trim(), endereco: f.endereco.value.trim() || null,
          area_privativa: n("area_privativa"), area_total: n("area_total"), quartos: n("quartos"), suites: n("suites"), banheiros: n("banheiros"), vagas: n("vagas"), andar: n("andar"), ano: n("ano"),
          condominio: n("condominio"), iptu: n("iptu"), descricao: f.descricao.value.trim(),
          diferenciais: f.diferenciais.value.split("\n").map((s) => s.trim()).filter(Boolean), fotos,
          aceita_financiamento: f.aceita_financiamento.checked, aceita_fgts: f.aceita_fgts.checked, mcmv: f.mcmv.checked, destaque: f.destaque.checked, publicado: f.publicado.checked,
          video_url: f.video_url.value.trim() || null, tour_url: f.tour_url.value.trim() || null, ficha_pdf_url: f.ficha_pdf_url.value.trim() || null,
          corretor_id: f.corretor_id ? (f.corretor_id.value || null) : (p.corretor_id || S.eu.id)
        };
        if (!obj.id) delete obj.id;
        const { error } = await DB.salvar("imoveis", obj);
        if (!error) { toast("Imóvel salvo"); fecharGaveta(); S.imoveis = await DB.imoveis(); renderTudo(); }
      };
    }
  }

  /* ==========================================================
     INDICADORES
     ========================================================== */
  function barras(pares, total) {
    const max = Math.max(1, ...pares.map((p) => p[1]));
    return pares.length ? pares.map(([n, v]) => `<div class="barra-h"><span title="${esc(n)}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(n)}</span><span class="trilho"><i style="width:${(v / max * 100).toFixed(1)}%"></i></span><b>${v}</b></div>`).join("")
      : '<p style="color:var(--texto-suave);font-size:.86rem">Sem dados no período.</p>';
  }
  const contar = (lista, fn) => Object.entries(lista.reduce((a, l) => { const k = fn(l) || "—"; a[k] = (a[k] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]);
  function renderIndicadores() {
    const dias = Number($("#periodo").value);
    const L = S.leads.filter((l) => !dias || (Date.now() - new Date(l.criado_em)) < dias * 864e5);
    const ganhos = L.filter((l) => l.status === "ganho"), perdidos = L.filter((l) => l.status === "perdido");
    const finalizados = ganhos.length + perdidos.length;
    $("#kpis-ind").innerHTML = [
      ["Leads recebidos", L.length, dias ? `nos últimos ${dias} dias` : "todo o período"],
      ["Taxa de conversão", L.length ? (ganhos.length / L.length * 100).toFixed(1) + "%" : "—", `${ganhos.length} fechados`],
      ["Aproveitamento", finalizados ? (ganhos.length / finalizados * 100).toFixed(0) + "%" : "—", "ganhos ÷ (ganhos + perdidos)"],
      ["Volume fechado", moeda(ganhos.reduce((s, l) => s + Number(l.valor_estimado || 0), 0)), "soma dos valores estimados"]
    ].map(([a, b, c]) => `<div class="kpi"><span>${a}</span><b>${b}</b><small>${c}</small></div>`).join("");

    const ordem = ETAPAS.filter((e) => e.id !== "perdido");
    const idx = Object.fromEntries(ordem.map((e, i) => [e.id, i]));
    const alcancou = ordem.map((e, i) => [e.nome, L.filter((l) => l.status !== "perdido" && idx[l.status] >= i).length]);
    const maxF = Math.max(1, alcancou[0][1]);
    const porCorretor = S.corretores.map((c) => { const ls = L.filter((l) => l.corretor_id === c.id); return [c.nome, ls.length, ls.filter((l) => l.status === "ganho").length]; }).filter((x) => x[1]).sort((a, b) => b[1] - a[1]);
    $("#paineis").innerHTML = `
      <div class="painel-card"><h3>Funil (leads que alcançaram cada etapa)</h3><div class="funil-vis">${alcancou.map(([n, v]) => `<div style="width:${Math.max(40, v / maxF * 100)}%;opacity:${0.55 + 0.45 * v / maxF}"><span>${n}</span><span>${v}</span></div>`).join("")}</div>
        <p style="font-size:.76rem;color:var(--texto-suave);margin-top:10px">Leads perdidos não entram nesta visão (${perdidos.length} no período).</p></div>
      <div class="painel-card"><h3>Origem dos leads</h3>${barras(contar(L, (l) => l.origem))}</div>
      <div class="painel-card"><h3>Interesse</h3>${barras(contar(L, (l) => l.interesse))}</div>
      <div class="painel-card"><h3>Por corretor <small style="font-weight:500;color:var(--texto-suave)">(leads · fechados)</small></h3>${porCorretor.length ? porCorretor.map(([n, v, g]) => `<div class="barra-h" style="grid-template-columns:130px 1fr 64px"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(n)}</span><span class="trilho"><i style="width:${v / porCorretor[0][1] * 100}%"></i></span><b>${v} · <span style="color:#1F9D55">${g}</span></b></div>`).join("") : '<p style="color:var(--texto-suave);font-size:.86rem">Sem dados.</p>'}
        <p style="font-size:.76rem;color:var(--texto-suave);margin-top:8px">${L.filter((l) => !l.corretor_id).length} lead(s) sem corretor no período.</p></div>
      <div class="painel-card"><h3>Imóveis mais procurados</h3>${barras(contar(L.filter((l) => l.imovel_ref), (l) => l.imovel_ref).slice(0, 6))}</div>
      <div class="painel-card"><h3>Motivos de perda</h3>${barras(contar(perdidos, (l) => l.motivo_perda))}</div>`;
  }

  /* ==========================================================
     EQUIPE
     ========================================================== */
  function renderEquipe() {
    $("#novo-corretor").hidden = !S.eu.is_admin;
    $("#tb-equipe").innerHTML = S.corretores.map((c) => {
      const ativos = S.leads.filter((l) => l.corretor_id === c.id && !["ganho", "perdido"].includes(l.status)).length;
      return `<tr data-id="${esc(c.id)}"><td style="display:flex;align-items:center;gap:10px"><span class="mini-av" style="margin:0;width:34px;height:34px;font-size:.75rem">${c.foto_url ? `<img src="${esc(c.foto_url)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : iniciais(c.nome)}</span><b>${esc(c.nome)}</b></td>
        <td>${esc(c.creci || "")}</td><td>${esc(c.email || "")}</td><td>${esc(c.whatsapp || "")}</td><td>${ativos}</td>
        <td>${c.is_admin ? '<span class="etq laranja">Administrador</span>' : '<span class="etq">Corretor</span>'}</td><td>${c.ativo ? '<span class="st" style="color:#1F9D55">Ativo</span>' : '<span class="st" style="color:#9A9BA1">Inativo</span>'}</td></tr>`;
    }).join("");
    $$("#tb-equipe tr[data-id]").forEach((tr) => tr.onclick = () => abrirCorretor(tr.dataset.id));
  }
  function abrirCorretor(id) {
    const c = id ? corretor(id) : { nome: "", email: "", creci: "", whatsapp: "55", especialidades: [], bio: "", foto_url: "", ativo: true, is_admin: false };
    const proprio = c.id === S.eu.id, admin = S.eu.is_admin;
    if (!admin && !proprio) { toast("Você só pode editar o seu próprio perfil.", true); return; }
    const v = (k) => esc(c[k] ?? "");
    abrirGaveta(`
      <div class="gaveta-cab"><div><h2>${id ? esc(c.nome) : "Novo corretor"}</h2><p>Dados exibidos na página pública dos corretores.</p></div><button class="fechar-g" data-fechar aria-label="Fechar"><i data-lucide="x"></i></button></div>
      <form class="gaveta-corpo" id="f-cor">
        <div class="grade-2">
          <div class="campo cheia"><label>Nome completo *</label><input name="nome" value="${v("nome")}" required></div>
          <div class="campo"><label>CRECI</label><input name="creci" value="${v("creci")}" placeholder="CRECI 00000-F"></div>
          <div class="campo"><label>WhatsApp (55 + DDD + número)</label><input name="whatsapp" value="${v("whatsapp")}" inputmode="numeric"></div>
          <div class="campo cheia"><label>E-mail de acesso ao painel</label><input name="email" type="email" value="${v("email")}" ${admin ? "" : "disabled"}>
            ${admin ? '<span class="ajuda">Crie um usuário com este mesmo e-mail em Supabase → Authentication → Users. No primeiro login o acesso é vinculado automaticamente.</span>' : ""}</div>
          <div class="campo cheia"><label>Especialidades (separadas por vírgula)</label><input name="especialidades" value="${esc((c.especialidades || []).join(", "))}"></div>
          <div class="campo cheia"><label>Mini-biografia</label><textarea name="bio" maxlength="240">${v("bio")}</textarea></div>
          <div class="campo cheia"><label>Foto (URL)</label><input name="foto_url" value="${v("foto_url")}" placeholder="https://…"></div>
          ${admin ? `<label class="switch"><input type="checkbox" name="ativo" ${c.ativo ? "checked" : ""} ${proprio ? "disabled" : ""}> Ativo (aparece no site e acessa o painel)</label>
          <label class="switch"><input type="checkbox" name="is_admin" ${c.is_admin ? "checked" : ""} ${proprio ? "disabled" : ""}> Administrador</label>` : ""}
        </div>
      </form>
      <div class="gaveta-rod"><button class="btn btn-contorno btn-sm" data-fechar>Fechar</button><button class="btn btn-primario btn-sm" id="salvar-cor"><i data-lucide="save"></i> Salvar</button></div>`);
    $$("[data-fechar]").forEach((b) => b.onclick = fecharGaveta);
    $("#salvar-cor").onclick = async () => {
      const f = $("#f-cor");
      if (!f.nome.value.trim()) { toast("Informe o nome.", true); return; }
      const obj = { id: c.id, nome: f.nome.value.trim(), creci: f.creci.value.trim(), whatsapp: soDigitos(f.whatsapp.value), especialidades: f.especialidades.value.split(",").map((s) => s.trim()).filter(Boolean), bio: f.bio.value.trim(), foto_url: f.foto_url.value.trim() || null };
      if (admin) { obj.email = f.email.value.trim().toLowerCase() || null; if (!proprio) { obj.ativo = f.ativo.checked; obj.is_admin = f.is_admin.checked; } }
      if (!obj.id) delete obj.id;
      const { error } = await DB.salvar("corretores", obj);
      if (!error) { toast("Perfil salvo"); fecharGaveta(); S.corretores = await DB.corretores(); if (proprio) S.eu = corretor(S.eu.id) || S.eu; renderTudo(); usuario(); }
    };
  }

  /* ==========================================================
     NAVEGAÇÃO, TEMPO REAL E INÍCIO
     ========================================================== */
  function usuario() {
    $("#u-nome").textContent = S.eu.nome; $("#u-papel").textContent = S.eu.is_admin ? "Administrador" : "Corretor";
    $("#u-avatar").innerHTML = S.eu.foto_url ? `<img src="${esc(S.eu.foto_url)}" alt="">` : iniciais(S.eu.nome);
  }
  function mostrarVista(v) {
    S.vista = v;
    $$(".menu-app button").forEach((b) => b.classList.toggle("ativo", b.dataset.vista === v));
    $$(".vista").forEach((s) => s.classList.toggle("ativa", s.id === "v-" + v));
    $("#lateral").classList.remove("aberta");
    history.replaceState(null, "", "#" + v);
  }
  function tempoReal() {
    if (!ONLINE) return;
    sb.channel("leads-realiza")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, ({ new: l }) => {
        if (S.leads.find((x) => x.id === l.id)) return;
        S.leads.unshift(l); renderTudo();
        toast(`<b>Novo lead:</b> ${esc(l.nome)} — ${esc(l.interesse || "")}`);
        const card = $(`#kanban .lead[data-id="${CSS.escape(l.id)}"]`); if (card) card.classList.add("novo-pisca");
        if (document.hidden && "Notification" in window && Notification.permission === "granted") new Notification("Novo lead — Realiza", { body: `${l.nome} · ${l.interesse || ""}`, icon: "../assets/img/favicon.png" });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, ({ new: l }) => {
        const i = S.leads.findIndex((x) => x.id === l.id); if (i >= 0) { S.leads[i] = l; renderTudo(); }
      })
      .subscribe();
    if ("Notification" in window && Notification.permission === "default") setTimeout(() => Notification.requestPermission(), 4000);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    S.eu = await DB.eu(); if (!S.eu) return;
    $("#app").hidden = false; $("#faixa-demo").hidden = ONLINE;
    usuario();
    $("#filtro-etapa").innerHTML = `<option value="">Todas as etapas</option>` + ETAPAS.map((e) => `<option value="${e.id}">${e.nome}</option>`).join("");
    $$(".menu-app button").forEach((b) => b.onclick = () => mostrarVista(b.dataset.vista));
    $$(".menu-movel").forEach((b) => b.onclick = () => $("#lateral").classList.toggle("aberta"));
    $("#veu").onclick = fecharGaveta;
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharGaveta(); });
    $("#sair").onclick = () => DB.sair();
    $("#busca-funil").oninput = (e) => { S.buscaFunil = e.target.value; renderFunil(); ic(); };
    $("#filtro-dono").onchange = (e) => { S.dono = e.target.value; renderFunil(); ic(); };
    $("#busca-leads").oninput = renderLeads; $("#filtro-etapa").onchange = renderLeads;
    $("#busca-imoveis").oninput = () => { renderImoveis(); ic(); };
    $("#periodo").onchange = renderIndicadores;
    $("#exportar").onclick = exportarCSV;
    $$("[data-novo-lead]").forEach((b) => b.onclick = novoLead);
    $("#novo-imovel").onclick = () => abrirImovel(null);
    $("#novo-corretor").onclick = () => abrirCorretor(null);
    const h = location.hash.slice(1); if (["funil", "leads", "imoveis", "indicadores", "equipe"].includes(h)) mostrarVista(h);
    await recarregar();
    tempoReal();
  });
})();
