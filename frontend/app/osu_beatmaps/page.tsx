"use client";

import React, { useEffect, useState } from "react";

type Beatmap = {
  title?: string;
  artist?: string;
  creator?: string;
  // the backend returns `image` (covers list) — it can be a string, an array or an object
  image?: any;
  preview_url?: string;
  play_count?: number;
  [key: string]: any;
};

export default function Page() {
  const [beatmaps, setBeatmaps] = useState<Beatmap[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackTitle, setTrackTitle] = useState<string | null>(null);
  const [trackArtist, setTrackArtist] = useState<string | null>(null);

  useEffect(() => {
    // read query params from the URL (e.g. ?title=...&artist=...)
    // This component runs client-side, so window is available.
    const params = new URLSearchParams(window.location.search);
    const title =
      params.get("title") || params.get("track") || params.get("trackTitle");
    const artist = params.get("artist") || params.get("trackArtist");

    setTrackTitle(title);
    setTrackArtist(artist);

    if (!title && !artist) {
      // No query to search; avoid fetching
      setBeatmaps([]);
      return;
    }

    const fetchBeatmaps = async () => {
      setLoading(true);
      setError(null);

      try {
        const q = new URLSearchParams();
        if (title) q.set("title", title);
        if (artist) q.set("artist", artist);

        // adjust endpoint if your backend uses a different path
        const res = await fetch(
          `http://localhost:8000/osu_beatmaps?q=${q.toString()}`,
          {
            headers: { Accept: "application/json" },
          },
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erro ao buscar beatmaps: ${res.status} ${text}`);
        }

        const data = (await res.json()) as Beatmap[];

        // defensive: ensure array
        const arr = Array.isArray(data) ? data : [];

        // Sort by play_count descending if present
        arr.sort((a, b) => {
          const pa = Number(a?.play_count ?? 0);
          const pb = Number(b?.play_count ?? 0);
          return pb - pa;
        });

        setBeatmaps(arr);
      } catch (err: any) {
        setError(err?.message ?? "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchBeatmaps();
  }, []);

  return (
    <div style={wrapper}>
      <div style={header}>
        <div>
          <h2 style={heading}>Resultados de beatmaps</h2>
          <p style={sub}>
            Buscando mapas correspondentes a:{" "}
            <strong>{trackTitle ?? "—"}</strong>
            {trackArtist ? (
              <span>
                {" "}
                • <em>{trackArtist}</em>
              </span>
            ) : null}
          </p>
        </div>

        <div style={controls}>
          <a href="/" style={backLink}>
            ← Voltar à pesquisa
          </a>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {loading && <div style={muted}>Carregando beatmaps…</div>}
        {error && <div style={errorStyle}>Erro: {error}</div>}
        {!loading && !error && beatmaps && beatmaps.length === 0 && (
          <div style={muted}>
            Nenhum beatmap encontrado para os parâmetros informados.
          </div>
        )}

        <div style={grid}>
          {beatmaps &&
            beatmaps.map((b) => (
              <article
                key={String(b.id ?? b.url ?? `${b.title}-${b.creator}`)}
                style={card}
              >
                <div style={coverWrap}>
                  {(() => {
                    // backend returns `image` which may be:
                    // - a string URL
                    // - an array of URLs
                    // - an object like { list: [...] } or other nested shapes
                    const imgField = b.image ?? b.cover_url ?? b.list;
                    let imageUrl: string | null = null;
                    if (!imgField) {
                      imageUrl = null;
                    } else if (typeof imgField === "string") {
                      imageUrl = imgField;
                    } else if (Array.isArray(imgField) && imgField.length) {
                      imageUrl =
                        typeof imgField[0] === "string" ? imgField[0] : null;
                    } else if (typeof imgField === "object") {
                      // common shape: { list: [...] }
                      const maybeList =
                        imgField.list ?? imgField.urls ?? imgField.images;
                      if (typeof maybeList === "string") {
                        imageUrl = maybeList;
                      } else if (Array.isArray(maybeList) && maybeList.length) {
                        imageUrl =
                          typeof maybeList[0] === "string"
                            ? maybeList[0]
                            : null;
                      } else {
                        // fallback: look for the first string value anywhere in the object
                        for (const k in imgField) {
                          const v = imgField[k];
                          if (typeof v === "string") {
                            imageUrl = v;
                            break;
                          }
                          if (
                            Array.isArray(v) &&
                            v.length &&
                            typeof v[0] === "string"
                          ) {
                            imageUrl = v[0];
                            break;
                          }
                        }
                      }
                    }

                    if (imageUrl) {
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={`${b.title} — capa`}
                          style={cover}
                        />
                      );
                    }

                    return <div style={coverPlaceholder}>sem imagem</div>;
                  })()}

                  {b.preview_url ? (
                    <audio controls preload="none" style={audio}>
                      <source src={b.preview_url} />
                      Seu navegador não suporta reprodução de áudio.
                    </audio>
                  ) : null}
                </div>

                <div style={cardBody}>
                  <div style={titleRow}>
                    <div style={metaTitle}>{b.title ?? "—"}</div>
                    <div style={playCount}>
                      {formatNumber(b.play_count ?? 0)} plays
                    </div>
                  </div>

                  <div style={meta}>
                    <div>
                      <strong>Artista:</strong> {b.artist ?? "—"}
                    </div>
                    <div>
                      <strong>Mapper:</strong> {b.creator ?? "—"}
                    </div>
                    {b.difficulty ? (
                      <div>
                        <strong>Dificuldade:</strong> {b.difficulty}
                      </div>
                    ) : null}
                  </div>

                  <div style={actions}>
                    {b.url ? (
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={openBtn}
                      >
                        Abrir beatmap
                      </a>
                    ) : (
                      <button onClick={() => tryOpenById(b)} style={openBtnAlt}>
                        Abrir
                      </button>
                    )}

                    <button onClick={() => copyLink(b)} style={copyBtn}>
                      Copiar link
                    </button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </div>
    </div>
  );
}

/* Helpers */

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

function tryOpenById(b: Beatmap) {
  // If your backend returns set id or beatmap id but no direct URL, try to construct a link.
  // This function attempts common patterns but will silently fail if no usable id is present.
  const setId = b.set_id ?? b.beatmapset_id ?? b.id;
  if (setId) {
    const url = `https://osu.ppy.sh/beatmapsets/${setId}`;
    window.open(url, "_blank", "noopener");
  } else if (b.url) {
    window.open(b.url, "_blank", "noopener");
  } else {
    alert("Link do beatmap indisponível");
  }
}

function copyLink(b: Beatmap) {
  const url =
    b.url ?? (b.set_id ? `https://osu.ppy.sh/beatmapsets/${b.set_id}` : null);
  if (!url) {
    alert("Nenhum link para copiar");
    return;
  }
  navigator.clipboard
    ?.writeText(url)
    .then(() => {
      // small UI feedback could be improved
      alert("Link copiado para área de transferência");
    })
    .catch(() => {
      alert("Falha ao copiar link");
    });
}

/* Styles (inline objects to stay self-contained) */

const wrapper: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  color: "#e6eef8",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const heading: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
};

const sub: React.CSSProperties = {
  margin: 0,
  color: "#9fb0c8",
  fontSize: 13,
  marginTop: 6,
};

const controls: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const backLink: React.CSSProperties = {
  color: "#cfe6ff",
  background: "rgba(255,255,255,0.03)",
  padding: "8px 10px",
  borderRadius: 8,
  fontSize: 13,
};

const muted: React.CSSProperties = {
  color: "#94a6bf",
  padding: "14px 0",
};

const errorStyle: React.CSSProperties = {
  color: "#ffb4b4",
  background: "rgba(255,80,80,0.06)",
  padding: 10,
  borderRadius: 8,
  marginBottom: 8,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: 16,
  marginTop: 12,
};

const card: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
  border: "1px solid rgba(255,255,255,0.03)",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
};

const coverWrap: React.CSSProperties = {
  position: "relative",
  minHeight: 150,
  background: "#061025",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cover: React.CSSProperties = {
  width: "100%",
  height: 150,
  objectFit: "cover",
  display: "block",
};

const coverPlaceholder: React.CSSProperties = {
  color: "#6f8aa6",
  fontSize: 13,
  padding: 20,
};

const audio: React.CSSProperties = {
  position: "absolute",
  bottom: 8,
  left: 8,
  right: 8,
  width: "calc(100% - 16px)",
  background: "transparent",
};

const cardBody: React.CSSProperties = {
  padding: "12px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const titleRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 8,
};

const metaTitle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 15,
};

const playCount: React.CSSProperties = {
  color: "#9fb0c8",
  fontSize: 13,
  minWidth: 72,
  textAlign: "right",
};

const meta: React.CSSProperties = {
  color: "#cfe6ff",
  fontSize: 13,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const actions: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 6,
};

const openBtn: React.CSSProperties = {
  background: "#3b82f6",
  color: "#fff",
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  textDecoration: "none",
  fontSize: 13,
};

const openBtnAlt: React.CSSProperties = {
  ...openBtn,
  background: "#7c3aed",
};

const copyBtn: React.CSSProperties = {
  background: "transparent",
  color: "#9fb0c8",
  border: "1px solid rgba(255,255,255,0.04)",
  padding: "8px 10px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
};
