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
    token_publico VARCHAR(64) NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pets_user_id ON public.pets(user_id);
CREATE INDEX idx_pets_token_publico ON public.pets(token_publico);

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

-- Comentários de documentação
COMMENT ON TABLE public.users IS 'Tabela de tutores e usuários do sistema LivePet';
COMMENT ON TABLE public.pets IS 'Tabela de animais vinculados aos tutores';
COMMENT ON TABLE public.vaccines IS 'Histórico de vacinas aplicadas';
COMMENT ON TABLE public.medical_records IS 'Prontuário clínico e histórico médico dos animais';
