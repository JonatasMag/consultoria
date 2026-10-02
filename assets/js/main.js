/* ==========================================================
   PÁGINA INICIAL — ofertas, filtros, simulador, corretores, lead
   ========================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const ic = () => window.lucide && lucide.createIcons();
  const num = (s) => Number(String(s || "").replace(/\D/g, "")) || 0;
  const milhar = (n) => n ? Number(n).toLocaleString("pt-BR") : "";

  let IMOVEIS = [], CORRETORES = [];
  const FAIXAS = {
    venda: [300000, 500000, 800000, 1200000, 2000000],
    locacao: [1500, 2500, 4000, 6000]
  };

  /* ---------- Cartão de imóvel ---------- */
  function cardImovel(p) {
    const foto = (p.fotos && p.fotos[0]) || "";
    const tags = [];
    if (p.status_obra === "lancamento") tags.push('<span class="tag tag-laranja">Lançamento</span>');
    else if (p.status_obra === "em_construcao") tags.push('<span class="tag tag-escura">Em construção</span>');
    if (p.destaque) tags.push('<span class="tag">★ Destaque</span>');
    if (p.mcmv) tags.push('<span class="tag tag-verde">MCMV</span>');
    const loc = p.finalidade === "locacao";
    const specs = [
      p.area_privativa ? `<span><i data-lucide="ruler"></i>${p.area_privativa} m²</span>` : "",
      p.quartos ? `<span><i data-lucide="bed-double"></i>${p.quartos} qto${p.quartos > 1 ? "s" : ""}</span>` : "",
      p.banheiros ? `<span><i data-lucide="bath"></i>${p.banheiros}</span>` : "",
      p.vagas ? `<span><i data-lucide="car"></i>${p.vagas} vaga${p.vagas > 1 ? "s" : ""}</span>` : ""
    ].join("");
    const url = `imovel.html?id=${encodeURIComponent(p.id)}`;
    return `<article class="card-imovel revelar">
      <a class="card-foto" href="${url}" aria-label="${RZ.esc(p.titulo)}">
        ${foto ? `<img src="${RZ.esc(foto)}" alt="${RZ.esc(p.titulo)}" loading="lazy" onerror="this.remove()">` : ""}
        <div class="card-tags">${tags.join("")}</div>
        <span class="card-codigo">${RZ.esc(p.codigo || "")}</span>
      </a>
      <div class="card-corpo">
        <span class="card-local"><i data-lucide="map-pin"></i>${RZ.esc(p.bairro)} · ${RZ.esc(p.cidade)}</span>
        <h3><a href="${url}">${RZ.esc(p.titulo)}</a></h3>
        <div class="card-specs">${specs || `<span><i data-lucide="info"></i>${RZ.esc(p.tipo)}</span>`}</div>
        <div class="card-rodape">
          <span class="preco">${RZ.moeda(p.preco)}${loc ? "<small>/mês</small>" : ""}</span>
          <a class="btn btn-escuro btn-sm" href="${url}">Ficha técnica <i data-lucide="arrow-right"></i></a>
        </div>
      </div>
    </article>`;
  }

  /* ---------- Filtros ---------- */
  const filtro = { fin: "venda", tipo: "", bairro: "", quartos: 0, precoMax: 0, texto: "", extra: "", ordem: "destaque" };

  function aplicar() {
    const t = filtro.texto.trim().toLowerCase();
    let lista = IMOVEIS.filter((p) =>
      (!filtro.fin || p.finalidade === filtro.fin) &&
      (!filtro.tipo || p.tipo === filtro.tipo) &&
      (!filtro.bairro || p.bairro === filtro.bairro) &&
      ((p.quartos || 0) >= filtro.quartos) &&
      (!filtro.precoMax || Number(p.preco) <= filtro.precoMax) &&
      (!filtro.extra ||
        (filtro.extra === "fin" && p.aceita_financiamento) ||
        (filtro.extra === "fgts" && p.aceita_fgts) ||
        (filtro.extra === "mcmv" && p.mcmv) ||
        (filtro.extra === "lancamento" && p.status_obra !== "pronto")) &&
      (!t || [p.titulo, p.codigo, p.bairro, p.descricao, ...(p.diferenciais || [])].join(" ").toLowerCase().includes(t))
    );
    const o = filtro.ordem;
    lista.sort((a, b) => o === "menor" ? a.preco - b.preco : o === "maior" ? b.preco - a.preco :
      o === "area" ? (b.area_privativa || 0) - (a.area_privativa || 0) : (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0));

    const grade = $("#grade-imoveis");
    grade.innerHTML = lista.length ? lista.map(cardImovel).join("") :
      `<div class="vazio"><p><b>Nenhum imóvel com esses filtros no momento.</b></p><p style="margin:8px 0 16px">Encomende: nossos corretores buscam para você, inclusive fora do portfólio.</p><a href="#contato" class="btn btn-primario btn-sm" data-interesse="Encomendar imóvel">Encomendar imóvel</a></div>`;
    $("#contador").textContent = `${lista.length} imóve${lista.length === 1 ? "l encontrado" : "is encontrados"}`;
    ic(); window.rzRevelar && rzRevelar(); ligarInteresse();
  }

  function preencherSelect(sel, valores, primeiro = "Todos") {
    const atual = sel.value;
    sel.innerHTML = `<option value="">${primeiro}</option>` + valores.map((v) => `<option>${RZ.esc(v)}</option>`).join("");
    if (valores.includes(atual)) sel.value = atual;
  }
  function faixasPreco(sel, fin) {
    const f = FAIXAS[fin] || FAIXAS.venda;
    sel.innerHTML = `<option value="">Sem limite</option>` + f.map((v) => `<option value="${v}">até ${RZ.moeda(v)}</option>`).join("");
  }
  function opcoesFiltros() {
    const base = IMOVEIS.filter((p) => !filtro.fin || p.finalidade === filtro.fin);
    const tipos = [...new Set(base.map((p) => p.tipo))].sort();
    const bairros = [...new Set(base.map((p) => p.bairro))].sort();
    preencherSelect($("#f-tipo"), tipos); preencherSelect($("#b-tipo"), tipos);
    preencherSelect($("#f-bairro"), bairros); preencherSelect($("#b-bairro"), bairros);
    faixasPreco($("#b-preco"), filtro.fin || "venda");
  }

  function ligarFiltros() {
    const map = { "f-fin": "fin", "f-tipo": "tipo", "f-bairro": "bairro", "f-quartos": "quartos", "f-extra": "extra", "f-ordem": "ordem" };
    Object.entries(map).forEach(([id, k]) => $("#" + id).addEventListener("change", (e) => {
      filtro[k] = k === "quartos" ? Number(e.target.value) : e.target.value;
      if (k === "fin") { opcoesFiltros(); filtro.precoMax = 0; }
      aplicar();
    }));
    $("#form-filtros").addEventListener("reset", () => setTimeout(() => {
      Object.assign(filtro, { fin: "venda", tipo: "", bairro: "", quartos: 0, precoMax: 0, texto: "", extra: "", ordem: "destaque" });
      opcoesFiltros(); aplicar();
    }));

    // Busca do hero
    $$("#form-busca .abas button").forEach((b) => b.addEventListener("click", () => {
      $$("#form-busca .abas button").forEach((x) => x.classList.toggle("ativo", x === b));
      filtro.fin = b.dataset.fin; $("#f-fin").value = filtro.fin; opcoesFiltros();
    }));
    $("#form-busca").addEventListener("submit", (e) => {
      e.preventDefault();
      Object.assign(filtro, {
        tipo: $("#b-tipo").value, bairro: $("#b-bairro").value, quartos: Number($("#b-quartos").value),
        precoMax: Number($("#b-preco").value) || 0, texto: $("#b-texto").value
      });
      $("#f-tipo").value = filtro.tipo; $("#f-bairro").value = filtro.bairro; $("#f-quartos").value = filtro.quartos;
      aplicar();
      $("#imoveis").scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------- Simulador ---------- */
  function simulador() {
    const cfg = RZ.cfg.financiamento;
    $("#s-taxa").value = cfg.taxaAnualPadrao; $("#s-prazo").max = cfg.prazoMaxAnos;
    ["s-valor", "s-entrada", "s-renda"].forEach((id) => $("#" + id).addEventListener("input", (e) => {
      const n = num(e.target.value); e.target.value = milhar(n); calc();
    }));
    ["s-prazo", "s-taxa", "s-sistema"].forEach((id) => $("#" + id).addEventListener("input", calc));
    $("#s-valor").addEventListener("change", () => {
      const v = num($("#s-valor").value), ent = num($("#s-entrada").value);
      if (ent < v * cfg.entradaMinPct / 100) { $("#s-entrada").value = milhar(Math.round(v * cfg.entradaMinPct / 100)); calc(); }
    });
    calc();

    $("#btn-credito").addEventListener("click", () => {
      $("#l-interesse").value = "Financiamento";
      const r = window.__ultimaSim;
      if (r) $("#l-msg").value = `Gostaria de análise de crédito. Simulação no site: imóvel de ${RZ.moeda(r.valor)}, entrada de ${RZ.moeda(r.entrada)}, ${r.anos} anos (${r.sistema.toUpperCase()}), 1ª parcela estimada de ${RZ.moeda2(r.primeira)}.`;
      window.__origemLead = "simulador";
    });
    $("#btn-ver-faixa").addEventListener("click", () => {
      filtro.fin = "venda"; filtro.precoMax = Math.round(num($("#s-valor").value) * 1.1); filtro.extra = "fin";
      $("#f-fin").value = "venda"; $("#f-extra").value = "fin"; aplicar();
    });
  }
  function calc() {
    const cfg = RZ.cfg.financiamento;
    const valor = num($("#s-valor").value), entrada = num($("#s-entrada").value);
    const anos = Number($("#s-prazo").value), taxa = Number($("#s-taxa").value) || 0, sistema = $("#s-sistema").value;
    const renda = num($("#s-renda").value);
    $("#o-prazo").textContent = anos + " anos";
    const r = RZ.simular({ valor, entrada, anos, taxaAnual: taxa, sistema });
    const nota = $("#r-nota");
    if (!r) { ["r-primeira", "r-ultima", "r-financiado", "r-juros", "r-renda"].forEach((id) => $("#" + id).textContent = "—"); return; }
    const rendaMin = r.primeira / 0.3;
    $("#r-primeira").textContent = RZ.moeda2(r.primeira);
    $("#r-ultima").textContent = RZ.moeda2(r.ultima);
    $("#r-financiado").textContent = RZ.moeda(r.financiado);
    $("#r-juros").textContent = RZ.moeda(r.juros);
    $("#r-renda").textContent = RZ.moeda(rendaMin);
    const pct = valor ? entrada / valor * 100 : 0;
    let aviso = "Estimativa sem seguros (MIP/DFI) e tarifas. A aprovação e as condições finais dependem da análise do banco.";
    if (pct < cfg.entradaMinPct) aviso = `⚠ A maioria dos bancos exige entrada mínima de ${cfg.entradaMinPct}% (${RZ.moeda(valor * cfg.entradaMinPct / 100)}). Com FGTS ou MCMV isso pode mudar — fale com um corretor.`;
    else if (renda && renda < rendaMin) aviso = `⚠ Pela regra usual (parcela até 30% da renda), a renda informada fica abaixo do necessário. Aumentar a entrada, o prazo ou compor renda pode resolver.`;
    else if (renda) aviso = `✔ A parcela compromete ${(r.primeira / renda * 100).toFixed(1)}% da renda informada. ` + aviso;
    nota.textContent = aviso;
    window.__ultimaSim = { valor, entrada, anos, sistema, primeira: r.primeira };
  }

  /* ---------- Corretores ---------- */
  function cardCorretor(c) {
    const foto = c.foto_url ? `<img src="${RZ.esc(c.foto_url)}" alt="${RZ.esc(c.nome)}" loading="lazy">` : RZ.iniciais(c.nome);
    const chips = (c.especialidades || []).map((e) => `<span class="chip">${RZ.esc(e)}</span>`).join("");
    const msg = `Olá, ${c.nome.split(" ")[0]}! Vim pelo site da Realiza e gostaria de atendimento.`;
    return `<article class="corretor revelar">
      <div class="corretor-topo"></div>
      <div class="avatar">${foto}</div>
      <div class="corretor-corpo">
        <h3>${RZ.esc(c.nome)}</h3>
        <span class="creci">${RZ.esc(c.creci || "")}</span>
        <div class="chips">${chips}</div>
        <p>${RZ.esc(c.bio || "")}</p>
        <div class="corretor-acoes">
          <a class="btn btn-wa btn-sm" href="${RZ.wa(c.whatsapp, msg)}" target="_blank" rel="noopener"><i data-lucide="message-circle"></i> WhatsApp</a>
          <a class="btn btn-contorno btn-sm" href="#contato" data-corretor="${RZ.esc(c.id)}"><i data-lucide="calendar"></i> Agendar</a>
        </div>
      </div>
    </article>`;
  }
  function renderCorretores() {
    $("#grade-corretores").innerHTML = CORRETORES.length ? CORRETORES.map(cardCorretor).join("") :
      `<div class="vazio">Nossa equipe será apresentada em breve. Fale conosco pelo WhatsApp.</div>`;
    $("#l-corretor").innerHTML = `<option value="">Qualquer corretor</option>` + CORRETORES.map((c) => `<option value="${RZ.esc(c.id)}">${RZ.esc(c.nome)}</option>`).join("");
    $$("[data-corretor]").forEach((a) => a.addEventListener("click", () => { $("#l-corretor").value = a.dataset.corretor; }));
    ic(); window.rzRevelar && rzRevelar();
  }

  /* ---------- Formulário de lead ---------- */
  function ligarInteresse() {
    $$("[data-interesse]").forEach((a) => {
      if (a.dataset.lig) return; a.dataset.lig = 1;
      a.addEventListener("click", () => { $("#l-interesse").value = a.dataset.interesse; window.__origemLead = "site-" + a.dataset.interesse.toLowerCase().replace(/\s+/g, "-"); });
    });
  }
  function formLead() {
    const f = $("#form-lead"), ret = $("#l-retorno"), btn = $("#l-enviar");
    $("#l-tel").addEventListener("input", (e) => {
      let d = e.target.value.replace(/\D/g, "").slice(0, 11);
      e.target.value = d.length > 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
    });
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      ret.className = "form-msg";
      if (f.site.value) return; // robô (honeypot)
      const nome = f.nome.value.trim(), tel = f.telefone.value.replace(/\D/g, "");
      const erro = !nome ? "Informe seu nome." : tel.length < 10 ? "Informe um WhatsApp válido com DDD." :
        (f.email.value && !f.email.checkValidity()) ? "E-mail inválido." : !$("#l-lgpd").checked ? "Marque a autorização de contato (LGPD)." : "";
      if (erro) { ret.textContent = erro; ret.className = "form-msg erro"; return; }
      const imovelSel = IMOVEIS.find((p) => p.id === f.imovel_id.value);
      const lead = {
        nome, telefone: f.telefone.value, email: f.email.value.trim() || null, interesse: f.interesse.value,
        mensagem: f.mensagem.value.trim() || null,
        imovel_id: RZ.online && imovelSel ? imovelSel.id : null,
        imovel_ref: imovelSel ? `${imovelSel.codigo} — ${imovelSel.titulo}` : null,
        corretor_id: RZ.online ? (f.corretor_id.value || null) : null,
        origem: window.__origemLead || "site-contato"
      };
      btn.disabled = true; btn.innerHTML = "Enviando…";
      const r = await RZ.enviarLead(lead);
      btn.disabled = false; btn.innerHTML = '<i data-lucide="send"></i> Enviar e falar com um corretor'; ic();
      const corretor = CORRETORES.find((c) => c.id === f.corretor_id.value);
      const textoWa = `Olá! Sou ${nome}. Interesse: ${lead.interesse}${lead.imovel_ref ? " — " + lead.imovel_ref : ""}. ${lead.mensagem || ""}`;
      if (r.ok) {
        ret.innerHTML = `<b>Recebemos seu contato, ${RZ.esc(nome.split(" ")[0])}!</b> Um corretor retorna ainda hoje (dia útil). Se preferir agilizar, <a href="${RZ.wa(corretor && corretor.whatsapp, textoWa)}" target="_blank" rel="noopener" style="text-decoration:underline;font-weight:700">chame no WhatsApp</a>.`;
        ret.className = "form-msg ok"; f.reset(); window.__origemLead = null;
      } else {
        ret.innerHTML = `Não conseguimos registrar agora. <a href="${RZ.wa(null, textoWa)}" target="_blank" rel="noopener" style="text-decoration:underline;font-weight:700">Envie pelo WhatsApp</a> — é instantâneo.`;
        ret.className = "form-msg erro";
      }
    });
  }

  /* ---------- Início ---------- */
  document.addEventListener("DOMContentLoaded", async () => {
    ligarFiltros(); simulador(); formLead(); ligarInteresse();
    [IMOVEIS, CORRETORES] = await Promise.all([RZ.listarImoveis(), RZ.listarCorretores()]);
    $("#n-imoveis").textContent = IMOVEIS.length; $("#n-corretores").textContent = CORRETORES.length;
    $("#l-imovel").innerHTML = `<option value="">Nenhum específico</option>` + IMOVEIS.map((p) => `<option value="${RZ.esc(p.id)}">${RZ.esc(p.codigo)} — ${RZ.esc(p.titulo)}</option>`).join("");
    // Vindo da ficha técnica: ?imovel=ID#contato
    const q = new URLSearchParams(location.search);
    if (q.get("imovel")) $("#l-imovel").value = q.get("imovel");
    opcoesFiltros(); aplicar(); renderCorretores();
  });
})();
