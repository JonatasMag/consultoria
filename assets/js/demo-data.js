/* ==========================================================
   DADOS DE DEMONSTRAÇÃO
   Usados somente enquanto o Supabase não estiver configurado.
   Imóveis, corretores e leads abaixo são FICTÍCIOS (exemplos).
   Fotos ilustrativas: Unsplash (licença livre).
   ========================================================== */
const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

window.DEMO_CORRETORES = [
  { id: "c1", nome: "Ana Paula Ribeiro", creci: "CRECI 00001-F", whatsapp: "5547999999999",
    especialidades: ["Lançamentos", "Financiamento"], bio: "Especialista em primeiro imóvel e crédito habitacional. Acompanha o cliente da simulação até a entrega das chaves.", foto_url: "", ativo: true },
  { id: "c2", nome: "Carlos Eduardo Lima", creci: "CRECI 00002-F", whatsapp: "5547999999999",
    especialidades: ["Alto padrão", "Investimento"], bio: "Foco em imóveis de alto padrão e análise de rentabilidade para investidores.", foto_url: "", ativo: true },
  { id: "c3", nome: "Fernanda Souza", creci: "CRECI 00003-F", whatsapp: "5547999999999",
    especialidades: ["Casas", "Minha Casa Minha Vida"], bio: "Atende famílias que buscam casa própria com subsídio e uso do FGTS.", foto_url: "", ativo: true },
  { id: "c4", nome: "Ricardo Alves", creci: "CRECI 00004-F", whatsapp: "5547999999999",
    especialidades: ["Comercial", "Terrenos"], bio: "Salas, galpões e terrenos para empresas e incorporadores.", foto_url: "", ativo: true }
];

