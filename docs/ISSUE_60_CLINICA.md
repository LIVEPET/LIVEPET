# Issue #60 — Pacientes, agenda e atendimentos

O backend usa FastAPI, SQLAlchemy e a tabela existente `clinic_appointments`,
com chaves estrangeiras para `clinics` e `pets`. Nenhuma migração é necessária:
o modelo e o DDL de `backend/sql/schema.sql` já contêm os campos utilizados.

Todas as rotas abaixo exigem Bearer JWT com `role=clinic`. Os prefixos
`/api/clinicas`, `/api/v1/clinicas` e `/clinicas` são equivalentes.

| Método e caminho relativo | Comportamento |
| --- | --- |
| `GET /pacientes` | Lista local compatível com o frontend, com todos os atendimentos no histórico |
| `GET /pacientes?cadastrados=true` | Catálogo dos pets oficiais, inclusive sem atendimento; `id` é o ID de `pets` |
| `GET /pacientes/{pet_id}` | Dados do pet; prontuário do tutor somente após aprovação do vínculo |
| `GET /pacientes/{pet_id}/atendimentos` | Histórico completo daquele pet na clínica autenticada, mais recente primeiro |
| `POST /pacientes/{pet_id}/atendimentos` | Cria atendimento vinculado; exige aprovação do tutor |
| `GET /agendamentos` | Agenda da clínica; filtros opcionais `data=AAAA-MM-DD` e `status` |
| `POST /agendamentos` | Cadastra agendamento, com `pet_id` opcional |
| `PUT /agendamentos/{id}` | Edita somente os campos enviados |
| `DELETE /agendamentos/{id}` | Exclui agendamento da própria clínica; retorna 204 |
| `PATCH /agendamentos/{id}/status` | Altera estado do atendimento |

As rotas `/atendimentos` continuam disponíveis e aceitam as mesmas operações.
Os IDs da lista local `/pacientes` continuam sendo IDs de atendimentos, usados
pelos antigos PUT/DELETE de pacientes; não devem ser confundidos com `pet_id`.
O catálogo não expõe token público, senha, e-mail nem prontuário do tutor.
Sem vínculo aprovado, o detalhe retorna `medical_records: []`.
O fluxo existente `POST /solicitar-vinculo` e a aprovação pelo tutor permanecem.

Exemplo de criação (data omitida assume hoje):

```json
{"pet_name":"Luna","species":"Gato","tutor":"Tutor","phone":"11999999999","service":"Consulta","date":"2026-10-28","time":"09:30","pet_id":1}
```

Campos clínicos enviados, como `peso`, `diagnostico` e `prescricao`, também são
persistidos. `pet_id` deve existir e ter vínculo aprovado com a clínica.
Estados aceitos: `Confirmado`, `Aguardando`, `Em atendimento`, `Concluído`,
`Cancelado`. Datas, horários HH:MM e campos obrigatórios são validados com 422.
Recursos inexistentes ou pertencentes a outra clínica retornam 404.

Validação: `python -m pytest backend/tests -q`. Os testes específicos aceitam
`CLINIC_TEST_DATABASE_URL=postgresql+psycopg://...` e criam um schema aleatório
isolado, removido ao final, sem usar tabelas existentes. Executar com
`python -m pytest backend/tests/test_clinic_patients.py -q`.

A implementação exige revisão e homologação da equipe. Testes automatizados
não substituem o aceite humano. Não realizar merge antes da autorização.
