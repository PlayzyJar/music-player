import asyncio
import os
from contextlib import asynccontextmanager
from typing import Union

import requests
from api.osu_rest import get_osu_access_token, search_osu_beatmaps
from api.spotify_rest import get_spotify_access_token, search_for_tracks
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from requests.models import LocationParseError

load_dotenv()

# carregando client_id e client_secret do spotify do .env
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

# carregando client_id e client_secret do osu! do .env
OSU_CLIENT_ID = os.getenv("OSU_CLIENT_ID")
OSU_CLIENT_SECRET = os.getenv("OSU_CLIENT_SECRET")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ================== token spotify ==================
    # Tenta adquirir token do spotify
    spotify_token = get_spotify_access_token(
        client_id=SPOTIFY_CLIENT_ID, client_secret=SPOTIFY_CLIENT_SECRET
    )

    app.state.spotify_token = spotify_token

    if spotify_token:
        print(
            f"token do spotify adquirido com sucesso! (spotify_len={len(spotify_token)})"
        )
    else:
        print(
            "Falha ao adquirir token durante startup. Verifique CLIENT_ID/CLIENT_SECRET e conectividade."
        )

    # ================== token osu! ==================

    # Tenta adquirir token do osu!
    osu_token = get_osu_access_token(
        client_id=OSU_CLIENT_ID, client_secret=OSU_CLIENT_SECRET
    )

    app.state.osu_token = osu_token

    if osu_token:
        print(f"token do osu! adquirido com sucesso! (osu_len={len(osu_token)})")
    else:
        print(
            "Falha ao adquirir token durante startup. Verifique CLIENT_ID/CLIENT_SECRET e conectividade."
        )

    # inicialização de tarefas para renovação de tokens
    # ================== refresh spotify ==================
    try:
        app.state._spotify_refresher_task = asyncio.create_task(
            refresh_spotify_token(app)
        )
        print("tarefa de renovação de token spotify iniciada.")
    except Exception as exc:
        print("Não foi possível iniciar tarefa de renovação de token:", exc)

    # ================== refresh osu! ==================

    try:
        app.state._osu_refresher_task = asyncio.create_task(refresh_osu_token(app))
        print("tarefa de renovação de token osu! iniciada.")
    except Exception as exc:
        print("Não foi possível iniciar tarefa de renovação de token:", exc)

    # a partir daqui é a execução do programa e fim dele (yield)

    try:
        yield
    finally:
        print(
            "servidor encerrado... finalizando tarefa de renovação de token se existente."
        )

        # finalizando task de renovação de token spotify
        task_01 = getattr(app.state, "_spotify_refresher_task", None)

        if task_01:
            task_01.cancel()
            try:
                await task_01
            except asyncio.CancelledError:
                pass

        # finalizando task de renovação de token osu!
        task_02 = getattr(app.state, "_osu_refresher_task", None)

        if task_02:
            task_02.cancel()
            try:
                await task_02
            except asyncio.CancelledError:
                pass


async def refresh_spotify_token(app: FastAPI):
    """
    Loop que renova o token periodicamente. A função pode ser cancelada quando o
    servidor estiver encerrando (a tarefa é guardada em app.state._spotify_refresher_task).
    """
    try:
        while True:
            # aguarda ~55 minutos (3300s) antes de renovar
            await asyncio.sleep(3300)

            try:
                new_token = get_spotify_access_token(
                    client_id=SPOTIFY_CLIENT_ID, client_secret=SPOTIFY_CLIENT_SECRET
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


async def refresh_osu_token(app: FastAPI):
    """
    Loop que renova o token periodicamente. A função pode ser cancelada quando o
    servidor estiver encerrando (a tarefa é guardada em app.state._osu_refresher_task).
    """
    try:
        while True:
            # aguarda ~23h e 55 minutos (86100s) antes de renovar
            await asyncio.sleep(86100)

            try:
                new_token = get_osu_access_token(
                    client_id=OSU_CLIENT_ID, client_secret=OSU_CLIENT_SECRET
                )
                app.state.osu_token = new_token

                if new_token:
                    print("OSU! token renovado! (len={})".format(len(new_token)))
                else:
                    print(
                        "Falha ao renovar token do OSU!: token retornado é vazio/None."
                    )
            except Exception as exc:
                print("Exceção ao renovar token do OSU!:", exc)
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


@app.get("/spotify_token")
def get_spotify_token(request: Request):
    """
    Rota simples de debugging: informa se existe token e um preview (não expõe token completo).
    Em produção, remova ou proteja essa rota.
    """
    spotify_token = request.app.state.spotify_token

    if isinstance(spotify_token, str) and spotify_token:
        preview = (
            spotify_token[:10] + "..." if len(spotify_token) > 10 else spotify_token
        )
    else:
        preview = None
    return {"token_present": bool(spotify_token), "token_preview": preview}


@app.get("/osu_token")
def get_osu_token(request: Request):
    """
    Rota simples de debugging: informa se existe token e um preview (não expõe token completo).
    Em produção, remova ou proteja essa rota.
    """

    osu_token = request.app.state.osu_token

    if isinstance(osu_token, str) and osu_token:
        preview = osu_token[:10] + "..." if len(osu_token) > 10 else osu_token
    else:
        preview = None
    return {"token_present": bool(osu_token), "token_preview": preview}


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


@app.get("/osu_beatmaps")
def search_beatmaps(track: str, artist: str):
    """
    Endpoint de busca de beatmaps do osu!.
    """

    access_token = app.state.osu_token

    if not access_token:
        print(f"/search chamado sem token válido. q={track!r}")
        # retorna array vazio (mesmo comportamento anterior), mas com log claro
        return []

    print(
        f"/search chamado track={track!r} artist={artist!r} usando token len={len(access_token) if isinstance(access_token, str) else 'NA'}"
    )

    return search_osu_beatmaps(track=track, artist=artist, access_token=access_token)
