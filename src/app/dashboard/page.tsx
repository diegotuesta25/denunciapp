import { DashboardCharts } from "@/components/shared/dashboard-charts";

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

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 py-10">
				<div className="mb-8">
					<h1 className="text-2xl font-semibold text-gray-900">
						Inteligencia pública de denuncias
					</h1>
					<p className="mt-2 text-sm text-gray-500">
						Datos agregados y anonimizados de denuncias registradas en Lima
						Metropolitana. Actualizado cada hora.
					</p>
				</div>
				<DashboardCharts data={data} />
			</div>
		</div>
	);
}
