"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import "./globals.css";

import OsuLogo from "../public/osu_logo.png";

type Track = {
  id?: string;
  name: string;
  artist?: string;
  image?: string | null;
  spotifyUrl?: string | null;
};

export default function HomePage(): JSX.Element {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const q = query.trim();
    // If the query is empty, ensure we show nothing and are not loading.
    if (q === "") {
      setResults([]);
      setLoading(false);
      return;
    }

    // Use an AbortController to cancel in-flight requests when query changes.
    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchData() {
      try {
        const res = await fetch(
          `http://localhost:8000/search?q=${encodeURIComponent(q)}`,
          { signal },
        );

        if (!res.ok) {
          console.error("Search request failed:", res.status);
          setResults([]);
          setLoading(false);
          return;
        }

        const data = await res.json().catch((err) => {
          console.error("Failed to parse JSON from /search:", err);
          return null;
        });

        if (!Array.isArray(data)) {
          console.warn("Unexpected /search response (expected array):", data);
          setResults([]);
        } else {
          setResults(data); // se der tudo certo, coloca o json dentro de results
        }
      } catch (err: any) {
        // If the fetch was aborted, ignore the error (it's expected when query changes).
        if (err.name === "AbortError") {
          return;
        }
        console.error("Error calling /search:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    fetchData();

    // Cleanup: abort the request when query changes or component unmounts.
    return () => {
      controller.abort();
    };
  }, [query]);

  return (
    <div className="font-torus justify-center flex flex-col gap-4 items-center w-screen h-screen text-slate-200 py-4">
      {/*barra de pesquisa*/}
      <input
        placeholder="O que você quer tocar?"
        className="search-bar"
        onChange={(e) => setQuery(e.target.value)}
      ></input>

      {/*área principal*/}
      <div className="w-3/8 h-9/10 rounded-md flex flex-col justify-start items-start bg-zinc-900">
        {/*resultados*/}
        {results.length > 0 && (
          <div className="w-full px-4 py-4 h-full flex flex-col justify-start items-center gap-1">
            <h1 className="py-2 px-2 font-semibold w-full text-4xl">Músicas</h1>
            {results.slice(0, 5).map((track, i) => (
              <div
                key={track.id ?? i}
                className="group relative hover:bg-zinc-800 transition ease-in-out duration-300 hover:scale-102 px-2 w-full h-25 rounded-md grid grid-cols-6 grid-rows-2 gap-2 justify-end items-center bg-zinc-900 text-zinc-100"
              >
                <div className="flex justify-center items-center row-span-2 col-1 relative overflow-hidden rounded-md">
                  <Image
                    className="group-hover:brightness-50 object-cover transition duration-200 group-hover:scale-102 group-hover: shadow-lg shadow-zinc-900 w-full h-auto row-span-2 col-1 rounded-md"
                    src={track.image}
                    alt={track.name}
                    width={100}
                    height={100}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const title = track.name ?? "";
                      const artist = track.artist ?? "";

                      const q = `?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;

                      router.push(`/osu_beatmaps${q}`);
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
                      className="transition hover:scale-115 focus:scale-98 ease-in-out duration-200 group-hover:scale-102"
                      src={OsuLogo}
                      alt="osu"
                      width={50}
                      height={50}
                    />
                  </button>
                </div>

                <div className="font-torus font-semibold flex text-xl truncate text-overflow-ellipsis row-1 justify-start items-end col-start-2 col-end-7 w-full h-full mx-2">
                  {track.name}
                </div>

                <div className="font-torus flex text-sm truncate text-overflow-ellipsis row-2 justify-start items-start col-start-2 col-end-7 w-full h-full mx-2">
                  {track.artist}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
