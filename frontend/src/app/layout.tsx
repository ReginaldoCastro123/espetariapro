import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EspetariaPro",
  description: "Sistema de Gestão para Espetarias",
  manifest: "/manifest.json", // <-- Conecta o seu manifesto
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EspetariaPro",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Isso evita que o garçom dê zoom acidental no celular
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}