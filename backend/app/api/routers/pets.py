import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.pet import Pet
from app.models.user import User
from app.models.vaccine import Vaccine
from app.models.medical_record import MedicalRecord
from app.models.care_contact import CareContact
from app.schemas.pet import (
    PetCreate,
    PetExploreResponse,
    PetPublicResponse,
    PetResponse,
    PetUpdate,
)
from app.schemas.vaccine import VaccineCreate, VaccineResponse
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordResponse
from app.schemas.care_contact import CareContactCreate, CareContactResponse

router = APIRouter(tags=["Pets"])


@router.post(
    "/pets",
    response_model=PetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar um novo pet para o tutor autenticado",
)
def create_pet(
    pet_in: PetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cadastra um novo animal vinculado automaticamente ao ID do tutor autenticado no token.
    Gera um identificador único seguro (token_publico) para geração de QR Code.
    """
    # Gera sempre no servidor um token de alta entropia para o QR Code
    token_publico = uuid.uuid4().hex
    while db.query(Pet).filter(Pet.token_publico == token_publico).first():
        token_publico = uuid.uuid4().hex

    pet = Pet(
        user_id=current_user.id,
        nome=pet_in.nome,
        especie=pet_in.especie,
        raca=pet_in.raca,
        porte=pet_in.porte,
        sexo=pet_in.sexo,
        data_nascimento=pet_in.data_nascimento,
        cor=pet_in.cor,
        peso=pet_in.peso,
        foto_url=pet_in.foto_url,
        token_publico=token_publico,
    )

    db.add(pet)
    db.commit()
    db.refresh(pet)
    return pet


@router.get(
    "/pets",
    response_model=List[PetResponse],
    summary="Listar todos os pets do tutor autenticado",
)
def list_my_pets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retorna exclusivamente a lista de animais pertencentes ao tutor logado.
    """
    pets = (
        db.query(Pet)
        .filter(Pet.user_id == current_user.id)
        .order_by(Pet.id.desc())
        .all()
    )
    return pets


@router.get(
    "/pets/explore",
    response_model=List[PetExploreResponse],
    summary="Listar pets da comunidade disponíveis para match/descoberta",
)
def list_explore_pets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retorna exclusivamente pets de outros tutores (excluindo os pets pertencentes ao usuário logado).
    Garante que o tutor nunca veja ou dê match em seus próprios pets no MatchPet.
    """
    pets = (
        db.query(Pet)
        .filter(Pet.user_id != current_user.id)
        .order_by(Pet.id.desc())
        .all()
    )
    res = []
    for p in pets:
        tutor = p.tutor
        cidade_desc = None
        if tutor and tutor.cidade:
            cidade_desc = f"{tutor.cidade}, {tutor.estado}" if tutor.estado else tutor.cidade

        res.append(
            PetExploreResponse(
                id=p.id,
                user_id=p.user_id,
                nome=p.nome,
                especie=p.especie,
                raca=p.raca,
                porte=p.porte,
                sexo=p.sexo,
                data_nascimento=p.data_nascimento,
                cor=p.cor,
                peso=p.peso,
                foto_url=p.foto_url,
                token_publico=p.token_publico,
                tutor_id=tutor.id if tutor else 0,
                tutor_nome=tutor.nome if tutor else "Tutor LivePet",
                tutor_cidade=cidade_desc,
                tutor_telefone=tutor.telefone if tutor else None,
                vaccines=p.vaccines or [],
                medical_records=p.medical_records or [],
                lineage=p.lineage,
            )
        )
    return res


@router.get(
    "/pets/{pet_id}",
    response_model=PetResponse,
    summary="Consultar detalhes de um pet do tutor",
)
def get_pet(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retorna os detalhes de um pet específico.
    Impede que um usuário visualize o pet de outro tutor (retorna 404).
    """
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )

    if pet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado: este animal pertence a outro tutor.",
        )

    return pet


