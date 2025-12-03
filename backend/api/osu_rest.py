import os
from typing import Dict, List

import requests
from dotenv import load_dotenv
from ossapi import Ossapi

load_dotenv()

OSU_CLIENT_ID = os.getenv("OSU_CLIENT_ID")
OSU_CLIENT_SECRET = os.getenv("OSU_CLIENT_SECRET")

# create a new client at https://osu.ppy.sh/home/account/edit#oauth
api = Ossapi(OSU_CLIENT_ID, OSU_CLIENT_SECRET)

# see docs for full list of endpoints
print(api.user("PlayzyART").id)
print(api.user(29214575, mode="osu").username)
print(api.beatmap(221777).id)


def lookup_osu_beatmap(query: str, api: Ossapi) -> List[Dict]:
    """
    Endpoint de busca de beatmaps do osu!.
    """

    results = set(api.search_beatmapsets(query=query, mode=0))

    print(results)

    return api.search_beatmapsets(query=query, mode=0)
