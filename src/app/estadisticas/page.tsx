import { DashboardCharts } from "@/components/shared/dashboard-charts";
import { DashboardMap } from "@/components/shared/dashboard-map";
import Link from "next/link";

export const revalidate = 3600;

async function getDashboardData() {
	const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
	const res = await fetch(`${baseUrl}/api/dashboard`, {
		next: { revalidate: 3600 },
	});
	if (!res.ok) throw new Error("Failed to fetch dashboard data");
	return res.json();
}

export default async function DashboardPage() {
	const data = await getDashboardData();

	console.log(data);
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 py-10">
				<Link
					href="/"
					className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block"
				>
					← Inicio
				</Link>
				<div className="mb-8">
					<h1 className="text-2xl font-semibold text-gray-900">
						Inteligencia pública de denuncias
					</h1>
					<p className="mt-2 text-sm text-gray-500">
						Datos agregados y anonimizados de denuncias registradas en Lima
						Metropolitana. Actualizado cada hora.
					</p>
				</div>
				<div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">
							Transparencia — Mapa de Denuncias
						</h1>
						<p className="text-sm text-gray-500 mt-1">
							Datos anonimizados. Distritos con menos de 5 denuncias no se
							muestran.
						</p>
					</div>

					<DashboardMap data={data} />
				</div>
				<DashboardCharts data={data} />
			</div>
		</div>
	);
}
