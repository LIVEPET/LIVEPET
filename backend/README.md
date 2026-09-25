# 🐾 LivePet API (Back-end em FastAPI)

API RESTful em Python com FastAPI, SQLAlchemy e PostgreSQL/SQLite para o ecossistema LivePet.

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
Para rodar a suíte de testes unitários dos modelos ORM e schemas Pydantic:
```bash
pytest -v
```
