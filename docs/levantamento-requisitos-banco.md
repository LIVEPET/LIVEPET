# Levantamento de Requisitos das Entidades do Banco de Dados — LivePet

## 1. Objetivo

Levantar e documentar os requisitos de dados necessários para as funcionalidades previstas no projeto LivePet, identificando quais informações precisam ser armazenadas, seus relacionamentos e as regras necessárias para a construção do modelo de dados.

As entidades **Tutores**, **Pets**, **Vacinas** e **Histórico Médico** são a entrega de destaque deste semestre. O levantamento também cobre **Pedigree**, **Cartão Animal** e **QR Code**, garantindo que o modelo de dados suporte o escopo definido para o LivePet.

Este documento serve de base para a criação do Modelo Entidade-Relacionamento (DER) e para as etapas posteriores de implementação do banco de dados. Não inclui criação de tabelas, scripts SQL, configuração de instância (Supabase/Neon) ou integração com back-end.

## 2. Funcionalidades consideradas

- Autenticação de tutores
- Cadastro de tutores
- CRUD de pets
- Associação entre tutor e pet
- Identificação do pet por QR Code
- Consulta pública dos dados do pet através do QR Code
- Cadastro e consulta de vacinas
- Registro e consulta do histórico médico
- Consulta de pedigree
- Geração e consulta do Cartão Animal

## 3. Entidade: Tutores

### 3.1 Objetivo
Armazenar os dados do responsável pelo pet e as informações necessárias para sua autenticação no sistema.

### 3.2 Atributos

| Atributo | Descrição | Obrigatório | Observação |
|---|---|---|---|
| id_tutor | Identificador único do tutor | Sim | Chave primária |
| nome | Nome completo do tutor | Sim | Utilizado para identificação |
| email | E-mail do tutor | Sim | Utilizado para autenticação e contato, único |
| senha_hash | Senha armazenada de forma segura | Sim | Nunca armazenar em texto puro |
| telefone | Telefone de contato | Sim | Contato relacionado ao pet |
| data_cadastro | Data e hora de criação do cadastro | Sim | Controle de registro |

### 3.3 Requisitos relacionados
- O sistema deve permitir o cadastro de um tutor.
- O sistema deve permitir a autenticação do tutor por e-mail e senha.
- Cada tutor deve possuir uma identificação única.
- O e-mail utilizado para autenticação deve ser associado a um único tutor.
- A senha deve ser armazenada de forma segura por meio de hash.
- O tutor deve poder estar associado a um ou mais pets.

## 4. Entidade: Pets

### 4.1 Objetivo
Armazenar os dados básicos de cada animal, sua associação com o tutor responsável e sua identificação para consulta pública via QR Code.

### 4.2 Atributos

| Atributo | Descrição | Obrigatório | Observação |
|---|---|---|---|
| id_pet | Identificador único do pet | Sim | Chave primária |
| id_tutor | Identificador do tutor responsável | Sim | Chave estrangeira para Tutores |
| nome | Nome do pet | Sim | |
| especie | Espécie do animal | Sim | Ex.: cão, gato |
| raca | Raça do animal | Não | Pode não ser conhecida |
| data_nascimento | Data de nascimento do pet | Sim | Idade é calculada a partir daqui, não armazenada |
| sexo | Sexo do animal | Sim | |
| porte | Porte do animal | Não | Pequeno, médio, grande |
| cor | Cor/características de identificação | Não | |
| qr_code_token | Token de identificação pública do pet | Sim | Único, usado na consulta por QR Code |
| data_cadastro | Data e hora de cadastro do pet | Sim | Controle de registro |

### 4.3 Requisitos relacionados
- O sistema deve permitir que um tutor cadastre um ou mais pets.
- Cada pet deve possuir uma identificação única e estar associado a um único tutor responsável.
- O sistema deve permitir cadastrar, consultar, alterar e excluir pets.
- A leitura do QR Code deve permitir localizar o pet sem exigir autenticação do usuário que realizou a leitura.
- A consulta pública deve disponibilizar somente os dados definidos pelo projeto como públicos.
- Os dados do tutor não devem necessariamente ser expostos integralmente na consulta pública do QR Code.

## 5. Entidade: Vacinas

### 5.1 Objetivo
Armazenar o histórico de vacinação de cada pet.

### 5.2 Atributos

