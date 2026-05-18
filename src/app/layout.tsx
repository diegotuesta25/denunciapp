import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/shared/navbar";
import "leaflet/dist/leaflet.css";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
	display: "swap",
});

export const metadata: Metadata = {
	title: "DenunciApp — Sistema de denuncias policiales",
	description: "Registra, sigue y verifica denuncias policiales en el Perú.",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
			<body className="font-sans antialiased">
				<Providers>
					<Navbar />
					<main>{children}</main>
				</Providers>
			</body>
		</html>
	);
}
