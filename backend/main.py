import asyncio
import os
from contextlib import asynccontextmanager
from typing import Union

import requests
from api.api_functions import get_access_token, search_for_tracks
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tenta adquirir token inicial
    token = get_access_token(client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
    app.state.spotify_token = token

    if token:
        print("token adquirido com sucesso! (len={})".format(len(token)))
    else:
        print(
            "Falha ao adquirir token durante startup. Verifique CLIENT_ID/CLIENT_SECRET e conectividade."
        )

    # inicia tarefa de background para renovação do token e guarda referência para cancelar no shutdown
    try:
        app.state._spotify_refresher_task = asyncio.create_task(refresh_token(app))
        print("tarefa de renovação de token iniciada.")
    except Exception as exc:
        print("Não foi possível iniciar tarefa de renovação de token:", exc)

    try:
        yield
    finally:
        print(
            "servidor encerrado... finalizando tarefa de renovação de token se existente."
        )
        task = getattr(app.state, "_spotify_refresher_task", None)
        if task:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass


async def refresh_token(app: FastAPI):
    """
    Loop que renova o token periodicamente. A função pode ser cancelada quando o
    servidor estiver encerrando (a tarefa é guardada em app.state._spotify_refresher_task).
    """
    try:
        while True:
            # aguarda ~55 minutos (3300s) antes de renovar
            await asyncio.sleep(3300)

            try:
                new_token = get_access_token(
                    client_id=CLIENT_ID, client_secret=CLIENT_SECRET
                )
                app.state.spotify_token = new_token
                if new_token:
                    print("spotify token renovado! (len={})".format(len(new_token)))
                else:
                    print(
                        "Falha ao renovar token do Spotify: token retornado é vazio/None."
                    )
            except Exception as exc:
                print("Exceção ao renovar token do Spotify:", exc)
    except asyncio.CancelledError:
        print("Tarefa de renovação de token cancelada.")
        raise


app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ou "http://localhost:3000"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/token")
def get_token(request: Request):
    """
    Rota simples de debugging: informa se existe token e um preview (não expõe token completo).
    Em produção, remova ou proteja essa rota.
    """
    token = request.app.state.spotify_token
    if isinstance(token, str) and token:
        preview = token[:10] + "..." if len(token) > 10 else token
    else:
        preview = None
    return {"token_present": bool(token), "token_preview": preview}


@app.get("/search")
def search_musics(q: str):
    """
    Endpoint de busca. Se não tivermos um token válido, retorna [] e loga para facilitar debug.
    """
    access_token = app.state.spotify_token

    if not access_token:
        print(f"/search chamado sem token válido. q={q!r}")
        # retorna array vazio (mesmo comportamento anterior), mas com log claro
        return []

    print(
        f"/search chamado q={q!r} usando token len={len(access_token) if isinstance(access_token, str) else 'NA'}"
    )
    return search_for_tracks(track_alias=q, access_token=access_token)