window.DEMO_IMOVEIS = [
  { id: "d1", codigo: "RZ-101", titulo: "Apartamento 3 quartos com sacada gourmet", tipo: "Apartamento", finalidade: "venda", status_obra: "pronto",
    preco: 689000, condominio: 650, iptu: 1800, cidade: "Joinville", bairro: "América", endereco: "Rua Exemplo, América, Joinville - SC",
    area_privativa: 98, area_total: 132, quartos: 3, suites: 1, banheiros: 2, vagas: 2, andar: 8, ano: 2021,
    descricao: "Apartamento amplo, ensolarado, com sacada gourmet integrada à sala, cozinha planejada e acabamento em porcelanato. Condomínio com piscina, academia e salão de festas.",
    diferenciais: ["Sacada gourmet com churrasqueira", "Cozinha planejada", "Piscina e academia", "Portaria 24h", "Elevador", "Aceita pet"],
    fotos: [U("photo-1502672260266-1c1ef2d93688"), U("photo-1560448204-e02f11c3d0e2"), U("photo-1484154218962-a197022b5858"), U("photo-1493809842364-78817add7ffb")],
    aceita_financiamento: true, aceita_fgts: true, mcmv: false, destaque: true, publicado: true, corretor_id: "c1", video_url: "", tour_url: "", ficha_pdf_url: "" },
  { id: "d2", codigo: "RZ-102", titulo: "Casa moderna com piscina e espaço gourmet", tipo: "Casa", finalidade: "venda", status_obra: "pronto",
    preco: 1450000, condominio: 0, iptu: 3900, cidade: "Joinville", bairro: "Glória", endereco: "Bairro Glória, Joinville - SC",
    area_privativa: 245, area_total: 420, quartos: 4, suites: 2, banheiros: 4, vagas: 3, andar: null, ano: 2019,
    descricao: "Casa de arquitetura contemporânea com pé-direito duplo, integração total com área gourmet e piscina aquecida. Automação de iluminação e energia solar.",
    diferenciais: ["Piscina aquecida", "Energia solar", "Pé-direito duplo", "Automação", "Jardim", "Closet na suíte master"],
    fotos: [U("photo-1600596542815-ffad4c1539a9"), U("photo-1600607687939-ce8a6c25118c"), U("photo-1600566753190-17f0baa2a6c3"), U("photo-1600585154340-be6161a56a0c")],
    aceita_financiamento: true, aceita_fgts: false, mcmv: false, destaque: true, publicado: true, corretor_id: "c2", video_url: "", tour_url: "", ficha_pdf_url: "" },
  { id: "d3", codigo: "RZ-103", titulo: "Lançamento — 2 quartos com suíte, entrada facilitada", tipo: "Apartamento", finalidade: "venda", status_obra: "lancamento",
    preco: 349900, condominio: 380, iptu: 0, cidade: "Joinville", bairro: "Costa e Silva", endereco: "Bairro Costa e Silva, Joinville - SC",
    area_privativa: 58, area_total: 74, quartos: 2, suites: 1, banheiros: 2, vagas: 1, andar: null, ano: 2028,
    descricao: "Empreendimento em lançamento com plantas inteligentes, lazer completo e condições especiais de entrada parcelada durante a obra.",
    diferenciais: ["Entrada parcelada na obra", "Lazer completo", "Coworking", "Bicicletário", "Pet place", "Medição individual"],
    fotos: [U("photo-1545324418-cc1a3fa10c00"), U("photo-1560448204-e02f11c3d0e2"), U("photo-1502672260266-1c1ef2d93688")],
    aceita_financiamento: true, aceita_fgts: true, mcmv: true, destaque: true, publicado: true, corretor_id: "c1", video_url: "", tour_url: "", ficha_pdf_url: "" },
  { id: "d4", codigo: "RZ-104", titulo: "Sobrado 3 quartos em rua tranquila", tipo: "Sobrado", finalidade: "venda", status_obra: "pronto",
    preco: 529000, condominio: 0, iptu: 1400, cidade: "Joinville", bairro: "Bom Retiro", endereco: "Bairro Bom Retiro, Joinville - SC",
    area_privativa: 130, area_total: 200, quartos: 3, suites: 1, banheiros: 3, vagas: 2, andar: null, ano: 2017,
    descricao: "Sobrado bem conservado, com quintal, churrasqueira e garagem coberta para dois carros. Próximo a escolas e comércio.",
    diferenciais: ["Quintal", "Churrasqueira", "Garagem coberta", "Próximo a escolas"],
    fotos: [U("photo-1580587771525-78b9dba3b914"), U("photo-1484154218962-a197022b5858"), U("photo-1493809842364-78817add7ffb")],
    aceita_financiamento: true, aceita_fgts: true, mcmv: false, destaque: false, publicado: true, corretor_id: "c3", video_url: "", tour_url: "", ficha_pdf_url: "" },
  { id: "d5", codigo: "RZ-105", titulo: "Cobertura duplex com vista panorâmica", tipo: "Cobertura", finalidade: "venda", status_obra: "pronto",
    preco: 1980000, condominio: 1450, iptu: 5200, cidade: "Joinville", bairro: "Atiradores", endereco: "Bairro Atiradores, Joinville - SC",
    area_privativa: 280, area_total: 360, quartos: 4, suites: 3, banheiros: 5, vagas: 3, andar: 15, ano: 2022,
    descricao: "Cobertura duplex com terraço, piscina privativa e vista para a serra. Acabamento de alto padrão e três vagas de garagem.",
    diferenciais: ["Piscina privativa", "Terraço", "Vista panorâmica", "3 suítes", "Lareira", "Depósito"],
    fotos: [U("photo-1613490493576-7fde63acd811"), U("photo-1600607687939-ce8a6c25118c"), U("photo-1600566753190-17f0baa2a6c3")],
    aceita_financiamento: true, aceita_fgts: false, mcmv: false, destaque: false, publicado: true, corretor_id: "c2", video_url: "", tour_url: "", ficha_pdf_url: "" },
  { id: "d6", codigo: "RZ-106", titulo: "Apartamento 2 quartos mobiliado para locação", tipo: "Apartamento", finalidade: "locacao", status_obra: "pronto",
    preco: 2600, condominio: 420, iptu: 90, cidade: "Joinville", bairro: "Saguaçu", endereco: "Bairro Saguaçu, Joinville - SC",
    area_privativa: 64, area_total: 80, quartos: 2, suites: 0, banheiros: 1, vagas: 1, andar: 4, ano: 2015,
    descricao: "Apartamento mobiliado, pronto para morar, com armários planejados e eletrodomésticos. Ótima localização.",
    diferenciais: ["Mobiliado", "Armários planejados", "Elevador", "Salão de festas"],
    fotos: [U("photo-1493809842364-78817add7ffb"), U("photo-1484154218962-a197022b5858")],
    aceita_financiamento: false, aceita_fgts: false, mcmv: false, destaque: false, publicado: true, corretor_id: "c4", video_url: "", tour_url: "", ficha_pdf_url: "" },
  { id: "d7", codigo: "RZ-107", titulo: "Casa térrea 2 quartos — Minha Casa Minha Vida", tipo: "Casa", finalidade: "venda", status_obra: "em_construcao",
    preco: 259000, condominio: 0, iptu: 400, cidade: "Joinville", bairro: "Paranaguamirim", endereco: "Bairro Paranaguamirim, Joinville - SC",
    area_privativa: 52, area_total: 150, quartos: 2, suites: 0, banheiros: 1, vagas: 1, andar: null, ano: 2027,
    descricao: "Casa nova em construção, enquadrada no programa habitacional, com possibilidade de subsídio e uso de FGTS na entrada.",
    diferenciais: ["Enquadra no MCMV", "Uso de FGTS", "Terreno amplo", "Entrega prevista 2027"],
    fotos: [U("photo-1512917774080-9991f1c4c750"), U("photo-1580587771525-78b9dba3b914")],
    aceita_financiamento: true, aceita_fgts: true, mcmv: true, destaque: false, publicado: true, corretor_id: "c3", video_url: "", tour_url: "", ficha_pdf_url: "" },
  { id: "d8", codigo: "RZ-108", titulo: "Sala comercial 45 m² no centro", tipo: "Comercial", finalidade: "venda", status_obra: "pronto",
    preco: 310000, condominio: 520, iptu: 1100, cidade: "Joinville", bairro: "Centro", endereco: "Centro, Joinville - SC",
    area_privativa: 45, area_total: 52, quartos: 0, suites: 0, banheiros: 1, vagas: 1, andar: 6, ano: 2014,
    descricao: "Sala comercial com recepção, divisória e banheiro privativo, em edifício com portaria e estacionamento rotativo.",
    diferenciais: ["Portaria", "Ar-condicionado", "Vaga de garagem", "Ótima para consultório"],
    fotos: [U("photo-1497366216548-37526070297c"), U("photo-1497366811353-6870744d04b2")],
    aceita_financiamento: true, aceita_fgts: false, mcmv: false, destaque: false, publicado: true, corretor_id: "c4", video_url: "", tour_url: "", ficha_pdf_url: "" }
];
