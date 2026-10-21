// =============================================================================
// LIVEPET - Seed de pedigree, linhagem e certificados (Issue #101)
//
// Depende do seed do usuário de teste (usuarioteste.mjs) e das contas de
// demonstração (scripts/seed-demo.sh). Pode rodar várias vezes.
//
// Uso (Git Bash, Linux ou Mac):
//   SENHA_DEMO='SuaSenha123' node scripts/seed/pedigree.mjs
// =============================================================================
import { api, acharPet, acordarApi, executar, garantirTutor, listarPets, log } from "./lib.mjs";

const unsplash = (base) => `${base}?w=800&q=80&auto=format&fit=crop`;

const CONTAS = {
  teste: { nome: "usuarioteste", email: "usuarioteste@livepet.com.br", telefone: "(11) 98877-6655" },
  yasmim: { nome: "Yasmim Viana", email: "yasmim.viana@livepet.com.br", telefone: "(62) 99100-0001" },
  joao: { nome: "João Victor", email: "joao.victor@livepet.com.br", telefone: "(62) 99100-0003" },
};

// Linhagem completa: pai, mãe e os 4 avós.
// Cães usam registro CBKC; gatos usam FFB (Federação Felina Brasileira).
const linhagem = (org, registro, [pai, mae], [apm, apf, amm, amf], status, titulosPai = null, titulosMae = null) => ({
  registro: `${org} ${registro}`,
  generacoes: 3,
  status_verificacao: status,
  pai_nome: pai[0], pai_registro: `${org}-${pai[1]}`, pai_titulos: titulosPai,
  mae_nome: mae[0], mae_registro: `${org}-${mae[1]}`, mae_titulos: titulosMae,
  avo_pat_m_nome: apm[0], avo_pat_m_registro: `${org}-${apm[1]}`,
  avo_pat_f_nome: apf[0], avo_pat_f_registro: `${org}-${apf[1]}`,
  avo_mat_m_nome: amm[0], avo_mat_m_registro: `${org}-${amm[1]}`,
  avo_mat_f_nome: amf[0], avo_mat_f_registro: `${org}-${amf[1]}`,
});

// Pedigrees declarados e aprovados do usuarioteste.
const PEDIGREES = {
  Max: linhagem("CBKC", "4521987",
    [["Sunny Gold Apollo", "GR451120"], ["Golden Valley Aurora", "GR451388"]],
    [["Sunny Gold Hércules", "GR398201"], ["Amber Field Daisy", "GR398544"], ["Golden Valley Bento", "GR401230"], ["Honey Creek Sofia", "GR401877"]],
    "aprovado", "Campeão Brasileiro", null),
  Fred: linhagem("CBKC", "4498210",
    [["Highland Shadow Rex", "BC440812"], ["Bluemoor Lady Kate", "BC441095"]],
    [["Highland Storm", "BC390456"], ["Misty Glen Ruby", "BC390712"], ["Bluemoor Archie", "BC393108"], ["Fernhill Penny", "BC393621"]],
    "aprovado", "Campeão de Agility", null),
  Luke: linhagem("CBKC", "4476533",
    [["Von Kaiser Brutus", "PA432210"], ["Haus Adler Greta", "PA432687"]],
    [["Von Kaiser Odin", "PA380154"], ["Schwarzwald Hanna", "PA380499"], ["Haus Adler Rolf", "PA383017"], ["Berghof Ilse", "PA383540"]],
    "aprovado", "Campeão Pan-Americano", "Grande Campeã"),
  Mel: linhagem("CBKC", "4567012",
    [["Fox Royal Pumpkin", "SP460231"], ["Little Star Amber", "SP460588"]],
    [["Fox Royal Teddy", "SP410392"], ["Orange Cloud Bibi", "SP410741"], ["Little Star Biscuit", "SP413005"], ["Sun Petals Lili", "SP413369"]],
    "aprovado"),
  Luna: linhagem("FFB", "PER-22071",
    [["Snow Palace Aramis", "PER19880"], ["Cotton Dreams Belle", "PER19932"]],
    [["Snow Palace Lorde", "PER17201"], ["Ivory Rose Cleo", "PER17288"], ["Cotton Dreams Duque", "PER17510"], ["Pearl Garden Mimi", "PER17633"]],
    "aprovado", "Grande Campeão FFB", null),
  Theo: linhagem("FFB", "MCO-21455",
    [["Northwoods Ragnar", "MCO19104"], ["Timber Coon Freya", "MCO19177"]],
    [["Northwoods Bjorn", "MCO16620"], ["Pine Lake Astrid", "MCO16702"], ["Timber Coon Leif", "MCO16955"], ["Frost Hill Sigrid", "MCO17031"]],
    "aprovado"),
  Amora: linhagem("FFB", "BSH-21980",
    [["Blue Oxford Winston", "BSH19611"], ["Velvet Crown Matilda", "BSH19690"]],
    [["Blue Oxford Edward", "BSH17044"], ["Silver Moor Daisy", "BSH17129"], ["Velvet Crown Arthur", "BSH17380"], ["Kensington Rose", "BSH17452"]],
    "aprovado"),
  Bella: linhagem("CBKC", "4590345",
    [["Imperial Lotus Ming", "ST462109"], ["Jade Garden Mei", "ST462455"]],
    [["Imperial Lotus Chen", "ST414870"], ["Silk Road Lin", "ST415203"], ["Jade Garden Bao", "ST415644"], ["Pearl Palace Yun", "ST415990"]],
    "declaratorio"),
};

