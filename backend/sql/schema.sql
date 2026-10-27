-- ==============================================================================
-- LIVEPET - Script DDL Consolidado para PostgreSQL (Neon)
-- Alinhado com SQLAlchemy (Issue #16), DER da Equipe de Banco e Frontend
-- ==============================================================================

-- Remove tabelas antigas vazias caso existam
DROP TABLE IF EXISTS public.pedigree CASCADE;
DROP TABLE IF EXISTS public.historico_medico CASCADE;
DROP TABLE IF EXISTS public.vacinas CASCADE;
DROP TABLE IF EXISTS public.pets CASCADE;
DROP TABLE IF EXISTS public.tutores CASCADE;

DROP TABLE IF EXISTS public.medical_records CASCADE;
DROP TABLE IF EXISTS public.vaccines CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Tabela de Tutores / Usuários
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON public.users(email);

-- 2. Tabela de Pets
CREATE TABLE public.pets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raca VARCHAR(80),
    porte VARCHAR(20),
    sexo VARCHAR(20),
    data_nascimento DATE,
    cor VARCHAR(80),
    peso NUMERIC(5, 2),
    foto_url VARCHAR(500),
    microchip VARCHAR(50),
    token_publico VARCHAR(64) NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pets_user_id ON public.pets(user_id);
CREATE INDEX idx_pets_token_publico ON public.pets(token_publico);
CREATE INDEX idx_pets_microchip ON public.pets(microchip);

-- 3. Tabela de Vacinas
CREATE TABLE public.vaccines (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    data_aplicacao DATE NOT NULL,
    proxima_dose DATE,
    lote VARCHAR(50),
    veterinario VARCHAR(150),
    observacoes TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vaccines_pet_id ON public.vaccines(pet_id);

-- 4. Tabela de Histórico Médico
CREATE TABLE public.medical_records (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT,
    peso_registrado NUMERIC(5, 2),
    veterinario VARCHAR(150),
    observacoes TEXT,
    data_registro TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medical_records_pet_id ON public.medical_records(pet_id);

-- 5. Tabela da Rede de Cuidados e Emergência
CREATE TABLE public.care_contacts (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    funcao VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL DEFAULT 'emergency',
    telefone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    foto_url VARCHAR(500),
    relacao_tutor VARCHAR(100),
    relacao_pet VARCHAR(100),
    nivel_vinculo VARCHAR(50) DEFAULT 'Alto',
    observacoes TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_care_contacts_pet_id ON public.care_contacts(pet_id);

-- 6. Tabela de Linhagem e Pedigree
CREATE TABLE public.lineages (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL UNIQUE REFERENCES public.pets(id) ON DELETE CASCADE,
    registro VARCHAR(100),
    generacoes INTEGER NOT NULL DEFAULT 3,
    pai_nome VARCHAR(150),
    pai_registro VARCHAR(100),
    pai_titulos VARCHAR(200),
    mae_nome VARCHAR(150),
    mae_registro VARCHAR(100),
    mae_titulos VARCHAR(200),
    avo_pat_m_nome VARCHAR(150),
    avo_pat_m_registro VARCHAR(100),
    avo_pat_f_nome VARCHAR(150),
    avo_pat_f_registro VARCHAR(100),
    avo_mat_m_nome VARCHAR(150),
    avo_mat_m_registro VARCHAR(100),
    avo_mat_f_nome VARCHAR(150),
    avo_mat_f_registro VARCHAR(100),
    pai_pet_id INTEGER REFERENCES public.pets(id) ON DELETE SET NULL,
    mae_pet_id INTEGER REFERENCES public.pets(id) ON DELETE SET NULL,
    status_verificacao VARCHAR(50) NOT NULL DEFAULT 'declaratorio',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lineages_pet_id ON public.lineages(pet_id);

-- 7. Tabela de Solicitações de Genealogia entre Tutores
CREATE TABLE public.lineage_requests (
    id SERIAL PRIMARY KEY,
    filhote_pet_id INTEGER NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    ascendente_pet_id INTEGER NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    tipo_vinculo VARCHAR(20) NOT NULL,
    solicitante_user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    solicitado_user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'pendente',
    mensagem VARCHAR(255),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    respondido_em TIMESTAMPTZ
);

CREATE INDEX idx_lineage_requests_filhote ON public.lineage_requests(filhote_pet_id);
CREATE INDEX idx_lineage_requests_ascendente ON public.lineage_requests(ascendente_pet_id);

-- 8. Tabela de Clínicas Veterinárias (Issue #59)
CREATE TABLE public.clinics (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    crmv VARCHAR(50),
    cnpj VARCHAR(30),
    telefone VARCHAR(30),
    whatsapp VARCHAR(30),
    endereco VARCHAR(255),
    sobre TEXT,
    foto_url VARCHAR(500),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clinics_email ON public.clinics(email);
CREATE INDEX idx_clinics_crmv ON public.clinics(crmv);

-- 9. Tabela de Veterinários (Issue #53)
CREATE TABLE public.veterinarios (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    crmv VARCHAR(50) NOT NULL,
    especialidade VARCHAR(100),
    telefone VARCHAR(30),
    email VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_veterinarios_clinic_id ON public.veterinarios(clinic_id);
CREATE INDEX idx_veterinarios_crmv ON public.veterinarios(crmv);

-- 10. Tabela de Atendimentos Clínicos
CREATE TABLE public.clinic_appointments (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    pet_id INTEGER REFERENCES public.pets(id) ON DELETE SET NULL,
    pet_name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(80),
    tutor VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    service VARCHAR(100) NOT NULL,
    vet VARCHAR(100),
    date VARCHAR(10) NOT NULL,
    time VARCHAR(10) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Confirmado',
    notes TEXT,
    queixa_principal TEXT,
    temperatura NUMERIC(4, 1),
    peso NUMERIC(5, 2),
    frequencia_cardiaca INTEGER,
    frequencia_respiratoria INTEGER,
    mucosas VARCHAR(50),
    diagnostico TEXT,
    prescricao TEXT,
    vacina_aplicada VARCHAR(100),
    vacina_lote VARCHAR(50),
    vacina_proxima_dose VARCHAR(10),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clinic_appointments_clinic_id ON public.clinic_appointments(clinic_id);
CREATE INDEX idx_clinic_appointments_pet_id ON public.clinic_appointments(pet_id);

-- 10. Tabela de Solicitações de Vínculo Pet-Clínica
CREATE TABLE public.clinic_pet_link_requests (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    pet_id INTEGER NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    local_patient_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    mensagem TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clinic_pet_link_clinic ON public.clinic_pet_link_requests(clinic_id);
CREATE INDEX idx_clinic_pet_link_pet ON public.clinic_pet_link_requests(pet_id);

-- 11. Tabela do Marketplace de Filhotes
CREATE TABLE public.marketplace_listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pet_id INTEGER REFERENCES public.pets(id) ON DELETE SET NULL,
    titulo VARCHAR(150) NOT NULL,
    especie VARCHAR(50) NOT NULL DEFAULT 'Cachorro',
    raca VARCHAR(80),
    sexo VARCHAR(20),
    idade_meses INTEGER DEFAULT 2,
    quantidade INTEGER NOT NULL DEFAULT 1,
    cidade VARCHAR(100),
    tipo VARCHAR(20) NOT NULL DEFAULT 'venda',
    preco NUMERIC(10, 2) DEFAULT 0.0,
    pedigree BOOLEAN DEFAULT FALSE,
    pedigree_registro VARCHAR(100),
    descricao TEXT,
    foto_url TEXT,
    telefone_contato VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmacao_enviada_em TIMESTAMPTZ
);

CREATE INDEX idx_marketplace_user_id ON public.marketplace_listings(user_id);
CREATE INDEX idx_marketplace_status ON public.marketplace_listings(status);

-- 12. Tabela de Swipes (curtidas) do MatchPet
CREATE TABLE public.pet_swipes (
    id SERIAL PRIMARY KEY,
    pet_origem_id INTEGER NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    pet_destino_id INTEGER NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    acao VARCHAR(20) NOT NULL CHECK (acao IN ('like', 'super_like', 'pass')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pet_swipes_par UNIQUE (pet_origem_id, pet_destino_id),
    CONSTRAINT ck_pet_swipes_pets_diferentes CHECK (pet_origem_id <> pet_destino_id)
);

CREATE INDEX idx_pet_swipes_destino ON public.pet_swipes(pet_destino_id);

-- Comentários de documentação
COMMENT ON TABLE public.users IS 'Tabela de tutores e usuários do sistema LivePet';
COMMENT ON TABLE public.pets IS 'Tabela de animais vinculados aos tutores';
COMMENT ON TABLE public.vaccines IS 'Histórico de vacinas aplicadas';
COMMENT ON TABLE public.medical_records IS 'Prontuário clínico e histórico médico dos animais';
COMMENT ON TABLE public.care_contacts IS 'Rede de contatos de emergência e cuidadores dos pets';
COMMENT ON TABLE public.lineages IS 'Registro de pedigree e linhagem ancestral dos pets';
COMMENT ON TABLE public.lineage_requests IS 'Solicitações de validação de ascendência entre tutores';
COMMENT ON TABLE public.clinics IS 'Tabela de clínicas veterinárias cadastradas no LivePet';
COMMENT ON TABLE public.veterinarios IS 'Tabela de médicos veterinários do corpo clínico das clínicas parceiras';
COMMENT ON TABLE public.clinic_appointments IS 'Prontuários e consultas realizadas por clínicas parceiras';
COMMENT ON TABLE public.clinic_pet_link_requests IS 'Vínculos entre clínicas e pets oficiais de tutores';
COMMENT ON TABLE public.marketplace_listings IS 'Anúncios do marketplace de filhotes e adoção responsável';
COMMENT ON TABLE public.pet_swipes IS 'Curtidas, super curtidas e passes entre pets no MatchPet';


