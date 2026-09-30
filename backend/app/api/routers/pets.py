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
from app.schemas.pet import (
    PetCreate,
    PetPublicResponse,
    PetResponse,
    PetUpdate,
)
from app.schemas.vaccine import VaccineCreate, VaccineResponse
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordResponse

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
    token_publico = pet_in.token_publico or uuid.uuid4().hex

    # Garante que o token_publico seja único
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

    # Coleta avisos médicos ou registros críticos do animal
    avisos = []
    if pet.medical_records:
        for r in pet.medical_records:
            if r.tipo and r.tipo.lower() in ["alergia", "doença crônica", "alerta", "urgente"]:
                avisos.append(f"{r.tipo}: {r.descricao}")
            elif r.descricao:
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
        "avisos_medicos": avisos_str,
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
