import os
from typing import Dict, List, Optional

import requests
from dotenv import load_dotenv

load_dotenv()

OSU_CLIENT_ID = os.getenv("OSU_CLIENT_ID")
OSU_CLIENT_SECRET = os.getenv("OSU_CLIENT_SECRET")


def get_osu_access_token(client_id: str, client_secret: str) -> Optional[str]:
    """
    Obtains a OSU Client Credentials access token.
    Returns the token string on success or None on failure.
    """

    TOKEN_URL = "https://osu.ppy.sh/oauth/token"

    try:
        resp = requests.post(
            TOKEN_URL,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "scope": "public",
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
            },
            timeout=10,
        )

        resp.raise_for_status()

        body = resp.json()

        return body.get("access_token")

    except Exception as exc:
        # Simple logging for development. In production use structured logging.
        print("[api_functions.get_osu_access_token] error:", exc)
        return None


def search_osu_beatmaps(
    track: str, artist: str, access_token: Optional[str], limit: int = 5
) -> List[Dict]:
    """
    Search beatmaps on osu!and return a simplified list of tracks.

    - If `access_token` is false, returns [].
    - Uses the beatmapsets search API and returns a list of dicts with keys:
      id, title, artist, image, preview, spotifyUrl
    """
    if not access_token:
        return []

    url = "https://osu.ppy.sh/api/v2/beatmapsets/search"

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {access_token}",
    }

    params = {"q": track}

    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        print("[api_functions.search_osu_beatmaps] request error:", exc)
        return []

    beatmaps = data["beatmapsets"]

    simplified_beatmaps: List[Dict] = []

    for beatmap in beatmaps:
        simplified_beatmaps.append(
            {
                "download_url": f"https://osu.ppy.sh/beatmapsets/{beatmap['beatmaps'][0]['beatmapset_id']}/download",
                "title": beatmap["title"],
                "artist": beatmap["artist"],
                "creator": beatmap["creator"],
                "play_count": beatmap["play_count"],
                "image": beatmap["covers"]["list"],
                "last_updated": beatmap["last_updated"],
                "preview_url": beatmap["preview_url"],
            }
        )

        if len(simplified_beatmaps) >= limit:
            break

    simplified_beatmaps.sort(key=lambda x: x["play_count"], reverse=True)

    return simplified_beatmaps
