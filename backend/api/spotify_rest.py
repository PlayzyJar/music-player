from typing import Dict, List, Optional

import requests


def get_access_token(client_id: str, client_secret: str) -> Optional[str]:
    """
    Obtains a Spotify Client Credentials access token.
    Returns the token string on success or None on failure.
    """
    TOKEN_URL = "https://accounts.spotify.com/api/token"
    try:
        resp = requests.post(
            TOKEN_URL,
            data={"grant_type": "client_credentials"},
            auth=(client_id, client_secret),
            timeout=10,
        )
        resp.raise_for_status()
        body = resp.json()
        return body.get("access_token")
    except Exception as exc:
        # Simple logging for development. In production use structured logging.
        print("[api_functions.get_access_token] error:", exc)
        return None


def search_for_tracks(
    track_alias: str, access_token: Optional[str], limit: int = 5, offset: int = 0
) -> List[Dict]:
    """
    Search tracks on Spotify and return a simplified list of tracks.

    - If `access_token` is falsy, returns [].
    - Uses the Spotify Search API and returns a list of dicts with keys:
      id, name, artist, image, preview, spotifyUrl
    """
    if not access_token:
        return []

    url = "https://api.spotify.com/v1/search"
    headers = {"Authorization": f"Bearer {access_token}"}
    # Use `track:...` to prioritize track name search while allowing the caller to pass any raw query.
    params = {
        "q": f"track:{track_alias}",
        "type": "track",
        "limit": str(limit),
        "offset": str(offset),
    }

    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        print("[api_functions.search_for_tracks] request error:", exc)
        return []

    items = data.get("tracks", {}).get("items", [])
    simplified: List[Dict] = []

    for item in items:
        simplified.append(
            {
                "id": item.get("id"),
                "name": item.get("name"),
                "artist": ", ".join(
                    a.get("name") for a in item.get("artists", []) if a.get("name")
                ),
                "image": (item.get("album", {}).get("images") or [{}])[0].get("url"),
                "preview": item.get("preview_url"),
                "spotifyUrl": item.get("external_urls", {}).get("spotify"),
            }
        )

    return simplified
