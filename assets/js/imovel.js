/* ==========================================================
   FICHA TÉCNICA DO IMÓVEL
   ========================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const ic = () => window.lucide && lucide.createIcons();
  const e = RZ.esc;

  const ytId = (u) => { const m = String(u || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : null; };
  const linha = (rot, val) => (val === null || val === undefined || val === "" || val === 0 && !/Vagas|Suítes/.test(rot)) ? "" : `<tr><th>${rot}</th><td>${val}</td></tr>`;

  function semelhantes(p, todos) {
    return todos.filter((x) => x.id !== p.id && x.finalidade === p.finalidade)
      .map((x) => ({ x, d: Math.abs(x.preco - p.preco) / (p.preco || 1) + (x.tipo === p.tipo ? 0 : .5) + (x.bairro === p.bairro ? -.2 : 0) }))
      .sort((a, b) => a.d - b.d).slice(0, 3).map((o) => o.x);
  }

  function render(p, corretor, todos) {
    document.title = `${p.titulo} — ${p.codigo} | Realiza Consultoria Imobiliária`;
    const loc = p.finalidade === "locacao";
    const fotos = (p.fotos || []).filter(Boolean);
    const nGal = fotos.length >= 5 ? 5 : fotos.length >= 3 ? 3 : 1;
    const gal = fotos.slice(0, nGal).map((f, i) => `<button type="button" data-i="${i}" aria-label="Ampliar foto ${i + 1}"><img src="${e(f)}" alt="${e(p.titulo)} — foto ${i + 1}" ${i ? 'loading="lazy"' : ""} onerror="this.remove()">${i === 4 && fotos.length > 5 ? `<span class="mais">+${fotos.length - 5} fotos</span>` : ""}</button>`).join("");
    const galCols = fotos.length >= 5 ? "" : fotos.length >= 3 ? "grid-template-columns:2fr 1fr" : "grid-template-columns:1fr;grid-template-rows:440px";

    const spec = (icone, v, rot) => v ? `<div class="spec"><i data-lucide="${icone}"></i><b>${v}</b><span>${rot}</span></div>` : "";
    const yt = ytId(p.video_url);
    const cond = [
      p.aceita_financiamento ? '<span class="tag tag-escura">Aceita financiamento</span>' : "",
      p.aceita_fgts ? '<span class="tag tag-escura">Aceita FGTS</span>' : "",
      p.mcmv ? '<span class="tag tag-verde">Minha Casa Minha Vida</span>' : ""
    ].join("");

    const sim = !loc && p.aceita_financiamento ? RZ.simular({ valor: p.preco, entrada: p.preco * RZ.cfg.financiamento.entradaMinPct / 100, anos: 30, taxaAnual: RZ.cfg.financiamento.taxaAnualPadrao, sistema: "sac" }) : null;
    const avatar = corretor ? (corretor.foto_url ? `<img src="${e(corretor.foto_url)}" alt="">` : RZ.iniciais(corretor.nome)) : "R";
    const waTxt = `Olá${corretor ? ", " + corretor.nome.split(" ")[0] : ""}! Tenho interesse no imóvel ${p.codigo} — ${p.titulo} (${location.href}).`;

    $("#conteudo").innerHTML = `
      <nav class="migalha" aria-label="Você está em"><a href="./">Início</a><i data-lucide="chevron-right"></i><a href="./#imoveis">Imóveis</a><i data-lucide="chevron-right"></i><span>${e(p.codigo)}</span></nav>
      <div class="imovel-titulo">
        <div>
          <div class="card-tags" style="position:static">
            <span class="tag tag-laranja">${e(p.tipo)}</span>
            <span class="tag" style="border:1px solid var(--borda)">${e(RZ.STATUS_OBRA[p.status_obra] || "")}</span>
            <span class="tag" style="border:1px solid var(--borda)">Cód. ${e(p.codigo)}</span>
          </div>
          <h1>${e(p.titulo)}</h1>
          <span class="card-local" style="margin-top:6px"><i data-lucide="map-pin"></i>${e(p.bairro)} · ${e(p.cidade)}</span>
        </div>
        <div>
          <div class="preco">${RZ.moeda(p.preco)}${loc ? "<small>/mês</small>" : ""}</div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px" class="nao-imprimir">
            <button class="btn btn-contorno btn-sm" id="btn-compartilhar"><i data-lucide="share-2"></i> Compartilhar</button>
            <button class="btn btn-contorno btn-sm" onclick="window.print()"><i data-lucide="printer"></i> Imprimir ficha</button>
          </div>
        </div>
      </div>

      ${fotos.length ? `<div class="galeria" style="${galCols}">${gal}</div>` : ""}

      <div class="imovel-grid">
        <div>
          <section class="bloco">
            <h2><i data-lucide="clipboard-list"></i> Ficha técnica</h2>
            <div class="specs-destaque">
              ${spec("ruler", p.area_privativa && p.area_privativa + " m²", "Área privativa")}
              ${spec("bed-double", p.quartos, p.quartos > 1 ? "Quartos" : "Quarto")}
              ${spec("bath", p.suites, p.suites > 1 ? "Suítes" : "Suíte")}
              ${spec("shower-head", p.banheiros, "Banheiros")}
              ${spec("car", p.vagas, p.vagas > 1 ? "Vagas" : "Vaga")}
            </div>
            <table class="tabela-tecnica">
              ${linha("Tipo de imóvel", e(p.tipo))}
              ${linha("Finalidade", loc ? "Locação" : "Venda")}
              ${linha("Situação", e(RZ.STATUS_OBRA[p.status_obra] || ""))}
              ${linha("Área privativa", p.area_privativa && p.area_privativa + " m²")}
              ${linha("Área total", p.area_total && p.area_total + " m²")}
              ${linha("Valor por m² (privativo)", !loc && p.area_privativa ? RZ.moeda(p.preco / p.area_privativa) : "")}
              ${linha("Dormitórios", p.quartos)}
              ${linha("Suítes", p.suites)}
              ${linha("Banheiros", p.banheiros)}
              ${linha("Vagas de garagem", p.vagas)}
              ${linha("Andar", p.andar && p.andar + "º")}
              ${linha(p.status_obra === "pronto" ? "Ano de construção" : "Previsão de entrega", p.ano)}
              ${linha("Condomínio (mensal)", p.condominio ? RZ.moeda2(p.condominio) : "")}
              ${linha("IPTU (anual)", p.iptu ? RZ.moeda2(p.iptu) : "")}
            </table>
          </section>

          <section class="bloco">
            <h2><i data-lucide="file-text"></i> Sobre o imóvel</h2>
            <p style="color:var(--texto-suave);white-space:pre-line">${e(p.descricao)}</p>
          </section>

          ${(p.diferenciais || []).length ? `<section class="bloco"><h2><i data-lucide="sparkles"></i> Diferenciais</h2>
            <ul class="lista-dif">${p.diferenciais.map((d) => `<li><i data-lucide="check-circle-2"></i>${e(d)}</li>`).join("")}</ul></section>` : ""}

          ${(yt || p.tour_url || p.ficha_pdf_url) ? `<section class="bloco nao-imprimir"><h2><i data-lucide="play-circle"></i> Material complementar</h2>
            ${yt ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="Vídeo do imóvel" allowfullscreen loading="lazy"></iframe></div>` : ""}
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:${yt ? 16 : 0}px">
              ${p.tour_url ? `<a class="btn btn-escuro btn-sm" href="${e(p.tour_url)}" target="_blank" rel="noopener"><i data-lucide="rotate-3d"></i> Tour virtual 360°</a>` : ""}
              ${p.ficha_pdf_url ? `<a class="btn btn-contorno btn-sm" href="${e(p.ficha_pdf_url)}" target="_blank" rel="noopener"><i data-lucide="download"></i> Memorial / planta (PDF)</a>` : ""}
            </div></section>` : ""}

          <section class="bloco">
            <h2><i data-lucide="map"></i> Localização</h2>
            <p style="color:var(--texto-suave);margin:-8px 0 14px">${e(p.bairro)}, ${e(p.cidade)}. O endereço exato é informado pelo corretor no agendamento da visita.</p>
            <div class="mapa nao-imprimir"><iframe loading="lazy" title="Mapa da região" referrerpolicy="no-referrer-when-downgrade"
              src="https://maps.google.com/maps?q=${encodeURIComponent(p.bairro + ", " + p.cidade)}&z=14&output=embed"></iframe></div>
          </section>
        </div>

        <aside class="lateral">
          <div class="cartao-contato">
            <div class="cab">
              <div class="avatar">${avatar}</div>
              <div><small>Corretor responsável</small><b>${e(corretor ? corretor.nome : "Equipe Realiza")}</b><small>${e(corretor ? corretor.creci : RZ.cfg.empresa.creci)}</small></div>
            </div>
            <div class="custos">
              <div><span>${loc ? "Aluguel" : "Valor de venda"}</span><b>${RZ.moeda(p.preco)}</b></div>
              ${p.condominio ? `<div><span>Condomínio</span><b>${RZ.moeda2(p.condominio)}/mês</b></div>` : ""}
              ${p.iptu ? `<div><span>IPTU</span><b>${RZ.moeda2(p.iptu)}/ano</b></div>` : ""}
              ${loc ? `<div><span>Total estimado/mês</span><b>${RZ.moeda2(Number(p.preco) + Number(p.condominio || 0) + Number(p.iptu || 0) / 12)}</b></div>` : ""}
            </div>
            ${cond ? `<div class="selos-fin" style="padding-top:14px">${cond}</div>` : ""}
            ${sim ? `<div style="padding:0 22px"><div class="mini-sim" style="margin-top:0">
              <span style="font-size:.78rem;color:var(--texto-suave)">Parcela estimada a partir de*</span><br>
              <b>${RZ.moeda2(sim.ultima)}</b> <span style="font-size:.78rem;color:var(--texto-suave)">até ${RZ.moeda2(sim.primeira)}</span>
              <p style="font-size:.72rem;color:var(--texto-suave);margin-top:6px">*SAC, ${RZ.cfg.financiamento.entradaMinPct}% de entrada, 30 anos, ${RZ.cfg.financiamento.taxaAnualPadrao}% a.a. Simulação ilustrativa.</p>
              <a href="./?imovel=${encodeURIComponent(p.id)}#simulador" style="font-size:.82rem;font-weight:700;color:var(--laranja)">Simular com meus dados →</a>
            </div></div>` : ""}
            <form id="form-visita" novalidate class="nao-imprimir">
              <b style="font-family:var(--fonte-titulo)">Agende uma visita</b>
              <div class="campo"><label for="v-nome">Nome *</label><input id="v-nome" name="nome" required autocomplete="name"></div>
              <div class="campo"><label for="v-tel">WhatsApp *</label><input id="v-tel" name="telefone" required inputmode="tel" autocomplete="tel" placeholder="(47) 99999-9999"></div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div class="campo"><label for="v-data">Data</label><input id="v-data" name="data" type="date"></div>
                <div class="campo"><label for="v-periodo">Período</label><select id="v-periodo" name="periodo"><option>Manhã</option><option>Tarde</option><option>Noite</option></select></div>
              </div>
              <div class="campo"><label for="v-msg">Mensagem</label><textarea id="v-msg" name="mensagem" style="min-height:70px" placeholder="Dúvidas, forma de pagamento…"></textarea></div>
              <input class="mel" name="site" tabindex="-1" autocomplete="off" aria-hidden="true">
              <label class="check"><input type="checkbox" id="v-lgpd"> Autorizo o contato e o tratamento dos meus dados (LGPD).</label>
              <div class="form-msg" id="v-retorno" role="status"></div>
              <button class="btn btn-primario btn-bloco" type="submit"><i data-lucide="calendar-check"></i> Solicitar visita</button>
              <a class="btn btn-wa btn-bloco" href="${RZ.wa(corretor && corretor.whatsapp, waTxt)}" target="_blank" rel="noopener"><i data-lucide="message-circle"></i> Falar no WhatsApp</a>
            </form>
          </div>
        </aside>
      </div>

      ${(() => { const s = semelhantes(p, todos); return s.length ? `<section style="margin-top:56px" class="nao-imprimir">
        <div class="cabecalho-secao esq" style="margin-bottom:24px"><span class="selo">Veja também</span><h2 style="font-size:1.6rem">Imóveis semelhantes</h2></div>
        <div class="grade-imoveis">${s.map((x) => `<article class="card-imovel"><a class="card-foto" href="imovel.html?id=${encodeURIComponent(x.id)}">${x.fotos && x.fotos[0] ? `<img src="${e(x.fotos[0])}" alt="" loading="lazy" onerror="this.remove()">` : ""}<span class="card-codigo">${e(x.codigo)}</span></a>
          <div class="card-corpo"><span class="card-local"><i data-lucide="map-pin"></i>${e(x.bairro)}</span><h3><a href="imovel.html?id=${encodeURIComponent(x.id)}">${e(x.titulo)}</a></h3>
          <div class="card-rodape"><span class="preco">${RZ.moeda(x.preco)}</span><a class="btn btn-escuro btn-sm" href="imovel.html?id=${encodeURIComponent(x.id)}">Ver</a></div></div></article>`).join("")}</div></section>` : ""; })()}
    `;
    $("#wa-flut").href = RZ.wa(corretor && corretor.whatsapp, waTxt);
    ic();
    galeria(fotos);
    formVisita(p, corretor);
    $("#btn-compartilhar").addEventListener("click", async () => {
      const dados = { title: p.titulo, text: `${p.titulo} — ${RZ.moeda(p.preco)}`, url: location.href };
      try { if (navigator.share) await navigator.share(dados); else { await navigator.clipboard.writeText(location.href); $("#btn-compartilhar").textContent = "Link copiado!"; } } catch (_) { /* cancelado */ }
    });
  }

  function galeria(fotos) {
    const lb = $("#lightbox"), img = $("img", lb), cont = $(".cont", lb); let i = 0;
    const mostrar = (n) => { i = (n + fotos.length) % fotos.length; img.src = fotos[i]; cont.textContent = `${i + 1} / ${fotos.length}`; };
    document.querySelectorAll(".galeria button").forEach((b) => b.addEventListener("click", () => { mostrar(Number(b.dataset.i)); lb.classList.add("aberto"); }));
    $(".fechar", lb).onclick = () => lb.classList.remove("aberto");
    $(".ant", lb).onclick = () => mostrar(i - 1);
    $(".prox", lb).onclick = () => mostrar(i + 1);
    lb.addEventListener("click", (ev) => { if (ev.target === lb) lb.classList.remove("aberto"); });
    document.addEventListener("keydown", (ev) => {
      if (!lb.classList.contains("aberto")) return;
      if (ev.key === "Escape") lb.classList.remove("aberto");
      if (ev.key === "ArrowLeft") mostrar(i - 1);
      if (ev.key === "ArrowRight") mostrar(i + 1);
    });
  }

  function formVisita(p, corretor) {
    const f = $("#form-visita"), ret = $("#v-retorno");
    const hoje = new Date(); hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
    f.data.min = hoje.toISOString().slice(0, 10);
    f.telefone.addEventListener("input", (ev) => {
      const d = ev.target.value.replace(/\D/g, "").slice(0, 11);
      ev.target.value = d.length > 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
    });
    f.addEventListener("submit", async (ev) => {
      ev.preventDefault(); ret.className = "form-msg";
      if (f.site.value) return;
      const nome = f.nome.value.trim(), tel = f.telefone.value.replace(/\D/g, "");
      const erro = !nome ? "Informe seu nome." : tel.length < 10 ? "Informe um WhatsApp válido com DDD." : !$("#v-lgpd").checked ? "Marque a autorização de contato (LGPD)." : "";
      if (erro) { ret.textContent = erro; ret.className = "form-msg erro"; return; }
      const quando = f.data.value ? `Visita desejada: ${f.data.value.split("-").reverse().join("/")} (${f.periodo.value}).` : `Período preferido: ${f.periodo.value}.`;
      const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
      const r = await RZ.enviarLead({
        nome, telefone: f.telefone.value, email: null, interesse: p.finalidade === "locacao" ? "Alugar" : "Comprar",
        mensagem: [quando, f.mensagem.value.trim()].filter(Boolean).join(" "),
        imovel_id: RZ.online ? p.id : null, imovel_ref: `${p.codigo} — ${p.titulo}`,
        corretor_id: RZ.online && corretor ? corretor.id : null, origem: "ficha-imovel"
      });
      btn.disabled = false;
      if (r.ok) { ret.innerHTML = `<b>Pedido enviado!</b> ${e(corretor ? corretor.nome.split(" ")[0] : "Um corretor")} vai confirmar o horário com você.`; ret.className = "form-msg ok"; f.reset(); }
      else { ret.innerHTML = `Não foi possível enviar agora. Use o botão do WhatsApp abaixo.`; ret.className = "form-msg erro"; }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const id = new URLSearchParams(location.search).get("id");
    const [p, corretores, todos] = await Promise.all([id ? RZ.obterImovel(id) : null, RZ.listarCorretores(), RZ.listarImoveis()]);
    if (!p) {
      $("#conteudo").innerHTML = `<div class="vazio" style="margin:60px 0"><h2>Imóvel não encontrado</h2><p style="margin:10px 0 20px">Ele pode ter sido vendido ou retirado do ar.</p><a class="btn btn-primario" href="./#imoveis">Ver imóveis disponíveis</a></div>`;
      return;
    }
    render(p, corretores.find((c) => c.id === p.corretor_id), todos);
  });
})();
