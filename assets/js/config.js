/* ==========================================================
   REALIZA CONSULTORIA IMOBILIÁRIA — CONFIGURAÇÃO CENTRAL
   Edite APENAS este arquivo para personalizar dados da empresa
   e conectar ao Supabase. Nada mais precisa ser alterado.
   ========================================================== */
window.REALIZA_CONFIG = {
  empresa: {
    nome: "Realiza Consultoria Imobiliária",
    creci: "",                             // ← CRECI jurídico (deixe vazio se não houver)
    telefone: "(47) 99273-4973",           // ← telefone exibido
    whatsapp: "5547992734973",             // ← só números, com 55 + DDD
    email: "realizaci.adm@gmail.com",
    endereco: "Rua João Manoel V. Filho — João Costa",
    cidade: "Joinville - SC",
    horario: "Seg a Sex 8h–18h · Sáb 9h–13h",
    instagram: "https://www.instagram.com/realizaconsultoriaimobiliaria/",
    facebook: "https://www.facebook.com/janderson.santosdesousa",
    tiktok: "https://www.tiktok.com/@realizaimobiliaria.ofc",
    youtube: ""
  },

  /* Supabase (mesmo processo do projeto Oração e Palavra).
     Project Settings → API → copie "Project URL" e "anon public key".
     Enquanto estiver vazio, o site roda em MODO DEMONSTRAÇÃO
     com imóveis e corretores de exemplo. */
  supabaseUrl: "https://kbjeskaudbvjdcmokrut.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamVza2F1ZGJ2amRjbW9rcnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MDQ5MzYsImV4cCI6MjEwNjQ4MDkzNn0.2ss-lIIdHy5p4KPddjexZJuJkI3lGfA2KAHevYOZohg",

  financiamento: {
    taxaAnualPadrao: 11.5,   // taxa de referência do simulador (% a.a.) — ajuste conforme o banco
    prazoMaxAnos: 35,
    entradaMinPct: 20
  }
};
