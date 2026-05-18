"use client";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
} from "recharts";

const TYPE_LABELS: Record<string, string> = {
	patrimonio: "Patrimonio",
	vida_cuerpo_salud: "Vida y salud",
	seguridad_publica: "Seg. pública",
	libertad: "Libertad",
	transito: "Tránsito",
	familia: "Familia",
	falta: "Falta",
};

const TYPE_COLORS: Record<string, string> = {
	patrimonio: "#3b82f6",
	vida_cuerpo_salud: "#ef4444",
	seguridad_publica: "#f59e0b",
	libertad: "#8b5cf6",
	transito: "#06b6d4",
	familia: "#ec4899",
	falta: "#6b7280",
};

type DistrictCount = {
	districtName: string;
	count: number;
	ubigeo: string;
};

type TypeCount = {
	type: string;
	count: number;
};

type MonthlyTrend = {
	month: string;
	type: string;
	count: number;
};

type DashboardData = {
	districtCounts: DistrictCount[];
	typeCounts: TypeCount[];
	monthlyTrend: MonthlyTrend[];
};

export function DashboardCharts({ data }: { data: DashboardData }) {
	const months = [...new Set(data.monthlyTrend.map(d => d.month))].sort();
	const types = [...new Set(data.monthlyTrend.map(d => d.type))];

	const trendData = months.map(month => {
		const row: Record<string, string | number> = { month };
		for (const type of types) {
			const found = data.monthlyTrend.find(
				d => d.month === month && d.type === type,
			);
			row[type] = found?.count ?? 0;
		}
		return row;
	});

	const topDistricts = data.districtCounts.slice(0, 10);

	const totalComplaints = data.typeCounts.reduce((sum, t) => sum + t.count, 0);

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div className="bg-white rounded-xl border p-5">
					<p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
						Total denuncias
					</p>
					<p className="text-3xl font-semibold text-gray-900">
						{totalComplaints}
					</p>
				</div>
				<div className="bg-white rounded-xl border p-5">
					<p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
						Tipo más frecuente
					</p>
					<p className="text-lg font-semibold text-gray-900">
						{TYPE_LABELS[data.typeCounts[0]?.type] ?? "—"}
					</p>
					<p className="text-sm text-gray-500">
						{data.typeCounts[0]?.count} casos
					</p>
				</div>
				<div className="bg-white rounded-xl border p-5">
					<p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
						Distrito más afectado
					</p>
					<p className="text-lg font-semibold text-gray-900">
						{topDistricts[0]?.districtName ?? "—"}
					</p>
					<p className="text-sm text-gray-500">
						{topDistricts[0]?.count} casos
					</p>
				</div>
				<div className="bg-white rounded-xl border p-5">
					<p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
						Distritos con actividad
					</p>
					<p className="text-3xl font-semibold text-gray-900">
						{data.districtCounts.length}
					</p>
				</div>
			</div>

			<div className="bg-white rounded-xl border p-6">
				<h2 className="text-sm font-medium text-gray-700 mb-6">
					Denuncias por distrito — Top 10
				</h2>
				<ResponsiveContainer width="100%" height={300}>
					<BarChart
						data={topDistricts}
						layout="vertical"
						margin={{ left: 140, right: 20 }}
					>
						<XAxis type="number" tick={{ fontSize: 12 }} />
						<YAxis
							type="category"
							dataKey="districtName"
							tick={{ fontSize: 12 }}
							width={130}
						/>
						<Tooltip formatter={value => [`${value} denuncias`, "Total"]} />
						<Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
					</BarChart>
				</ResponsiveContainer>
			</div>

			<div className="bg-white rounded-xl border p-6">
				<h2 className="text-sm font-medium text-gray-700 mb-6">
					Distribución por tipo de delito
				</h2>
				<ResponsiveContainer width="100%" height={250}>
					<BarChart
						data={data.typeCounts.map(d => ({
							...d,
							label: TYPE_LABELS[d.type] ?? d.type,
						}))}
					>
						<XAxis dataKey="label" tick={{ fontSize: 11 }} />
						<YAxis tick={{ fontSize: 12 }} />
						<Tooltip formatter={value => [`${value} denuncias`, "Total"]} />
						<Bar dataKey="count" radius={[4, 4, 0, 0]}>
							{data.typeCounts.map(entry => (
								<rect
									key={entry.type}
									fill={TYPE_COLORS[entry.type] ?? "#6b7280"}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>

			<p className="text-xs text-gray-500 text-center pb-4">
				Datos anonimizados. No incluye información personal de los denunciantes.
				Fuente: DenunciApp - actualizado cada hora.
			</p>
		</div>
	);
}
