# Issue #61 — Autenticação da clínica

O login, cadastro, logout e a proteção inicial já existiam no commit
[`24ae735`](https://github.com/LIVEPET/LIVEPET/commit/24ae735), de Gabriel Marcolino,
vinculado à #39. Esta entrega complementa essa base em uma branch própria,
independente do PR #137 da #60; nenhum merge é necessário para testá-la.

O `ClinicAuthProvider` centraliza a sessão. O login envia e-mail normalizado e
`senha` a `POST /api/clinicas/login`. Ao restaurar a sessão ou entrar, o frontend
valida o token em `GET /api/clinicas/perfil` antes de liberar as páginas internas.
A leitura de `role` e `exp` no JWT serve apenas para expiração local; a API
continua responsável pela assinatura e autorização. Tokens inválidos, expirados
ou rejeitados com 401/403 redirecionam para `/clinica/entrar`.

Falhas de rede mantêm a área bloqueada com opção de tentar novamente ou sair.
O login volta à página interna solicitada, preservando filtros e fragmento.
Logout desktop/mobile, expiração e logout em outra aba limpam a sessão clínica.
Erros 401 da clínica não apagam a sessão do tutor. Respostas antigas não podem
recriar o perfil nem os dados de uma clínica após logout ou troca de conta.

Validar com `npm test`, `npm run lint` e `npm run build`. Neste workspace,
o lint requer `--ignore-pattern '**/.pytest_cache/**' --ignore-pattern '**/.venv/**'`
para não ler caches Python sem permissão. O lockfile da main já tem jsdom
incompatível; a instalação local usada foi `npm install --no-save --no-package-lock
--legacy-peer-deps @testing-library/dom@^10.0.0`, sem alterar os manifests.

Homologação manual: abrir uma rota interna sem login; entrar com senha incorreta
e depois correta; recarregar; sair pelo desktop e pelo menu móvel; testar logout
em outra aba e sessão expirada. Conferir a interface em 375 px. A equipe deve
homologar e revisar o código antes de autorizar qualquer merge.

Validação no Chrome em 375 px: erro de credenciais, entrada na Agenda e logout
pelo menu móvel aprovados; largura do documento igual à viewport, sem rolagem
horizontal. A suíte completa apresentou as mesmas 5 falhas também reproduzidas
na `main`, nos testes de perfil/equipe e preview de prescrição. Não são falhas
da autenticação; os testes específicos da sessão passaram.
