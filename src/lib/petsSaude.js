import petThor from "@/assets/pet-thor.jpg";
import petMia from "@/assets/pet-mia.jpg";
import petBento from "@/assets/pet-bento.jpg";
import petLuna from "@/assets/pet-luna.jpg";

/** Monta datas relativas a hoje, como em Pets.tsx e MedicalHistory.tsx. */
const emDias = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const PETS_SAUDE = [
  {
    id: "thor",
    nome: "Thor do Vale Imperial",
    apelido: "Thor",
    especie: "Cachorro",
    raca: "Golden Retriever",
    registro: "CBKC 12.847",
    img: petThor,
    vacinas: [
      {
        id: "thor-v1",
        nome: "V10 (Polivalente)",
        dose: "3ª dose",
        dataAplicacao: emDias(-185),
        dataReforco: emDias(180),
        clinica: "Clínica Vale Verde",
      },
      {
        id: "thor-v2",
        nome: "Antirrábica",
        dose: "Anual",
        dataAplicacao: emDias(-377),
        dataReforco: emDias(-12),
        clinica: "Clínica Vale Verde",
      },
      {
        id: "thor-v3",
        nome: "Giárdia",
        dose: "2ª dose",
        dataAplicacao: emDias(-125),
        dataReforco: emDias(240),
        clinica: "PetCare Pinheiros",
      },
      {
        id: "thor-v4",
        nome: "Gripe canina",
        dose: "Anual",
        dataAplicacao: emDias(-410),
        dataReforco: emDias(-45),
        clinica: "PetCare Pinheiros",
      },
      {
        id: "thor-v5",
        nome: "Leishmaniose",
        dose: "Reforço anual",
        dataAplicacao: emDias(-15),
        dataReforco: emDias(350),
        clinica: "Clínica Vale Verde",
      },
    ],
    avisos: {
      alergias: [
        {
          id: "thor-a1",
          titulo: "Alergia grave a sulfas",
          detalhe:
            "Reação anafilática registrada em 2024. Informe a clínica antes de qualquer prescrição.",
        },
      ],
      recomendacoes: [
        {
          id: "thor-r1",
          titulo: "Controle de peso",
          detalhe:
            "Dra. Helena Costa pediu pesagem mensal. Meta entre 28 e 31 kg.",
        },
        {
          id: "thor-r2",
          titulo: "Vermífugo a cada 6 meses",
          detalhe: "Última dose há 3 meses. Próxima prevista para dezembro.",
        },
      ],
    },
  },
  {
    id: "mia",
    nome: "Mia",
    apelido: "Mia",
    especie: "Gato",
    raca: "SRD",
    registro: "Microchip 982 000 234 567 890",
    img: petMia,
    vacinas: [
      {
        id: "mia-v1",
        nome: "Tríplice felina",
        dose: "Reforço anual",
        dataAplicacao: emDias(-325),
        dataReforco: emDias(40),
        clinica: "Clínica Bicho Feliz",
      },
      {
        id: "mia-v2",
        nome: "Antirrábica",
        dose: "Anual",
        dataAplicacao: emDias(-390),
        dataReforco: emDias(-25),
        clinica: "Clínica Bicho Feliz",
      },
      {
        id: "mia-v3",
        nome: "Leucemia felina (FeLV)",
        dose: "2ª dose",
        dataAplicacao: emDias(-245),
        dataReforco: emDias(120),
        clinica: "Dr. Marcos Lima",
      },
    ],
    avisos: {
      alergias: [],
      recomendacoes: [
        {
          id: "mia-r1",
          titulo: "FIV/FELV negativos",
          detalhe:
            "Exame de 2025 sem alterações. Repetir se houver contato com gatos de rua.",
        },
        {
          id: "mia-r2",
          titulo: "Limpeza dentária anual",
          detalhe: "Tártaro leve observado na última consulta.",
        },
      ],
    },
  },
  {
    id: "bento",
    nome: "Bento",
    apelido: "Bento",
    especie: "Cachorro",
    raca: "Labrador",
    registro: "Microchip 982 000 345 678 901",
    img: petBento,
    vacinas: [
      {
        id: "bento-v1",
        nome: "V10 (Polivalente)",
        dose: "Reforço anual",
        dataAplicacao: emDias(-165),
        dataReforco: emDias(200),
        clinica: "PetCare Pinheiros",
      },
      {
        id: "bento-v2",
        nome: "Antirrábica",
        dose: "Anual",
        dataAplicacao: emDias(-305),
        dataReforco: emDias(60),
        clinica: "PetCare Pinheiros",
      },
      {
        id: "bento-v3",
        nome: "Giárdia",
        dose: "Reforço anual",
        dataAplicacao: emDias(-350),
        dataReforco: emDias(15),
        clinica: "Dra. Ana Reis",
      },
    ],
    avisos: {
      alergias: [],
      recomendacoes: [
        {
          id: "bento-r1",
          titulo: "Radiografia de quadril sem displasia",
          detalhe: "Articulação preservada. Repetir o exame aos 5 anos.",
        },
        {
          id: "bento-r2",
          titulo: "Antipulgas a cada 12 semanas",
          detalhe: "Dose conforme peso (32 kg).",
        },
      ],
    },
  },
  {
    id: "luna",
    nome: "Luna",
    apelido: "Luna",
    especie: "Gato",
    raca: "Persa",
    registro: "Microchip 982 000 456 789 012",
    img: petLuna,
    vacinas: [
      {
        id: "luna-v1",
        nome: "Tríplice felina",
        dose: "2ª dose",
        dataAplicacao: emDias(-9),
        dataReforco: emDias(21),
        clinica: "Dr. Paulo Nunes",
      },
      {
        id: "luna-v2",
        nome: "Antirrábica",
        dose: "1ª dose",
        dataAplicacao: emDias(-65),
        dataReforco: emDias(300),
        clinica: "Dr. Paulo Nunes",
      },
    ],
    avisos: {
      alergias: [],
      recomendacoes: [
        {
          id: "luna-r1",
          titulo: "Acompanhamento de crescimento",
          detalhe: "Filhote de 4 meses. Pesagem quinzenal até completar 1 ano.",
        },
      ],
    },
  },
];