@router.put(
    "/pets/{pet_id}",
    response_model=PetResponse,
    summary="Atualizar dados de um pet",
)
def update_pet(
    pet_id: int,
    pet_in: PetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Atualiza parcialmente os dados do pet pertencente ao tutor logado.
    Impede que um usuário altere o pet de outro tutor (retorna 403).
    """
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )

    if pet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado: este animal pertence a outro tutor.",
        )

    update_data = pet_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pet, field, value)

    db.commit()
    db.refresh(pet)
    return pet


@router.delete(
    "/pets/{pet_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir um pet do tutor",
)
def delete_pet(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove o pet do sistema com exclusão em cascata de registros vinculados.
    Impede que um usuário remova o pet de outro tutor (retorna 403).
    """
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )

    if pet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado: este animal pertence a outro tutor.",
        )

    db.delete(pet)
    db.commit()
    return None


@router.get(
    "/public/pet/{token_publico}",
    response_model=PetPublicResponse,
    summary="Consulta pública de emergência via QR Code",
    tags=["Emergência / QR Code"],
)
def get_public_pet_emergency(
    token_publico: str,
    db: Session = Depends(get_db),
):
    """
    Rota pública aberta (sem necessidade de login) para leitura do QR Code.
    Retorna apenas os dados de emergência do animal:
    nome, foto, espécie, raça, porte, cor, telefone do tutor para contato e avisos médicos.
    """
    pet = db.query(Pet).filter(Pet.token_publico == token_publico).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal não encontrado para o código de QR Code fornecido.",
        )

    # Coleta vacinas registradas para comprovação de imunização (ex: raiva / antirrábica)
    vacinas = []
    if pet.vaccines:
        for v in pet.vaccines:
            vacinas.append({
                "nome": v.nome,
                "data_aplicacao": v.data_aplicacao,
                "proxima_dose": v.proxima_dose,
            })

    # Coleta exclusivamente avisos médicos vitais ou alergias críticas
    avisos = []
    if pet.medical_records:
        for r in pet.medical_records:
            tipo_lower = (r.tipo or "").lower()
            if any(term in tipo_lower for term in ["alergia", "doença crônica", "crônica", "cronica", "alerta", "urgente"]):
                avisos.append(f"{r.tipo}: {r.descricao}")

    avisos_str = " | ".join(avisos) if avisos else "Nenhum alerta médico crítico registrado."

    return {
        "nome": pet.nome,
        "especie": pet.especie,
        "raca": pet.raca,
        "porte": pet.porte,
        "sexo": pet.sexo,
        "cor": pet.cor,
        "peso": pet.peso,
        "foto_url": pet.foto_url,
        "token_publico": pet.token_publico,
        "tutor_nome": pet.tutor.nome if pet.tutor else "Tutor não identificado",
        "tutor_telefone": pet.tutor.telefone if pet.tutor else None,
        "vacinas_principais": vacinas,
        "avisos_medicos": avisos_str,
        "contatos_emergencia": [c for c in (pet.care_contacts or []) if c.categoria == "emergency"],
    }


