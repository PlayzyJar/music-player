"use client";

import React, { useState, useCallback, useEffect } from "react";

type Track = {
  id?: string;
  name: string;
  artist?: string;
  image?: string | null;
  preview?: string | null;
  spotifyUrl?: string | null;
};

export default function HomePage(): JSX.Element {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA="; // 1x1 transparent gif

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
          setResults(data);
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
    <main className="flex flex-col items-center gap-6 w-full max-w-md p-6">
      <div className="w-full flex gap-3">
        <input
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Pesquisar música"
          className="flex-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          type="text"
          placeholder="Digite o nome da música..."
          value={query}
        />
      </div>

      {/* RESULTADOS DA PESQUISA */}
      <div className="results">
        {results.length === 0 && !loading
          ? null
          : results.map((track) => (
              <div
                key={track.id ?? `${track.name}-${track.artist ?? ""}`}
                className="track"
                role="button"
                tabIndex={0}
                onClick={() => {
                  // redireciona para a rota de beatmaps passando title e artist como query params
                  const title = track.name ?? "";
                  const artist = track.artist ?? "";
                  const q = `?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
                  window.location.href = `/osu_beatmaps${q}`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const title = track.name ?? "";
                    const artist = track.artist ?? "";
                    const q = `?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
                    window.location.href = `/osu_beatmaps${q}`;
                  }
                }}
              >
                <img
                  className="track-image"
                  src={track.image ?? PLACEHOLDER}
                  alt={track.name ?? "Capa da música"}
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    if (el.src !== PLACEHOLDER) el.src = PLACEHOLDER;
                  }}
                />

                <div className="track-info">
                  <div className="track-name" title={track.name}>
                    {track.name}
                  </div>
                  <div className="track-artist" title={track.artist}>
                    {track.artist ?? "Artista desconhecido"}
                  </div>
                </div>
              </div>
            ))}
      </div>
    </main>
  );
}
