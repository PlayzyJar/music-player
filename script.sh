#!/bin/bash

# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# Se você está no Linux execute este script com:
# ./script.sh na raiz do projeto para iniciar a aplicação
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

# Garante que o script execute sempre no diretório onde ele está
cd "$(dirname "$0")"

# Inicia o backend
(
  cd backend || exit
  source venv/bin/activate
  uvicorn main:app --reload &
)

# Inicia o frontend
cd frontend || exit
npm run dev
