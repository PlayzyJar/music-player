"use client";

import React, { useState, useCallback } from "react";

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

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/search?q=${encodeURIComponent(q)}`,
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
    } catch (err) {
      console.error("Error calling /search:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <main className="flex flex-col items-center gap-6 w-full max-w-md p-6">
      <div className="w-full flex gap-3">
        <input
          aria-label="Pesquisar música"
          className="flex-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          type="text"
          placeholder="Digite o nome da música..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />

        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="w-[100px] p-3 rounded-xl bg-green-600 hover:bg-green-700 transition font-semibold disabled:opacity-60"
          aria-label="Buscar"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
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
                  if (track.spotifyUrl) {
                    // abre no Spotify em nova aba
                    window.open(track.spotifyUrl, "_blank", "noopener");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (track.spotifyUrl) {
                      window.open(track.spotifyUrl, "_blank", "noopener");
                    }
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
