# 🐾 LivePet API (Back-end em FastAPI)

API RESTful em Python com FastAPI, SQLAlchemy e PostgreSQL/SQLite para o ecossistema LivePet.

---

## 🌐 Ambientes em Produção (Render)

* **API Pública:** [https://livepet.onrender.com](https://livepet.onrender.com)
* **Documentação Interativa (Swagger UI):** [https://livepet.onrender.com/docs](https://livepet.onrender.com/docs)
* **Documentação ReDoc:** [https://livepet.onrender.com/redoc](https://livepet.onrender.com/redoc)
* **Endpoint de Healthcheck:** [https://livepet.onrender.com/health](https://livepet.onrender.com/health)

---

## 🚀 Como Executar Localmente

### 1. Criar e Ativar o Ambiente Virtual (venv)
No terminal, dentro da pasta `backend`:

```bash
# Windows (PowerShell):
py -m venv venv
.\venv\Scripts\activate

# Linux / Mac:
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar as Dependências
```bash
pip install -r requirements.txt
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo caso o `.env` ainda não exista:
```bash
cp .env.example .env
```

*Por padrão, a API já vem configurada para rodar em SQLite local (`livepet.db`), sem exigir nenhuma instalação externa.*

### 4. Iniciar o Servidor de Desenvolvimento
```bash
uvicorn app.main:app --reload
```

Acesse no navegador:
*   Documentação Swagger Interativa: 👉 **`http://127.0.0.1:8000/docs`**
*   Documentação ReDoc: 👉 **`http://127.0.0.1:8000/redoc`**
*   Healthcheck: 👉 **`http://127.0.0.1:8000/health`**

---

## 🧪 Como Executar os Testes
Para rodar a suíte completa de testes automatizados (67 testes):
```bash
pytest -v
```

---

## 📡 Visão Geral das Rotas REST

| Módulo | Prefixo | Principais Endpoints | Autenticação |
| :--- | :--- | :--- | :--- |
| **Auth Tutores** | `/api/v1/auth` | `POST /register`, `POST /login`, `GET /me`, `PUT /me` | JWT (Bearer) |
| **Pets & Espécies** | `/api/v1/pets` | `GET /especies`, `GET /`, `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` | JWT / Pública |
| **Vínculo Clínico (Tutor)** | `/api/v1/pets` | `GET /solicitacoes-clinica`, `POST /solicitacoes-clinica/{id}/responder` | JWT (Tutor) |
| **Vacinas** | `/api/v1/pets` | `GET /{id}/vaccines`, `POST /{id}/vaccines`, `DELETE /{id}/vaccines/{v_id}` | JWT |
| **Prontuário Médico** | `/api/v1/pets` | `GET /{id}/medical-records`, `POST /{id}/medical-records`, `DELETE ...` | JWT |
| **Contatos de Cuidado** | `/api/v1/pets` | `GET /{id}/care-contacts`, `POST /{id}/care-contacts`, `DELETE ...` | JWT |
| **Coleira QR Code** | `/api/v1/public`| `GET /pet/{token_publico}` | Pública |
| **Clínicas** | `/api/clinicas` | `POST /register`, `POST /login`, `GET /me`, `PUT /perfil`, `GET /especies` | Role `clinic` |
| **Atendimentos & Anamnese** | `/api/clinicas` | `GET /atendimentos`, `POST /atendimentos`, `POST /atendimentos/{id}/concluir` | Role `clinic` |
| **Pacientes & Vínculo** | `/api/clinicas` | `GET /pacientes`, `PUT /pacientes/{id}`, `POST /solicitar-vinculo`, `GET /solicitacoes-vinculo` | Role `clinic` |
| **Linhagens / Pedigree** | `/api/v1/lineages` | `GET /tree/{id}`, `POST /requests`, `GET /requests/pending`, `POST .../approve` | JWT |
| **Marketplace** | `/api/v1/marketplace` | `GET /listings`, `GET /my-listings`, `POST /listings`, `POST .../confirm` | JWT / Pública |
| **Health** | `/health` | `GET /health` (status e conectividade com Neon) | Pública |


