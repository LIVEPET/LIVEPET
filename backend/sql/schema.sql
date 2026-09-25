-- ==============================================================================
-- LIVEPET - Script DDL para PostgreSQL (Neon / Supabase)
-- Alinhado com os Modelos SQLAlchemy (Issue #16) e DER do Projeto
-- ==============================================================================

-- 1. Criação da Tabela de Usuários / Tutores
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. Criação da Tabela de Pets
CREATE TABLE IF NOT EXISTS public.pets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raca VARCHAR(50),
    porte VARCHAR(20),
    peso NUMERIC(5, 2),
    foto_url VARCHAR(500),
    token_publico VARCHAR(64) NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_pets_user_id ON public.pets(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_token_publico ON public.pets(token_publico);

-- 3. Criação da Tabela de Vacinas
CREATE TABLE IF NOT EXISTS public.vaccines (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    data_aplicacao DATE NOT NULL,
    proxima_dose DATE,
    lote VARCHAR(50),
    veterinario VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_vaccines_pet_id ON public.vaccines(pet_id);

-- 4. Criação da Tabela de Histórico Médico
CREATE TABLE IF NOT EXISTS public.medical_records (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT,
    peso_registrado NUMERIC(5, 2),
    data_registro TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medical_records_pet_id ON public.medical_records(pet_id);

-- ==============================================================================
-- Comentários explicativos nas tabelas e colunas
-- ==============================================================================
COMMENT ON TABLE public.users IS 'Tabela de tutores e usuários do sistema';
COMMENT ON TABLE public.pets IS 'Tabela de animais cadastrados vinculados a um tutor';
COMMENT ON TABLE public.vaccines IS 'Histórico de doses e vacinas aplicadas nos pets';
COMMENT ON TABLE public.medical_records IS 'Prontuário e histórico de atendimentos clínicos';
