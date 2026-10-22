#!/usr/bin/env bash
# ==============================================================================
# LIVEPET - Seed de demonstração (Issue #96)
#
# Cria 3 tutores de demonstração e os pets de cada um usando a API REST.
# Pode ser executado várias vezes: tutores e pets já existentes são mantidos.
#
# Uso (Git Bash, Linux ou Mac):
#   SENHA_DEMO='SuaSenha123' bash scripts/seed-demo.sh
#
# Variáveis de ambiente:
#   SENHA_DEMO  (obrigatória) senha das 3 contas, com ao menos uma letra e um número
#   API_URL     (opcional)    padrão: https://livepet.onrender.com
#   FOTOS_URL   (opcional)    padrão: https://livepet-1.onrender.com/demo-pets
#
# Dependências: bash e curl.
# ==============================================================================
set -u

API_URL="${API_URL:-https://livepet.onrender.com}"
API_URL="${API_URL%/}"
FOTOS_URL="${FOTOS_URL:-https://livepet-1.onrender.com/demo-pets}"
FOTOS_URL="${FOTOS_URL%/}"
SENHA="${SENHA_DEMO:-}"

ok()    { printf '  [ok]    %s\n' "$*"; }
info()  { printf '  [info]  %s\n' "$*"; }
falha() { printf '  [erro]  %s\n' "$*" >&2; }

if [ -z "$SENHA" ]; then
  falha "Defina a senha: SENHA_DEMO='SuaSenha123' bash scripts/seed-demo.sh"
  exit 1
