# Dockerfile da API do LivePet
# Trabalho de PI

FROM python:3.12

# Entra na pasta do projeto
WORKDIR /app

# Copia o requirements e instala as coisas
COPY backend/requirements.txt /app/requirements.txt
RUN pip install -r requirements.txt

# Copia o codigo do backend
COPY backend/ /app/

# Porta do fastapi
EXPOSE 8000

# Roda o servidor da api
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