| Atributo | Descrição | Obrigatório | Observação |
|---|---|---|---|
| id_vacina | Identificador único do registro | Sim | Chave primária |
| id_pet | Identificador do pet vacinado | Sim | Chave estrangeira para Pets |
| nome_vacina | Nome da vacina aplicada | Sim | Ex.: antirrábica |
| data_aplicacao | Data em que a vacina foi aplicada | Sim | |
| proxima_dose | Data prevista para a próxima dose | Não | |
| veterinario | Nome do profissional responsável | Não | |
| observacoes | Informações adicionais | Não | |
| data_cadastro | Data e hora de criação do registro | Sim | Controle de registro |

### 5.3 Requisitos relacionados
- Um pet pode possuir vários registros de vacinação; cada registro pertence a um único pet.
- O sistema deve permitir consultar o histórico de vacinas do pet.
- As informações de vacinação poderão ser utilizadas na consulta pública por QR Code, conforme as regras definidas pelo projeto.

## 6. Entidade: Histórico Médico

### 6.1 Objetivo
Armazenar os registros de atendimentos, consultas e acontecimentos médicos do pet.

### 6.2 Atributos

| Atributo | Descrição | Obrigatório | Observação |
|---|---|---|---|
| id_historico | Identificador único do registro | Sim | Chave primária |
| id_pet | Identificador do pet | Sim | Chave estrangeira para Pets |
| data_atendimento | Data do atendimento/acontecimento | Sim | |
| tipo_atendimento | Tipo do atendimento | Sim | Ex.: consulta, exame, retorno |
| descricao | Descrição do atendimento | Não | |
| observacoes | Observações adicionais | Não | |
| veterinario | Nome do profissional responsável | Sim | |
| data_cadastro | Data e hora de criação do registro | Sim | Controle de registro |

### 6.3 Requisitos relacionados
- Um pet pode possuir vários registros médicos; cada registro pertence a um único pet.
- Os registros devem possuir uma data para permitir organização cronológica.
- O histórico poderá ser utilizado na consulta pública por QR Code, conforme dados definidos como públicos.

## 7. Funcionalidade: Pedigree

### 7.1 Objetivo
Permitir a consulta da linhagem do pet (pais e avós), quando cadastrados no sistema.

### 7.2 Atributos

| Atributo | Descrição | Obrigatório | Observação |
|---|---|---|---|
| id_pet | Identificador do pet consultado | Sim | Chave primária e estrangeira para Pets |
| id_pai | Identificador do pai | Não | Chave estrangeira para Pets quando o pai estiver cadastrado |
| nome_pai | Nome do pai | Não | Utilizado quando o pai não possuir cadastro no sistema |
| id_mae | Identificador da mãe | Não | Chave estrangeira para Pets quando a mãe estiver cadastrada |
| nome_mae | Nome da mãe | Não | Utilizado quando a mãe não possuir cadastro no sistema |

Os avós (paterno, paterna, materno, materna) não são armazenados como colunas próprias: quando os pais estiverem cadastrados, são obtidos consultando os campos `id_pai`/`id_mae` do pai e da mãe do pet. Caso algum pai ou mãe seja avulso, sem cadastro no sistema, a linhagem correspondente fica limitada à informação disponível.

### 7.3 Requisitos relacionados
- O sistema deve permitir consultar o pedigree de um pet, apresentando pai, mãe e até duas gerações acima, quando as informações estiverem disponíveis.
- O sistema deve permitir informar pai e mãe cadastrados ou avulsos, sem cadastro no sistema.
- O sistema deve identificar o grau de parentesco de cada animal apresentado.
- Caso alguma informação não esteja cadastrada, o sistema deve indicar que o dado não está disponível.
- Deve ser evitada a criação de relacionamentos de parentesco inválidos (ex.: um pet não pode ser pai/mãe de si mesmo).

### 7.4 Validação
Foi definido pela equipe que pai e mãe podem ser informados como animais avulsos, sem cadastro no sistema. Quando houver cadastro correspondente, `id_pai` e `id_mae` poderão referenciar outro registro de Pets; quando não houver, os campos de nome poderão registrar a informação disponível.

## 8. Funcionalidade: Cartão Animal

### 8.1 Objetivo
Gerar e disponibilizar um cartão digital de identificação do pet, reunindo informações já cadastradas em outras entidades, com acesso via QR Code.

### 8.2 Dados utilizados

