# 🐾 LivePet - Plataforma Integrada para Pets e Tutores

O **LivePet** é uma aplicação web completa desenvolvida como Projeto Integrador, com o objetivo de centralizar os cuidados, saúde, conexões e benefícios de animais de estimação em uma única plataforma interativa e de alta usabilidade.

---

## 🛠️ Tecnologias Utilizadas

O projeto utiliza um conjunto de tecnologias modernas e integradas de forma robusta:

*   **Frontend**: [React.js](https://react.dev/) (v18) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/) (bundler de alta performance).
*   **Estilização e Componentes**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) (baseado em [Radix UI](https://www.radix-ui.com/)) + [Lucide React](https://lucide.dev/) (ícones).
*   **Gerenciamento de Estado e Rotas**: [React Router DOM](https://reactrouter.com/) (roteamento SPA) + [TanStack React Query](https://tanstack.com/query) (gerenciamento e sincronização de dados com cache).
*   **Backend & Banco de Dados**: [Supabase](https://supabase.com/) (Banco PostgreSQL escalável com suporte nativo a migrações e autenticação segura).
*   **Geração de Documentos e Mídia**:
    *   `jsPDF`: Geração e exportação dos cartões de identificação e históricos em PDF.
    *   `qrcode.react`: Criação de QR Codes únicos para identificação rápida de cada animal.
    *   `recharts`: Exibição de gráficos de controle de peso e métricas de saúde.

---

## 🚀 Funcionalidades Principais

*   **Dashboard de Pets** (`/pets`): Painel de gerenciamento onde o usuário visualiza seus pets cadastrados, checa alertas de vacinas, e acessa o perfil de cada animal.
*   **Histórico Médico** (`/historico-medico`): Registro detalhado de exames, consultas veterinárias e controle de peso (com gráficos de evolução histórica), além de calendário de vacinação atualizado.
*   **MatchPet** (`/matchpet`): Um sistema de encontros estilo "Tinder" para pets, voltado para cruzamento responsável ou adoção. Calcula a compatibilidade entre os animais baseando-se em temperamento, idade e dados genéticos, além de oferecer simulação de chat integrado entre tutores.
*   **Árvore de Pedigree** (`/pedigree`): Construtor de árvore genealógica de até três gerações, acompanhado de um validador de certificados de pedigree.
*   **Cartão de Identificação Digital** (`/cartao`): Emissão de um documento estético do pet (semelhante a um RG ou crachá), com QR Code escaneável integrado, exportável em imagem ou PDF.
*   **Gerenciador de Tarefas** (`/tasks`): Ferramenta para gerenciar lembretes e tarefas diárias de cuidados do pet (alimentação, passeios, banho, remédios).
*   **Rede de Parcerias** (`/parcerias`): Integração de clínicas veterinárias, petshops e prestadores de serviço com oferta de cupons de descontos para os usuários.
*   **Autenticação Completa** (`/login`): Sistema de login e cadastro seguro integrado ao Supabase Auth.

---

## 📂 Estrutura do Projeto

```text
├── supabase/                 # Migrações SQL e arquivos de configuração do banco
├── src/
│   ├── assets/               # Imagens e recursos visuais estáticos
│   ├── components/           # Componentes reutilizáveis (layouts, cabeçalho, popups)
│   │   └── ui/               # Componentes atômicos do Shadcn UI
│   ├── hooks/                # Hooks customizados do React (ex: uso de responsividade)
│   ├── integrations/         # Configuração e tipos do cliente Supabase
│   ├── lib/                  # Utilitários globais do projeto (ex: cn helper)
│   ├── pages/                # Páginas principais da aplicação (views)
│   ├── App.tsx               # Roteador central e provedores de contexto
│   └── main.tsx              # Ponto de entrada do React
├── package.json              # Script e dependências do Node
└── vite.config.ts            # Configuração do Vite
```

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos

Certifique-se de ter instalado o [Node.js](https://nodejs.org/) (versão 18+) ou o runtime [Bun](https://bun.sh/).

### Instalação de Dependências

Clone este repositório no seu computador e execute no terminal dentro do diretório:

```bash
# Caso utilize npm:
npm install

# Caso utilize bun:
bun install
```

### Executando em Modo de Desenvolvimento

Para iniciar o servidor local de desenvolvimento:

```bash
# Com npm:
npm run dev

# Com bun:
bun run dev
```

Abra o endereço exibido no terminal (geralmente `http://localhost:5173`) no seu navegador.

### Gerando o Build para Produção

Para testar o build final otimizado da aplicação:

```bash
# Com npm:
npm run build

# Com bun:
bun run build
```

---

## 🧪 Rodando os Testes

O projeto conta com testes unitários utilizando o **Vitest**:

```bash
# Executar testes uma única vez:
npm run test / bun run test

# Executar em modo de monitoramento (watch):
npm run test:watch / bun run test:watch
```