// Thor (Yasmim) é o pai real do Marley; Bob (João Victor) é o pai do Billy.
const LINHAGEM_THOR = {
  registro: "CBKC 4402176", generacoes: 3, status_verificacao: "aprovado",
  pai_nome: "Golden Lake Duke", pai_registro: "CBKC-LB380911",
  mae_nome: "Sandy Shore Maggie", mae_registro: "CBKC-LB381254",
};
const MARLEY_MATERNO = {
  registro: "CBKC 4612880", generacoes: 3, status_verificacao: "declaratorio",
  mae_nome: "Cocoa Bay Nala", mae_registro: "CBKC-LB458803",
  avo_mat_m_nome: "Cocoa Bay Bruno", avo_mat_m_registro: "CBKC-LB411560",
  avo_mat_f_nome: "Riverside Hazel", avo_mat_f_registro: "CBKC-LB411932",
};
const PET_BOB = {
  nome: "Bob", especie: "Cachorro", raca: "Beagle", porte: "Médio", sexo: "Macho",
  cor: "Tricolor", peso: 13.1, data_nascimento: "2020-09-14",
  foto_url: unsplash("https://images.unsplash.com/photo-1629478705155-391ead8cf514"),
};
const LINHAGEM_BOB = {
  registro: "CBKC 4389902", generacoes: 3, status_verificacao: "aprovado",
  pai_nome: "Hound Hill Rocky", pai_registro: "CBKC-BG362104",
  mae_nome: "Meadow Run Lucy", mae_registro: "CBKC-BG362587",
};
const BILLY_MATERNO = {
  registro: "CBKC 4655120", generacoes: 3, status_verificacao: "pendente",
  mae_nome: "Clover Field Ginger", mae_registro: "CBKC-BG448210",
  avo_mat_m_nome: "Clover Field Scout", avo_mat_m_registro: "CBKC-BG401177",
  avo_mat_f_nome: "Maple Trail Rosie", avo_mat_f_registro: "CBKC-BG401530",
};

const obterLinhagem = (petId) => api("GET", `/api/v1/lineages/pets/${petId}`);
const salvarLinhagem = (token, petId, dados) =>
  api("PUT", `/api/v1/lineages/pets/${petId}`, { token, body: dados });

function exigirPet(pets, nome, dono) {
  const pet = acharPet(pets, nome);
  if (!pet) throw new Error(`pet ${nome} de ${dono} não encontrado. Rode antes o seed que cria esse pet.`);
  return pet;
}

/** Cria (se ainda não existir) a solicitação de vínculo filhote -> ascendente. */
async function garantirSolicitacao(tokenFilhote, filhote, ascendente, tipo, mensagem) {
  const enviadas = await api("GET", "/api/v1/lineages/requests/sent", { token: tokenFilhote });
  const existente = enviadas.find(
    (r) => r.filhote_pet_id === filhote.id && r.ascendente_pet_id === ascendente.id && r.status !== "recusado",
  );
  if (existente) return existente;
  return api("POST", "/api/v1/lineages/requests", {
    token: tokenFilhote,
    body: { filhote_pet_id: filhote.id, ascendente_token: ascendente.token_publico, tipo_vinculo: tipo, mensagem },
  });
}

