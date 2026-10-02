/* ==========================================================
   CAMADA DE DADOS (site público)
   Supabase quando configurado · demonstração local caso contrário
   ========================================================== */
window.RZ = (() => {
  const cfg = window.REALIZA_CONFIG;
  const online = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const sb = online ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  const moeda = (v) => (v == null || v === "") ? "Consulte" :
    Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const moeda2 = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const iniciais = (n) => String(n || "?").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  const wa = (numero, texto) => `https://wa.me/${String(numero || cfg.empresa.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(texto || "")}`;
  // Colunas liberadas ao público (o endereço completo e e-mails ficam restritos ao painel)
  const COL_IMOVEL = "id,codigo,titulo,tipo,finalidade,status_obra,preco,condominio,iptu,cidade,bairro,area_privativa,area_total,quartos,suites,banheiros,vagas,andar,ano,descricao,diferenciais,fotos,aceita_financiamento,aceita_fgts,mcmv,destaque,publicado,video_url,tour_url,ficha_pdf_url,corretor_id,criado_em";
  const COL_CORRETOR = "id,nome,creci,whatsapp,especialidades,bio,foto_url,ativo";
  const STATUS_OBRA = { pronto: "Pronto para morar", lancamento: "Lançamento", em_construcao: "Em construção" };

  async function listarImoveis() {
    if (!sb) return window.DEMO_IMOVEIS.filter((i) => i.publicado);
    const { data, error } = await sb.from("imoveis").select(COL_IMOVEL).eq("publicado", true)
      .order("destaque", { ascending: false }).order("criado_em", { ascending: false });
    if (error) { console.error(error); return []; }
    return data || [];
  }
  async function obterImovel(id) {
    if (!sb) return window.DEMO_IMOVEIS.find((i) => i.id === id || i.codigo === id) || null;
    const col = /^RZ-/i.test(id) ? "codigo" : "id";
    const { data, error } = await sb.from("imoveis").select(COL_IMOVEL).eq(col, id).eq("publicado", true).maybeSingle();
    if (error) console.error(error);
    return data || null;
  }
  async function listarCorretores() {
    if (!sb) return window.DEMO_CORRETORES.filter((c) => c.ativo);
    const { data, error } = await sb.from("corretores").select(COL_CORRETOR).eq("ativo", true).order("nome");
    if (error) { console.error(error); return []; }
    return data || [];
  }
  async function enviarLead(lead) {
    const registro = { ...lead, status: "novo", consentimento: true };
    if (!sb) {
      try {
        const k = "rz_demo_leads_site"; const arr = JSON.parse(localStorage.getItem(k) || "[]");
        arr.push({ ...registro, id: "s" + Date.now(), criado_em: new Date().toISOString() });
        localStorage.setItem(k, JSON.stringify(arr));
      } catch (e) { /* sem storage: segue */ }
      return { ok: true, demo: true };
    }
    const { error } = await sb.from("leads").insert(registro);
    if (error) console.error(error);
    return { ok: !error, error };
  }

  /* Simulação de financiamento: SAC e PRICE */
  function simular({ valor, entrada, anos, taxaAnual, sistema }) {
    const pv = Math.max(0, valor - entrada);
    const n = Math.round(anos * 12);
    const i = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1; // taxa efetiva mensal
    if (!pv || !n) return null;
    if (sistema === "price") {
      const pmt = i === 0 ? pv / n : pv * i / (1 - Math.pow(1 + i, -n));
      return { financiado: pv, primeira: pmt, ultima: pmt, total: pmt * n, juros: pmt * n - pv, n, i };
    }
    const amort = pv / n;
    const primeira = amort + pv * i;
    const ultima = amort + amort * i;
    const juros = i * amort * n * (n + 1) / 2;
    return { financiado: pv, primeira, ultima, total: pv + juros, juros, n, i };
  }

  return { cfg, online, sb, moeda, moeda2, esc, iniciais, wa, STATUS_OBRA, listarImoveis, obterImovel, listarCorretores, enviarLead, simular };
})();

/* Utilidades de interface compartilhadas */
document.addEventListener("DOMContentLoaded", () => {
  const cfg = window.REALIZA_CONFIG.empresa;
  document.querySelectorAll("[data-empresa]").forEach((el) => {
    const v = cfg[el.dataset.empresa]; if (v) el.textContent = v;
  });
  document.querySelectorAll("[data-wa]").forEach((el) => {
    el.href = RZ.wa(cfg.whatsapp, el.dataset.wa || "Olá! Vim pelo site da Realiza e gostaria de atendimento.");
    el.target = "_blank"; el.rel = "noopener";
  });
  document.querySelectorAll("[data-tel]").forEach((el) => el.href = "tel:+" + cfg.whatsapp.replace(/\D/g, ""));
  document.querySelectorAll("[data-mail]").forEach((el) => el.href = "mailto:" + cfg.email);
  document.querySelectorAll("[data-social]").forEach((el) => {
    const v = cfg[el.dataset.social]; if (v) el.href = v; else el.remove();
  });
  document.querySelectorAll("[data-ano]").forEach((el) => el.textContent = new Date().getFullYear());

  const header = document.querySelector(".topo");
  if (header) {
    const f = () => header.classList.toggle("rolado", window.scrollY > 20);
    f(); window.addEventListener("scroll", f, { passive: true });
  }
  const btn = document.querySelector(".menu-btn"), nav = document.querySelector(".nav");
  if (btn && nav) {
    btn.addEventListener("click", () => { const a = nav.classList.toggle("aberto"); btn.setAttribute("aria-expanded", a); });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("aberto"); btn.setAttribute("aria-expanded", false); }));
  }
  if (!RZ.online) {
    const b = document.createElement("div");
    b.className = "aviso-demo";
    b.innerHTML = "Modo demonstração — conteúdo de exemplo. Configure o Supabase em <code>assets/js/config.js</code>.";
    document.body.appendChild(b);
  }
  window.rzRevelar = () => {
    const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visivel"); io.unobserve(e.target); }
    }), { threshold: 0.12 }) : null;
    document.querySelectorAll(".revelar:not(.visivel)").forEach((el) => io ? io.observe(el) : el.classList.add("visivel"));
  };
  window.rzRevelar();
  if (window.lucide) lucide.createIcons();
});
