// =============================================================================
// LIVEPET - Seed do usuário de teste com 20 pets (Issue #100)
//
// Cria a conta "usuarioteste" com 20 pets completos, alternando cães e gatos,
// cada um com foto, vacinas e histórico médico. Pode rodar várias vezes:
// o que já existe é mantido e só o que falta é criado.
//
// Uso (Git Bash, Linux ou Mac):
//   SENHA_DEMO='SuaSenha123' node scripts/seed/usuarioteste.mjs
// =============================================================================
import { api, acharPet, acordarApi, executar, garantirTutor, listarPets, log } from "./lib.mjs";

const unsplash = (base) => `${base}?w=800&q=80&auto=format&fit=crop`;

export const TUTOR_TESTE = {
  nome: "usuarioteste",
  email: "usuarioteste@livepet.com.br",
  telefone: "(11) 98877-6655",
  perfil: {
    cidade: "São Paulo",
    estado: "SP",
    nome_canil: "Canil e Gatil LivePet",
    bio: "Criador responsável de cães e gatos de raça. Todos os animais com vacinas em dia e acompanhamento veterinário.",
    foto_url: unsplash("https://images.unsplash.com/photo-1629925057384-4e031bc8d049"),
  },
};

// Pets alternando cão e gato. Datas no formato AAAA-MM-DD.
export const PETS_TESTE = [
  { nome: "Max", especie: "Cachorro", raca: "Golden Retriever", porte: "Grande", sexo: "Macho", cor: "Dourado", peso: 32.4, data_nascimento: "2021-04-12", foto: "https://images.unsplash.com/photo-1601543574606-1d8a714787f9" },
  { nome: "Luna", especie: "Gato", raca: "Persa", porte: "Pequeno", sexo: "Fêmea", cor: "Cinza e branca", peso: 4.1, data_nascimento: "2022-02-03", foto: "https://images.unsplash.com/photo-1637502238866-4413c268bdb3" },
  { nome: "Bob", especie: "Cachorro", raca: "Bulldog Francês", porte: "Pequeno", sexo: "Macho", cor: "Preto e branco", peso: 11.8, data_nascimento: "2022-08-19", foto: "https://images.unsplash.com/photo-1599314810840-7bd8edb553fa" },
  { nome: "Nina", especie: "Gato", raca: "Siamês", porte: "Pequeno", sexo: "Fêmea", cor: "Seal point", peso: 3.6, data_nascimento: "2023-01-27", foto: "https://images.unsplash.com/photo-1572590407445-ac6252f1a5b1" },
  { nome: "Fred", especie: "Cachorro", raca: "Border Collie", porte: "Médio", sexo: "Macho", cor: "Preto e branco", peso: 19.5, data_nascimento: "2020-11-08", foto: "https://images.unsplash.com/photo-1694083374546-c2b66bb83210" },
  { nome: "Theo", especie: "Gato", raca: "Maine Coon", porte: "Médio", sexo: "Macho", cor: "Creme e branco", peso: 7.9, data_nascimento: "2021-06-30", foto: "https://images.unsplash.com/photo-1787129351543-5e9b42e7df6e" },
  { nome: "Bella", especie: "Cachorro", raca: "Shih Tzu", porte: "Pequeno", sexo: "Fêmea", cor: "Branca", peso: 5.7, data_nascimento: "2023-03-14", foto: "https://images.unsplash.com/photo-1534361960057-19889db9621e" },
  { nome: "Lola", especie: "Gato", raca: "Ragdoll", porte: "Médio", sexo: "Fêmea", cor: "Branca e marrom", peso: 5.2, data_nascimento: "2022-10-05", foto: "https://images.unsplash.com/photo-1585373683920-671438c82bfa" },
  { nome: "Luke", especie: "Cachorro", raca: "Pastor Alemão", porte: "Grande", sexo: "Macho", cor: "Preto e castanho", peso: 36.2, data_nascimento: "2020-05-21", foto: "https://images.unsplash.com/photo-1614595402938-ecee8416e6b5" },
  { nome: "Amora", especie: "Gato", raca: "British Shorthair", porte: "Médio", sexo: "Fêmea", cor: "Cinza-azulado", peso: 4.8, data_nascimento: "2021-12-11", foto: "https://images.unsplash.com/photo-1739398612684-e5c3ac2fe54f" },
  { nome: "Billy", especie: "Cachorro", raca: "Beagle", porte: "Médio", sexo: "Macho", cor: "Tricolor", peso: 12.3, data_nascimento: "2024-02-09", foto: "https://images.unsplash.com/photo-1511870381062-cb2443fb0fd9" },
  { nome: "Maia", especie: "Gato", raca: "Bengal", porte: "Médio", sexo: "Fêmea", cor: "Rosetas marrons", peso: 4.4, data_nascimento: "2023-07-02", foto: "https://images.unsplash.com/photo-1751001732076-3935f74bcacf" },
  { nome: "Marley", especie: "Cachorro", raca: "Labrador", porte: "Grande", sexo: "Macho", cor: "Amarelo", peso: 29.6, data_nascimento: "2024-09-18", foto: "https://images.unsplash.com/photo-1544800086-912aa3f623ee" },
  { nome: "Pipoca", especie: "Gato", raca: "SRD", porte: "Pequeno", sexo: "Fêmea", cor: "Tigrada", peso: 3.9, data_nascimento: "2024-04-25", foto: "https://images.unsplash.com/photo-1763711615871-fe82829165c3" },
  { nome: "Cacau", especie: "Cachorro", raca: "Poodle", porte: "Pequeno", sexo: "Fêmea", cor: "Marrom", peso: 6.1, data_nascimento: "2022-06-16", foto: "https://images.unsplash.com/photo-1705587936579-3ac083d5435f" },
  { nome: "Chico", especie: "Gato", raca: "Angorá", porte: "Pequeno", sexo: "Macho", cor: "Branco", peso: 4.6, data_nascimento: "2023-09-09", foto: "https://images.unsplash.com/photo-1622298178294-b33f03091114" },
  { nome: "Mel", especie: "Cachorro", raca: "Spitz Alemão", porte: "Pequeno", sexo: "Fêmea", cor: "Marrom", peso: 3.1, data_nascimento: "2023-11-30", foto: "https://images.unsplash.com/photo-1651993782905-2689ebe8790b" },
  { nome: "Zeus", especie: "Gato", raca: "Sphynx", porte: "Pequeno", sexo: "Macho", cor: "Rosado", peso: 4.0, data_nascimento: "2022-04-07", foto: "https://images.unsplash.com/photo-1547565322-847851d7ef2f" },
  { nome: "Thor", especie: "Cachorro", raca: "Dachshund", porte: "Pequeno", sexo: "Macho", cor: "Preto e castanho", peso: 8.2, data_nascimento: "2021-08-23", foto: "https://images.unsplash.com/photo-1556796879-160fd67614ae" },
  { nome: "Nala", especie: "Gato", raca: "SRD", porte: "Pequeno", sexo: "Fêmea", cor: "Branca e marrom", peso: 4.3, data_nascimento: "2024-01-15", foto: "https://images.unsplash.com/photo-1536589961747-e239b2abbec2" },
];

