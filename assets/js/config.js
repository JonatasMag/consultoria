/* ==========================================================
   REALIZA CONSULTORIA IMOBILIÁRIA — CONFIGURAÇÃO CENTRAL
   Edite APENAS este arquivo para personalizar dados da empresa
   e conectar ao Supabase. Nada mais precisa ser alterado.
   ========================================================== */
window.REALIZA_CONFIG = {
  empresa: {
    nome: "Realiza Consultoria Imobiliária",
    creci: "CRECI-J 0000",                 // ← número do CRECI jurídico
    telefone: "(47) 99999-9999",           // ← telefone exibido
    whatsapp: "5547999999999",             // ← só números, com 55 + DDD
    email: "contato@realizaimoveis.com.br",
    endereco: "Rua Exemplo, 123 — Centro",
    cidade: "Joinville - SC",
    horario: "Seg a Sex 8h–18h · Sáb 9h–13h",
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    youtube: ""
  },

  /* Supabase (mesmo processo do projeto Oração e Palavra).
     Project Settings → API → copie "Project URL" e "anon public key".
     Enquanto estiver vazio, o site roda em MODO DEMONSTRAÇÃO
     com imóveis e corretores de exemplo. */
  supabaseUrl: "",
  supabaseAnonKey: "",

  financiamento: {
    taxaAnualPadrao: 11.5,   // taxa de referência do simulador (% a.a.) — ajuste conforme o banco
    prazoMaxAnos: 35,
    entradaMinPct: 20
  }
};
