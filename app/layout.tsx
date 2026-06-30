import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Display de Móviles",
  description: "Panel de estado de unidades móviles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
