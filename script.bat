REM =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
REM se você está no Windows execute este script com o comando:
REM .\script.bat na raíz do projeto para iniciar a aplicação
REM =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

@echo off
cd /d"%~dp0"

cd backend
start /b cmd /c "call venv\Scripts\activate && uvicorn main:app --reload"

cd ../frontend
npm run dev
