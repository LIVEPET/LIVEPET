// =============================================================================
// LIVEPET - Seed de anúncios da Vitrine Pet (Issue #102)
//
// Publica anúncios de venda e adoção de pets de vários tutores, para que
// qualquer conta encontre animais de outros usuários na Vitrine Pet.
// O MatchPet não precisa de seed: ele já lista os pets de outros tutores.
//
// Depende dos seeds anteriores (scripts/seed-demo.sh, usuarioteste.mjs e
// pedigree.mjs). Pode rodar várias vezes: anúncios ativos não são duplicados.
//
// Uso (Git Bash, Linux ou Mac):
//   SENHA_DEMO='SuaSenha123' node scripts/seed/vitrine.mjs
// =============================================================================
import { api, acharPet, acordarApi, executar, garantirTutor, listarPets, log } from "./lib.mjs";

const CONTAS = {
  teste: { nome: "usuarioteste", email: "usuarioteste@livepet.com.br", telefone: "(11) 98877-6655", cidade: "São Paulo - SP" },
  artur: { nome: "Professor Artur", email: "professor.artur@livepet.com.br", telefone: "(62) 99100-0002", cidade: "Goiânia - GO" },
  joao: { nome: "João Victor", email: "joao.victor@livepet.com.br", telefone: "(62) 99100-0003", cidade: "Goiânia - GO" },
};

const ANUNCIOS = [
  { conta: "teste", pet: "Max", tipo: "venda", preco: 3500,
    descricao: "Golden Retriever com pedigree CBKC, pai Campeão Brasileiro. Dócil, ótimo com crianças, vacinas e vermífugo em dia." },
  { conta: "teste", pet: "Fred", tipo: "venda", preco: 2800,
    descricao: "Border Collie com pedigree, linhagem de campeões de agility. Muito inteligente e ativo, ideal para quem tem espaço." },
  { conta: "teste", pet: "Luna", tipo: "venda", preco: 2200,
    descricao: "Gata Persa branca com pedigree FFB, pai Grande Campeão. Calma e carinhosa, acostumada a apartamento." },
  { conta: "teste", pet: "Theo", tipo: "venda", preco: 3000,
    descricao: "Maine Coon com pedigree FFB. Porte imponente e temperamento gentil, convive bem com cães." },
  { conta: "teste", pet: "Pipoca", tipo: "adocao", preco: 0,
    descricao: "Gatinha SRD resgatada, castrada e vacinada. Brincalhona e muito companheira. Adoção responsável com termo." },
  { conta: "teste", pet: "Chico", tipo: "adocao", preco: 0,
    descricao: "Angorá branco, vacinado. Procura um lar tranquilo. Entrega com termo de adoção responsável." },
  { conta: "artur", pet: "Mel", tipo: "adocao", preco: 0,
    descricao: "Filhote fêmea, porte pequeno, muito dócil. Vacinas iniciais aplicadas. Adoção responsável." },
  { conta: "joao", pet: "Zeus", tipo: "adocao", preco: 0,
    descricao: "Zeus é um mestiço de Pit Bull adulto, castrado, tranquilo e muito apegado às pessoas. Procura uma família com quintal." },
];

const idadeEmMeses = (iso) => {
  if (!iso) return null;
  const n = new Date(`${iso}T12:00:00Z`);
  const hoje = new Date();
  return Math.max(0, (hoje.getUTCFullYear() - n.getUTCFullYear()) * 12 + hoje.getUTCMonth() - n.getUTCMonth());
};

executar(async () => {
  await acordarApi();

  const sessoes = {};
  for (const [chave, conta] of Object.entries(CONTAS)) {
    const { token } = await garantirTutor(conta);
    sessoes[chave] = {
      token,
      pets: await listarPets(token),
      anuncios: await api("GET", "/api/v1/marketplace/my-listings", { token }),
    };
  }

  log.titulo("Anúncios da Vitrine Pet");
  for (const a of ANUNCIOS) {
    const conta = CONTAS[a.conta];
    const sessao = sessoes[a.conta];
    try {
      const pet = acharPet(sessao.pets, a.pet);
      if (!pet) throw new Error(`pet ${a.pet} de ${conta.nome} não encontrado. Rode os seeds anteriores.`);

      const ativo = sessao.anuncios.find((l) => l.pet_id === pet.id);
      if (ativo) {
        log.info(`${a.pet} (${conta.nome}): anúncio já publicado`);
        continue;
      }

      const temPedigree = pet.lineage?.status_verificacao === "aprovado";
      const tipoTexto = a.tipo === "venda" ? "à venda" : "para adoção";
      await api("POST", "/api/v1/marketplace/listings", {
        token: sessao.token,
        body: {
          pet_id: pet.id,
          titulo: `${pet.nome}, ${pet.raca} ${tipoTexto}`,
          especie: pet.especie,
          raca: pet.raca,
          sexo: pet.sexo,
          idade_meses: idadeEmMeses(pet.data_nascimento),
          quantidade: 1,
          cidade: conta.cidade,
          tipo: a.tipo,
          preco: a.preco,
          pedigree: temPedigree,
          pedigree_registro: temPedigree ? pet.lineage.registro : null,
          descricao: a.descricao,
          foto_url: pet.foto_url,
          telefone_contato: conta.telefone,
        },
      });
      const valor = a.tipo === "venda" ? `R$ ${a.preco.toLocaleString("pt-BR")}` : "adoção";
      log.ok(`${a.pet} (${conta.nome}): anúncio publicado, ${valor}${temPedigree ? ", com pedigree" : ""}`);
    } catch (e) {
      log.erro(`${a.pet} (${conta.nome}): ${e.message}`);
    }
  }
});
