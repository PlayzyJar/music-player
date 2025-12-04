import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>osu! Beatmaps — Music Player</title>
      </head>
      <body style={bodyStyle}>
        <header style={headerStyle}>
          <div style={headerInnerStyle}>
            <div style={brandStyle}>
              <div style={logoStyle}>osu!</div>
              <div>
                <h1 style={titleStyle}>Beatmaps</h1>
                <p style={subtitleStyle}>
                  Resultados de busca do osu! alinhados à música selecionada
                </p>
              </div>
            </div>

            <nav style={navStyle}>
              <a href="/" style={navLinkStyle}>
                Home
              </a>
              <a href="/search" style={navLinkStyle}>
                Pesquisar Músicas
              </a>
              <span style={navSeparator}>|</span>
              <a href="/osu_beatmaps" style={navLinkActiveStyle}>
                Beatmaps
              </a>
            </nav>
          </div>
        </header>

        <main style={mainStyle}>
          <div style={containerStyle}>
            {/* Top controls area: the page.tsx can render a search + filters here via children */}
            <section style={controlsStyle}>
              <div style={controlsLeftStyle}>
                <strong style={{ marginRight: 8 }}>Ordenar por:</strong>
                <span style={pillStyle}>Play Count (desc)</span>
              </div>
              <div style={controlsRightStyle}>
                <small style={{ color: "#666" }}>
                  Clique em um beatmap para ver mais detalhes
                </small>
              </div>
            </section>

            {/* The children (page content) will render the list/grid of beatmaps */}
            <section style={contentStyle}>{children}</section>
          </div>
        </main>

        <footer style={footerStyle}>
          <div style={footerInnerStyle}>
            <small>Integrado com a API do osu! e seu backend</small>
            <small> • </small>
            <small>Design simples para exibição de beatmaps</small>
          </div>
        </footer>

        {/* Minimal CSS reset and helpful styles inside a style tag to keep file self-contained */}
        <style>{`
          /* Improve font rendering */
          html, body, #__next {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          a { text-decoration: none; }

          /* Responsive tweaks */
          @media (max-width: 720px) {
            header div[style] {
              padding-left: 16px !important;
              padding-right: 16px !important;
            }
            main { padding: 16px 12px; }
          }
        `}</style>
      </body>
    </html>
  );
}

/* Inline style objects */
const bodyStyle: React.CSSProperties = {
  margin: 0,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  background: "#0f1724",
  color: "#e6eef8",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};

const headerStyle: React.CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.04)",
  background: "linear-gradient(90deg, rgba(14,22,33,0.6), rgba(8,10,15,0.6))",
  backdropFilter: "blur(6px)",
};

const headerInnerStyle: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "18px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
};

const brandStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const logoStyle: React.CSSProperties = {
  width: 50,
  height: 50,
  borderRadius: 8,
  background: "linear-gradient(180deg,#ff66a3,#ff3b6f)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  color: "#071123",
  boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
  fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "#9fb0c8",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 13,
  color: "#cfe6ff",
};

const navLinkStyle: React.CSSProperties = {
  color: "#9fb0c8",
  padding: "6px 8px",
  borderRadius: 6,
};

const navLinkActiveStyle: React.CSSProperties = {
  ...navLinkStyle,
  background: "rgba(255,255,255,0.04)",
  color: "#e6eef8",
  fontWeight: 600,
};

const navSeparator: React.CSSProperties = {
  color: "rgba(255,255,255,0.08)",
  marginLeft: 6,
  marginRight: 6,
};

const mainStyle: React.CSSProperties = {
  flex: "1 1 auto",
  padding: "20px 24px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
};

const controlsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 18,
  gap: 12,
  flexWrap: "wrap",
};

const controlsLeftStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const controlsRightStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const pillStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.03)",
  fontSize: 13,
  color: "#dbefff",
};

const contentStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 16,
};

const footerStyle: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.03)",
  padding: "12px 0",
  background: "linear-gradient(180deg, rgba(8,10,15,0.4), rgba(6,7,9,0.6))",
};

const footerInnerStyle: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "8px 24px",
  display: "flex",
  gap: 8,
  alignItems: "center",
  justifyContent: "center",
  color: "#94a6bf",
};