executar(async () => {
  await acordarApi();

  const teste = await garantirTutor(CONTAS.teste);
  const yasmim = await garantirTutor(CONTAS.yasmim);
  const joao = await garantirTutor(CONTAS.joao);
  const petsTeste = await listarPets(teste.token);

  // 1. Pedigrees declarados (aprovados e declaratório)
  log.titulo("Pedigrees do usuarioteste");
  for (const [nome, dados] of Object.entries(PEDIGREES)) {
    try {
      const pet = exigirPet(petsTeste, nome, "usuarioteste");
      const atual = await obterLinhagem(pet.id);
      if (atual?.status_verificacao === dados.status_verificacao && atual?.pai_nome) {
        log.info(`${nome}: pedigree já registrado (${atual.status_verificacao})`);
        continue;
      }
      await salvarLinhagem(teste.token, pet.id, dados);
      log.ok(`${nome}: pedigree ${dados.status_verificacao} com 3 gerações`);
    } catch (e) {
      log.erro(`${nome}: ${e.message}`);
    }
  }

  // 2. Marley, filho do Thor da Yasmim (vínculo real aprovado entre tutores)
  log.titulo("Marley (usuarioteste), filho do Thor (Yasmim Viana)");
  try {
    const thor = exigirPet(await listarPets(yasmim.token), "Thor", "Yasmim Viana");
    const marley = exigirPet(petsTeste, "Marley", "usuarioteste");

    if (!(await obterLinhagem(thor.id))?.pai_nome) {
      await salvarLinhagem(yasmim.token, thor.id, LINHAGEM_THOR);
      log.ok("Thor: pedigree registrado (pais Golden Lake Duke e Sandy Shore Maggie)");
    }

    const atual = await obterLinhagem(marley.id);
    if (atual?.pai_pet_id === thor.id && atual?.status_verificacao === "aprovado") {
      log.info("Marley: vínculo com o Thor já aprovado");
    } else {
      if (!atual?.mae_nome) await salvarLinhagem(teste.token, marley.id, MARLEY_MATERNO);
      const req = await garantirSolicitacao(teste.token, marley, thor, "pai",
        "Olá! O Marley é filho do Thor, cruza realizada em 2024. Pode confirmar a paternidade?");
      if (req.status === "pendente") {
        await api("POST", `/api/v1/lineages/requests/${req.id}/approve`, { token: yasmim.token });
      }
      log.ok("Marley: Yasmim aprovou a paternidade do Thor (avós paternos herdados)");
    }
  } catch (e) {
    log.erro(`Marley: ${e.message}`);
  }

  // 3. Billy, com solicitação de paternidade PENDENTE para o Bob do João Victor
  log.titulo("Billy (usuarioteste), aguardando aprovação do Bob (João Victor)");
  try {
    let petsJoao = await listarPets(joao.token);
    let bob = acharPet(petsJoao, "Bob");
    if (!bob) {
      bob = await api("POST", "/api/v1/pets", { token: joao.token, body: PET_BOB });
      log.ok("Bob (Beagle) cadastrado para o João Victor");
    }
    if (!(await obterLinhagem(bob.id))?.pai_nome) {
      await salvarLinhagem(joao.token, bob.id, LINHAGEM_BOB);
      log.ok("Bob: pedigree registrado");
    }

    const billy = exigirPet(petsTeste, "Billy", "usuarioteste");
    const atual = await obterLinhagem(billy.id);
    if (!atual?.mae_nome) await salvarLinhagem(teste.token, billy.id, BILLY_MATERNO);
    const req = await garantirSolicitacao(teste.token, billy, bob, "pai",
      "Oi, João! O Billy é filho do Bob, da ninhada de fevereiro de 2024. Pode confirmar?");
    log.ok(`Billy: solicitação ${req.status}. O João Victor aprova em /pedigree na apresentação`);
  } catch (e) {
    log.erro(`Billy: ${e.message}`);
  }
});
