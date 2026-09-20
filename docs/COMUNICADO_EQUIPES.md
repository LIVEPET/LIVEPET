# 📢 Comunicado de Alinhamento Técnico do Back-end com as Outras Equipes

> **Para:** Equipes de Banco de Dados, Front-end e Documentação/Gestão  
> **De:** Equipe de Back-end (Paulo e Fagner)  
> **Assunto:** Entregas necessárias das outras frentes e estratégia de andamento do Back-end  

---

Olá pessoal! 👋

Para que o desenvolvimento da nossa API em Python (FastAPI) avance de forma coordenada com as demais frentes do projeto, listamos abaixo o que precisamos de cada grupo.

⚠️ **Importante:** Nós do Back-end **não vamos ficar parados aguardando**. Já iniciamos a arquitetura do projeto utilizando banco local (SQLite com SQLAlchemy) e o Swagger para testes. Assim, quando cada grupo concluir sua parte, faremos a transição de forma rápida e sem retrabalho.

---

### 1. 🗄️ O que precisamos da equipe de Banco de Dados (Jhenyffer e Gabriel)

1. **String de Conexão do PostgreSQL:**
   * A URL de conexão da instância provisionada na nuvem (Supabase ou Neon), no formato:
     `postgresql://usuario:senha@host:5432/nome_do_banco`
2. **Diagrama Entidade-Relacionamento (DER) consolidado:**
   * O nome final das tabelas e atributos para as entidades:
     * **Tutores** (campos de identificação, contato e senha)
     * **Pets** (atributos essenciais e identificador único/token para o QR Code)
     * **Vacinas** (nome, data de aplicação, reforço, lote e veterinário)
     * **Histórico Médico** (data, peso, exames, descrição clínica)
3. **Scripts SQL (DDL):**
   * Os scripts `.sql` com os tipos e constraints (chaves primárias, estrangeiras e campos obrigatórios).

> **Como o Back-end vai avançar enquanto isso:**  
> Vamos criar as classes do ORM (SQLAlchemy) espelhando os campos já existentes no protótipo Lovable e rodar em **SQLite local**. Quando vocês nos enviarem a URL do PostgreSQL, só precisaremos alterar a variável no `.env`, pois o SQLAlchemy se encarrega de mapear tudo para o Postgres.

---

### 2. 🎨 O que precisamos da equipe de Front-end (João Victor e Yasmim)

1. **Mapeamento de Campos de Entrada:**
   * Confirmar se há algum campo específico nas telas de cadastro de Pet, Vacinas ou Login que vocês considerem obrigatório além do que já está visível no protótipo Lovable (`livepet2026.lovable.app`).
2. **Formato da Leitura do QR Code:**
   * Validação de como vocês pretendem ler o QR Code na tela mobile (se será direcionado para uma URL pública do tipo `https://dominio.com/pet/{id}` ou consumindo um endpoint direto da API).

> **Como o Back-end vai avançar enquanto isso:**  
> Já vamos desenvolver os endpoints REST no padrão da web e disponibilizar a documentação interativa no **Swagger** (`/docs`). Com ela, vocês poderão simular chamadas, ver os formatos JSON de envio e resposta e testar os retornos mesmo antes de codificar a tela final.

---

### 3. 📄 O que precisamos da equipe de Documentação & Gestão (João Paulo e Willian)

1. **Prazos e Escopo da Apresentação:**
   * Alinhamento da data e do que exatamente a banca examinadora espera ver na próxima apresentação (ex: apenas protótipo navegável ou a API já respondendo ao vivo).
2. **Casos de Uso Principais:**
   * A lista resumida dos Casos de Uso aprovados para garantirmos que todas as regras de negócio foram contempladas nos endpoints da API.

> **Como o Back-end vai avançar enquanto isso:**  
> Manteremos este repositório atualizado com o histórico de commits, issues fechadas e a documentação técnica da API gerada automaticamente pelo OpenAPI/Swagger.

---

Contamos com a colaboração de todos! Vamos juntos construir um projeto nota 10. Qualquer dúvida técnica, nos chamem no grupo ou respondam nesta discussão! 🚀🐾
