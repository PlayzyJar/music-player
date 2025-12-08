"use client";

import React, { useRef, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowDown } from "@fortawesome/free-solid-svg-icons";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

import OsuLogo from "../../public/osu_logo.png";

type Beatmap = {
  download_url?: string;
  title?: string;
  artist?: string;
  creator?: string;
  play_count?: number;
  image?: any;
  last_updated?: string;
  preview_url?: string;
  [key: string]: any;
};

export default function Beatmaps() {
  const searchParams = useSearchParams();

  const title = searchParams.get("title") ?? "";
  const artist = searchParams.get("artist") ?? "";

  const [beatmaps, setBeatmaps] = useState<Beatmap[]>([]);
  const [loading, setLoading] = useState(false);

  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function handlePlay(id: number, url: string) {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;

    setPlayingId(id);

    audio.volume = 0.2;
    audio.play();

    audio.onended = () => setPlayingId(null);
  }

  useEffect(() => {
    async function fetchBeatmaps() {
      if (title === "" || artist === "") {
        setBeatmaps([]);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(
          `http://localhost:8000/osu_beatmaps?track=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
        );

        const data = await response.json();

        setBeatmaps(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchBeatmaps();
  }, [title, artist]);

  return (
    <div className="font-torus justify-center flex flex-col gap-4 items-center w-screen h-screen text-slate-200 py-4">
      {/*área principal*/}
      <div className="w-3/8 h-9/10 rounded-md flex flex-col justify-start items-start bg-zinc-900">
        {/*resultados*/}
        {beatmaps.length > 0 && (
          <div className="w-full px-4 py-4 h-full flex flex-col justify-center items-center gap-2">
            <h1 className="py-2 px-2 font-semibold w-full text-4xl">Beatmaps</h1>
            {beatmaps.slice(0, 5).map((beatmap, i) => (
              <div
                type="button"
                key={beatmap.id ?? i}
                className="group relative hover:bg-zinc-800 transition ease-in-out duration-300 hover:scale-102 px-1 py-2 w-full h-25 rounded-md grid grid-cols-5 grid-rows-1 gap-4 justify-end items-center bg-zinc-900 text-zinc-100"
              >
                <div className="flex justify-center w-full h-auto items-center row-span-5 col-1 relative overflow-hidden rounded-md">
                  <Image
                    className="group-hover:brightness-50 group-hover:blur-[2px] object-cover transition duration-200 group-hover:scale-105 group-hover: shadow-lg shadow-zinc-900 w-full h-auto rounded-md"
                    src={beatmap.image}
                    alt={beatmap.title}
                    width={150}
                    height={150}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      handlePlay(beatmap.id, beatmap.preview_url);
                    }}
                    className="
                    cursor-pointer
                    opacity-0 group-hover:opacity-100
                    transition-all duration-200
                    absolute text-white
                    p-2 rounded-full shadow-xl
                    scale-75 group-hover:scale-100
                  "
                  >
                    <Image
                      className={`transition ${playingId === beatmap.id ? "animate-spin" : ""} animate-none hover:scale-110 focus:scale-98 ease-in-out duration-200 group-hover:scale-102`}
                      src={OsuLogo}
                      alt="osu"
                      width={50}
                      height={50}
                    />
                  </button>
                </div>

                <div className="flex flex-col justify-start w-full h-auto items-start row-span-5 col-start-2 col-end-5">
                  <div className="flex justify-start w-full h-auto text-xl font-semibold truncate text-overflow-ellipsis row-span-1 col-start-2 col-end-7">
                    {beatmap.title}
                  </div>

                  <div className="flex w-full h-auto text-sm truncate text-overflow-ellipsis row-2 justify-start items-start col-start-2 col-end-7">
                    by {beatmap.artist}
                  </div>

                  <div className="flex w-full h-auto text-sm truncate text-overflow-ellipsis row-2 justify-start items-start col-start-2 col-end-7 text-zinc-400">
                    mapped by {beatmap.creator}
                  </div>
                </div>

                <div className="px-2 flex justify-end items-center col-5 row-span-5 text-zinc-400 w-full h-full">
                  <a
                    href={beatmap.download_url}
                    className="group/download relative flex justify-center items-center"
                    download={`${beatmap.title} - ${beatmap.artist} by ${beatmap.creator}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => console.log("Download", beatmap.downloadUrl)}
                  >
                    <div className="group-hover/download:opacity-100 group-hover/download:scale-105 rounded-sm transition-all ease-in-out duration-400 delay-400 absolute text-[12px] flex justify-center items-center opacity-0 peer-hover:opacity-100 text-slate-200  bg-zinc-900 shadow-md shadow-zinc-950 w-20 h-8 bottom-8">
                      download
                    </div>

                    <FontAwesomeIcon
                      className="transition hover:cursor-pointer  hover:text-zinc-300 ease-in-out duration-300 hover:scale-120 opacity-0 group-hover:opacity-100 group-hover:scale-105"
                      icon={faFileArrowDown}
                      size="lg"
                    />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