| Dado | Origem | Descrição | Obrigatório |
|---|---|---|---|
| id_pet | Pets | Identificador do pet | Sim |
| nome | Pets | Nome do animal | Sim |
| especie | Pets | Espécie do animal | Sim |
| raca | Pets | Raça do animal | Não |
| idade | Calculado | Calculada a partir de data_nascimento | Sim |
| data_nascimento | Pets | Data de nascimento | Sim |
| sexo | Pets | Sexo do animal | Sim |
| microchip | Pets | Número ou identificação do microchip do pet | Não |
| id_tutor | Pets | Identificador do tutor responsável | Sim |
| id_veterinario | Veterinarios | Identificador do veterinário responsável ou associado ao pet | Não |

O Cartão Animal **não é uma entidade independente** do banco de dados: ele é uma representação/visualização de dados já existentes em Pets, Tutores e Veterinarios.

### 8.3 Requisitos relacionados
- O Cartão Animal deve estar vinculado a um único pet.
- O sistema deve atualizar as informações do cartão automaticamente quando os dados do pet forem alterados.
- O sistema deverá considerar informações do veterinário associado ao pet quando aplicável.

### 8.4 Validação
Foi definido pela equipe que `microchip` será implementado como campo de Pets e que `id_veterinario` será relacionado a uma entidade própria de Veterinarios. A entidade Veterinarios terá uma tela própria no sistema, diferente da tela de Tutor.

## 9. Funcionalidade: QR Code

### 9.1 Objetivo
A funcionalidade de identificação e consulta pública de um pet através de QR Code **não será implementada neste momento**. Ela poderá ser considerada em uma etapa futura do projeto.

### 9.2 Situação atual
O QR Code fica fora do escopo da implementação atual do banco e do sistema.

### 9.3 Decisão da equipe
Foi definido pela equipe que a funcionalidade de QR Code não será implementada nesta etapa. Portanto, não será necessário definir agora quais dados de Pets, Vacinas e Histórico Médico seriam disponibilizados publicamente.

## 10. Relacionamentos identificados

| Relacionamento | Cardinalidade | Descrição |
|---|---|---|
| Tutores → Pets | 1:N | Um tutor pode possuir vários pets; cada pet tem um único tutor responsável |
| Pets → Vacinas | 1:N | Um pet pode possuir vários registros de vacinação; cada vacina pertence a um único pet |
| Pets → Histórico Médico | 1:N | Um pet pode possuir vários registros médicos; cada registro pertence a um único pet |
| Pets → Pets (Pedigree) | 1:N (auto-relacionamento) | Um pet pode referenciar outro pet como pai ou mãe quando estiver cadastrado; pais avulsos são registrados por nome |
| Pets → Veterinarios | N:1 | Um veterinário pode estar associado a vários pets; o pet pode ter um veterinário associado quando aplicável |
| Pets → Cartão Animal | não é relacionamento de tabela | Visualização derivada dos dados de Pets, Tutores e Veterinarios |
| QR Code | não implementado nesta etapa | Funcionalidade reservada para etapa futura |

## 11. Regras de negócio gerais

- Nenhuma senha deve ser armazenada em texto puro.
- E-mail de tutor e token de QR Code devem ser únicos no sistema.
- A idade do pet nunca é armazenada diretamente; é sempre calculada a partir de `data_nascimento`.
- Toda tabela ligada a um pet (Vacinas, Histórico Médico, Pedigree) deve referenciar `id_pet`, nunca `id_tutor` diretamente.
- Pais de um pet podem ser cadastrados no sistema ou informados como animais avulsos.
- A entidade Veterinarios possui cadastro próprio e tela própria no sistema, diferente da tela de Tutor.
- A funcionalidade de QR Code não faz parte da implementação atual e fica reservada para etapa futura.

## 12. Validação das decisões da equipe

As pendências levantadas anteriormente foram definidas pela equipe:

1. **Pedigree:** pai e mãe podem ser avulsos, sem cadastro no sistema. Quando estiverem cadastrados, poderão ser relacionados por `id_pai` e `id_mae`; quando não estiverem, seus nomes poderão ser registrados.
2. **Cartão Animal:** o campo `microchip` será implementado em Pets e será criada a entidade **Veterinarios**, pois o veterinário terá uma tela própria no sistema, diferente da tela de Tutor. O Cartão Animal poderá utilizar essas informações.
3. **QR Code:** a funcionalidade de QR Code não será implementada nesta etapa. Portanto, a definição dos dados que seriam exibidos publicamente fica para uma etapa futura.

Com essas decisões, o levantamento encontra-se validado para servir de base à criação do DER.