const VACINAS = {
  Cachorro: [
    { nome: "V10 (Polivalente)", meses: 0 },
    { nome: "Antirrábica", meses: 1 },
    { nome: "Gripe canina", meses: 2 },
  ],
  Gato: [
    { nome: "V5 (Quíntupla felina)", meses: 0 },
    { nome: "Antirrábica", meses: 1 },
  ],
};

const VETERINARIOS = ["Dra. Camila Rocha - CRMV-SP 41820", "Dr. Rafael Lima - CRMV-SP 38215"];

const somarMeses = (iso, meses) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + meses);
  return d.toISOString().slice(0, 10);
};

async function completarSaude(token, pet, dados, indice) {
  const vet = VETERINARIOS[indice % VETERINARIOS.length];

  if (!pet.vaccines?.length) {
    const inicio = somarMeses("2026-01-10", indice % 6);
    for (const v of VACINAS[dados.especie]) {
      const aplicacao = somarMeses(inicio, v.meses);
      await api("POST", `/api/v1/pets/${pet.id}/vaccines`, {
        token,
        body: {
          nome: v.nome,
          data_aplicacao: aplicacao,
          proxima_dose: somarMeses(aplicacao, 12),
          lote: `LT${2026}${String(indice + 1).padStart(2, "0")}${v.meses}`,
          veterinario: vet,
        },
      });
    }
    log.ok(`${dados.nome}: ${VACINAS[dados.especie].length} vacinas registradas`);
  }

  if (!pet.medical_records?.length) {
    await api("POST", `/api/v1/pets/${pet.id}/medical-records`, {
      token,
      body: {
        tipo: "Consulta de rotina",
        descricao: `Check-up anual. Animal ativo, mucosas normocoradas, sem alterações. Atendido por ${vet}.`,
        peso_registrado: dados.peso,
      },
    });
    log.ok(`${dados.nome}: consulta registrada no histórico`);
  }
}

executar(async () => {
  await acordarApi();

  log.titulo(`Tutor: ${TUTOR_TESTE.nome} <${TUTOR_TESTE.email}>`);
  const { token } = await garantirTutor(TUTOR_TESTE);

  let pets = await listarPets(token);

  for (const [i, dados] of PETS_TESTE.entries()) {
    const { foto, ...campos } = dados;
    let pet = acharPet(pets, dados.nome);
    try {
      if (pet) {
        log.info(`${dados.nome} já existia`);
      } else {
        pet = await api("POST", "/api/v1/pets", {
          token,
          body: { ...campos, foto_url: unsplash(foto) },
        });
        pets.push(pet);
        log.ok(`${dados.nome} (${dados.especie}, ${dados.raca}) cadastrado`);
      }
      await completarSaude(token, pet, dados, i);
    } catch (e) {
      log.erro(`${dados.nome}: ${e.message}`);
    }
  }

  pets = await listarPets(token);
  console.log(`\n${TUTOR_TESTE.nome} agora tem ${pets.length} pets.`);
});
