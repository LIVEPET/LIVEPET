# 🛠️ Roadmap de Back-end (FastAPI) & Divisão da Dupla

Este documento formaliza a arquitetura, divisão de responsabilidades entre **Paulo** e **Fagner** e o plano de autonomia para o desenvolvimento da API do **LivePet**.

---

## 👥 Divisão de Trabalho: Paulo vs. Fagner

Para garantir agilidade sem conflitos de merge no Git, as tarefas e arquivos foram divididos por frentes complementares:

| Integrante | Frentes e Sub-Issues | Arquivos de Responsabilidade Direta |
| :--- | :--- | :--- |
| **Paulo** | **Frente 1: Fundação, Banco de Dados & Gestão de Pets**<br>• Sub-Issue 1: Setup do FastAPI, CORS e Conexão de Banco.<br>• Sub-Issue 2: Modelagem ORM (SQLAlchemy) e Schemas (Pydantic).<br>• Sub-Issue 4: CRUD de Pets e Rota Pública para leitura do QR Code. | • `app/core/database.py`<br>• `app/core/config.py`<br>• `app/models/` (todos os modelos)<br>• `app/schemas/pet.py`<br>• `app/api/routers/pets.py` |
| **Fagner** | **Frente 2: Segurança, Prontuário Clínico & Nuvem**<br>• Sub-Issue 3: Módulo de Autenticação JWT, Registro e Criptografia.<br>• Sub-Issue 5: Endpoints de Vacinas e Prontuário Médico.<br>• Sub-Issue 6: Deploy em Nuvem no Render e Documentação OpenAPI. | • `app/core/security.py`<br>• `app/api/deps.py`<br>• `app/schemas/auth.py`<br>• `app/schemas/medical.py`<br>• `app/api/routers/auth.py`<br>• `app/api/routers/medical.py`<br>• `render.yaml` |

---

## 🚀 Plano de Autonomia (Como avançar sem depender dos outros grupos)

Não ficaremos travados esperando as outras duplas. Nossa estratégia de desacoplamento é:

1. **Sem a instância do Banco de Dados (Jhenyffer e Gabriel)?**
   * Usaremos **SQLite local** (`sqlite:///./livepet.db`) durante o desenvolvimento inicial.
   * Como usaremos o ORM SQLAlchemy, trocar de SQLite para o PostgreSQL da nuvem exige **apenas alterar a variável `DATABASE_URL` no `.env`**. Nenhuma linha de código da API precisará ser refeita!
   * Os modelos de dados serão criados com base nas tabelas que o Front-end atual já utiliza (`users`, `pets`, `vaccines`, `medical_records`).

2. **Sem a integração do Front-end (João Victor e Yasmim)?**
   * O FastAPI gera automaticamente a interface interativa do **Swagger UI** na rota `/docs`.
   * Testaremos 100% dos endpoints, payloads, respostas de erro e autenticação JWT diretamente pelo navegador via Swagger, Postman ou Insomnia.

3. **Sem documentação prévia da gestão (João Paulo e Willian)?**
   * O padrão adotado é **RESTful clássico**, cobrindo os recursos já identificados no protótipo Lovable do projeto. A documentação técnica da API é gerada automaticamente pelo Swagger/OpenAPI.

---

## 📋 Detalhamento das Sub-Issues

### 🔹 Sub-Issue 1 (Paulo): Setup FastAPI, Estrutura e Banco Local/Remoto
- [ ] Inicializar estrutura de pastas do backend (`app/api/`, `app/core/`, `app/models/`, `app/schemas/`).
- [ ] Criar `requirements.txt` com as dependências essenciais.
- [ ] Implementar `app/core/config.py` e `app/core/database.py` com suporte flexível a SQLite ou PostgreSQL via `.env`.
- [ ] Configurar CORS no `main.py` liberando requisições do frontend.
- [ ] Endpoint `GET /health` checando a saúde da API.

### 🔹 Sub-Issue 2 (Paulo): Modelagem ORM e Schemas Pydantic
- [ ] Criar entidades no SQLAlchemy em `app/models/`:
  - `User` (id, nome, email, senha_hash, telefone, criado_em)
  - `Pet` (id, user_id, nome, especie, raca, porte, peso, foto_url, token_publico)
  - `Vaccine` (id, pet_id, nome, data_aplicacao, proxima_dose, lote, veterinario)
  - `MedicalRecord` (id, pet_id, tipo, descricao, peso_registrado, data_registro)
- [ ] Criar schemas Pydantic de entrada e saída em `app/schemas/`.

### 🔹 Sub-Issue 3 (Fagner): Autenticação, Criptografia e JWT
- [ ] Implementar funções de hash e checagem de senhas (`bcrypt`) em `app/core/security.py`.
- [ ] Implementar criação e decodificação de tokens JWT com tempo de expiração.
- [ ] Criar endpoints `POST /auth/register` e `POST /auth/login`.
- [ ] Criar injeção de dependência `get_current_user` em `app/api/deps.py` para proteger rotas privadas.

### 🔹 Sub-Issue 4 (Paulo): CRUD de Pets e Rota Pública de QR Code
- [ ] `POST /pets`: Cadastro de pet vinculado ao tutor autenticado.
- [ ] `GET /pets`: Listagem de pets do tutor logado.
- [ ] `GET /pets/{id}` e `PUT /pets/{id}`: Detalhe e edição.
- [ ] `DELETE /pets/{id}`: Exclusão lógica/física.
- [ ] `GET /public/pet/{token_publico}`: Rota pública aberta para leitura imediata ao escanear a coleira (retorna nome, foto, espécie, raça, telefone do tutor e alerta médico).

### 🔹 Sub-Issue 5 (Fagner): Endpoints de Vacinas e Prontuário Médico
- [ ] `POST /pets/{pet_id}/vaccines` e `GET /pets/{pet_id}/vaccines`.
- [ ] `DELETE /pets/{pet_id}/vaccines/{vaccine_id}`.
- [ ] `POST /pets/{pet_id}/medical-records` e `GET /pets/{pet_id}/medical-records`.

### 🔹 Sub-Issue 6 (Fagner): Deploy em Nuvem (Render) e Validação Swagger
- [ ] Criar Web Service gratuito no Render conectado ao repositório GitHub.
- [ ] Configurar comando de start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- [ ] Configurar variáveis de ambiente no Render.
- [ ] Compartilhar a URL pública do Swagger (`https://.../docs`) com toda a equipe.