fi
if ! [[ "$SENHA" =~ [A-Za-z] && "$SENHA" =~ [0-9] && ${#SENHA} -ge 6 ]]; then
  falha "A senha precisa ter 6+ caracteres, com ao menos uma letra e um número."
  exit 1
fi
if ! command -v curl >/dev/null 2>&1; then
  falha "curl não encontrado."
  exit 1
fi

# Faz a requisição e preenche as variáveis globais STATUS e BODY.
# Uso: req METODO CAMINHO [JSON] [TOKEN]
req() {
  local metodo="$1" caminho="$2" dados="${3:-}" token="${4:-}"
  local args=(-sS --max-time 120 -X "$metodo" -H "Accept: application/json"
              -w $'\n%{http_code}')
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$dados" ] && args+=(-H "Content-Type: application/json" --data-binary "$dados")
  local resp
  resp="$(curl "${args[@]}" "$API_URL$caminho")" || { STATUS=000; BODY=""; return 1; }
  STATUS="${resp##*$'\n'}"
  BODY="${resp%$'\n'*}"
}

# Extrai um campo texto simples de um JSON (sem depender de jq).
campo() { printf '%s' "$1" | sed -n "s/.*\"$2\":\"\\([^\"]*\\)\".*/\\1/p"; }

# Escapa aspas e barras para inserir um texto do usuário dentro de JSON.
json_escape() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }
SENHA_JSON="$(json_escape "$SENHA")"

# ------------------------------------------------------------------------------
# Cenário da demonstração
# Pet: nome|espécie|raça|porte|sexo|cor|peso|nascimento|foto
# ------------------------------------------------------------------------------
TUTORES=(
  "Yasmim Viana|yasmim.viana@livepet.com.br|(62) 99100-0001"
  "Professor Artur|professor.artur@livepet.com.br|(62) 99100-0002"
  "João Victor|joao.victor@livepet.com.br|(62) 99100-0003"
)
PETS_0=("Thor|Cachorro|Labrador|Grande|Macho|Amarelo|30.5|2022-03-10|thor.jpg")
PETS_1=("Mel|Cachorro|SRD|Pequeno|Fêmea|Branca|3.2|2026-07-15|mel.jpg")
PETS_2=("Zeus|Cachorro|Mestiço de Pit Bull|Grande|Macho|Caramelo|28.0|2021-11-02|zeus.jpg")

echo ""
echo "LivePet - seed de demonstração"
echo "  API:   $API_URL"
echo "  Fotos: $FOTOS_URL"
echo ""

# A API no plano gratuito do Render hiberna; a primeira chamada pode levar ~1 min.
info "Acordando a API (pode levar até 1 minuto)..."
req GET /health
if [ "$STATUS" != "200" ]; then
  falha "API indisponível em $API_URL/health (HTTP $STATUS)."
  exit 1
fi
ok "API online"

ERROS=0
for i in "${!TUTORES[@]}"; do
  IFS='|' read -r NOME EMAIL TELEFONE <<< "${TUTORES[$i]}"
  echo ""
  printf 'Tutor %d de %d: %s <%s>\n' "$((i + 1))" "${#TUTORES[@]}" "$NOME" "$EMAIL"

  # 1. Cadastro (400 = e-mail já cadastrado, segue para o login)
  req POST /api/v1/auth/register \
    "{\"nome\":\"$NOME\",\"email\":\"$EMAIL\",\"senha\":\"$SENHA_JSON\",\"telefone\":\"$TELEFONE\"}"
  case "$STATUS" in
    201) ok "conta criada" ;;
    400) info "conta já existia" ;;
    429) falha "limite de cadastros atingido, aguarde 10 minutos"; ERROS=$((ERROS + 1)); continue ;;
    *)   falha "cadastro recusado (HTTP $STATUS): $BODY"; ERROS=$((ERROS + 1)); continue ;;
  esac

  # 2. Login
  req POST /api/v1/auth/login "{\"email\":\"$EMAIL\",\"senha\":\"$SENHA_JSON\"}"
  TOKEN="$(campo "$BODY" access_token)"
  if [ "$STATUS" != "200" ] || [ -z "$TOKEN" ]; then
    falha "login falhou (HTTP $STATUS). Se a conta já existia, a senha é diferente de SENHA_DEMO."
    ERROS=$((ERROS + 1))
    continue
  fi
  ok "login realizado"

  # Cidade exibida nos cards dos pets
  req PUT /api/v1/auth/me "{\"cidade\":\"Goiânia\",\"estado\":\"GO\"}" "$TOKEN"
  [ "$STATUS" = "200" ] && ok "perfil atualizado (Goiânia, GO)" || info "perfil não atualizado (HTTP $STATUS)"

  # 3. Pets que o tutor já tem, para não duplicar
  req GET /api/v1/pets "" "$TOKEN"
  PETS_EXISTENTES="$BODY"

  # 4. Cadastro dos pets
  eval "LISTA=(\"\${PETS_$i[@]}\")"
  for PET in "${LISTA[@]}"; do
    IFS='|' read -r P_NOME P_ESPECIE P_RACA P_PORTE P_SEXO P_COR P_PESO P_NASC P_FOTO <<< "$PET"
    if printf '%s' "$PETS_EXISTENTES" | grep -q "\"nome\":\"$P_NOME\""; then
      info "pet $P_NOME já existia"
      continue
    fi
    req POST /api/v1/pets "{\"nome\":\"$P_NOME\",\"especie\":\"$P_ESPECIE\",\"raca\":\"$P_RACA\",\"porte\":\"$P_PORTE\",\"sexo\":\"$P_SEXO\",\"cor\":\"$P_COR\",\"peso\":$P_PESO,\"data_nascimento\":\"$P_NASC\",\"foto_url\":\"$FOTOS_URL/$P_FOTO\"}" "$TOKEN"
    if [ "$STATUS" = "201" ]; then
      ok "pet $P_NOME cadastrado com foto"
    else
      falha "pet $P_NOME recusado (HTTP $STATUS): $BODY"
      ERROS=$((ERROS + 1))
    fi
  done
done

echo ""
if [ "$ERROS" -eq 0 ]; then
  echo "Concluído sem erros. Entre em https://livepet-1.onrender.com/login com cada e-mail acima."
else
  echo "Concluído com $ERROS erro(s). Veja as mensagens [erro] acima."
  exit 1
fi
