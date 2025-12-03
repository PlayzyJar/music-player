// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "BeatBridge",
  description: "Encontre beatmaps do osu! pelo Spotify",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-neutral-900 text-white min-h-screen flex items-center justify-center">
        {children}
      </body>
    </html>
  );
}