@router.get(
    "/pets/{pet_id}/qrcode",
    summary="Obter link e metadados do QR Code do animal",
)
def get_pet_qrcode_data(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retorna a URL pública de emergência e informações para gravação do QR Code físico.
    """
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )

    if pet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado.",
        )

    public_scan_url = f"https://livepet-1.onrender.com/cartao?token={pet.token_publico}"
    api_emergency_url = f"https://livepet.onrender.com/api/v1/public/pet/{pet.token_publico}"

    return {
        "pet_id": pet.id,
        "nome": pet.nome,
        "token_publico": pet.token_publico,
        "public_scan_url": public_scan_url,
        "api_emergency_url": api_emergency_url,
    }


# ==========================================
# Endpoints de Vacinas (Issue #19)
# ==========================================


@router.post(
    "/pets/{pet_id}/vaccines",
    response_model=VaccineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar uma nova vacina para o pet",
)
def create_pet_vaccine(
    pet_id: int,
    vaccine_in: VaccineCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )
    if pet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado: este animal pertence a outro tutor.",
        )

    vaccine = Vaccine(
        pet_id=pet.id,
        nome=vaccine_in.nome,
        data_aplicacao=vaccine_in.data_aplicacao,
        proxima_dose=vaccine_in.proxima_dose,
        lote=vaccine_in.lote,
        veterinario=vaccine_in.veterinario,
    )
    db.add(vaccine)
    db.commit()
    db.refresh(vaccine)
    return vaccine


@router.get(
    "/pets/{pet_id}/vaccines",
    response_model=List[VaccineResponse],
    summary="Listar todas as vacinas do pet",
)
def list_pet_vaccines(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )
    if pet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado: este animal pertence a outro tutor.",
        )

    return (
        db.query(Vaccine)
        .filter(Vaccine.pet_id == pet_id)
        .order_by(Vaccine.data_aplicacao.desc())
        .all()
    )


@router.delete(
    "/pets/{pet_id}/vaccines/{vaccine_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir uma vacina do pet",
)
def delete_pet_vaccine(
    pet_id: int,
    vaccine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )
    if pet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado.",
        )

    vaccine = (
        db.query(Vaccine)
        .filter(Vaccine.id == vaccine_id, Vaccine.pet_id == pet_id)
        .first()
    )
    if not vaccine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacina não encontrada.",
        )

    db.delete(vaccine)
    db.commit()
    return None


# ==========================================
# Endpoints de Prontuário Médico (Issue #19)
# ==========================================


@router.post(
    "/pets/{pet_id}/medical-records",
    response_model=MedicalRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar consulta, exame ou peso no prontuário do pet",
)
def create_pet_medical_record(
    pet_id: int,
    record_in: MedicalRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )
    if pet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado: este animal pertence a outro tutor.",
        )

    record = MedicalRecord(
        pet_id=pet.id,
        tipo=record_in.tipo,
        descricao=record_in.descricao,
        peso_registrado=record_in.peso_registrado,
    )
    if record_in.data_registro:
        record.data_registro = record_in.data_registro

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get(
    "/pets/{pet_id}/medical-records",
    response_model=List[MedicalRecordResponse],
    summary="Listar histórico clínico cronológico do pet",
)
def list_pet_medical_records(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )
    if pet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado: este animal pertence a outro tutor.",
        )

    return (
        db.query(MedicalRecord)
        .filter(MedicalRecord.pet_id == pet_id)
        .order_by(MedicalRecord.data_registro.desc())
        .all()
    )


@router.delete(
    "/pets/{pet_id}/medical-records/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir um prontuário médico do pet",
)
def delete_pet_medical_record(
    pet_id: int,
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )
    if pet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado.",
        )

    record = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.id == record_id, MedicalRecord.pet_id == pet_id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro médico não encontrado.",
        )

    db.delete(record)
    db.commit()
    return None


@router.post(
    "/pets/{pet_id}/care-contacts",
    response_model=CareContactResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Adicionar contato de emergência ou cuidador para o pet",
)
def create_pet_care_contact(
    pet_id: int,
    contact_in: CareContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )
    if pet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado: este animal pertence a outro tutor.",
        )

    contact = CareContact(
        pet_id=pet_id,
        nome=contact_in.nome,
        funcao=contact_in.funcao,
        categoria=contact_in.categoria or "emergency",
        telefone=contact_in.telefone,
        email=contact_in.email,
        foto_url=contact_in.foto_url,
        relacao_tutor=contact_in.relacao_tutor,
        relacao_pet=contact_in.relacao_pet,
        nivel_vinculo=contact_in.nivel_vinculo or "Alto",
        observacoes=contact_in.observacoes,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.get(
    "/pets/{pet_id}/care-contacts",
    response_model=List[CareContactResponse],
    summary="Listar contatos da rede de cuidados e emergência do pet",
)
def list_pet_care_contacts(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )
    if pet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado: este animal pertence a outro tutor.",
        )

    return (
        db.query(CareContact)
        .filter(CareContact.pet_id == pet_id)
        .order_by(CareContact.criado_em.asc())
        .all()
    )


@router.delete(
    "/pets/{pet_id}/care-contacts/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover um contato de emergência ou cuidador do pet",
)
def delete_pet_care_contact(
    pet_id: int,
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )
    if pet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado.",
        )

    contact = (
        db.query(CareContact)
        .filter(CareContact.id == contact_id, CareContact.pet_id == pet_id)
        .first()
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contato não encontrado.",
        )

    db.delete(contact)
    db.commit()
    return None

