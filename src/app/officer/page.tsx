import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { complaints } from "@/lib/db/schema";
import { eq, or, isNull } from "drizzle-orm";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
	recibida: "Recibida",
	en_revision: "En revisión",
	asignada: "Asignada",
	en_investigacion: "En investigación",
	derivada_fiscalia: "Derivada a Fiscalía",
	archivada: "Archivada",
};

const TYPE_LABELS: Record<string, string> = {
	patrimonio: "Patrimonio",
	vida_cuerpo_salud: "Vida y salud",
	seguridad_publica: "Seg. pública",
	libertad: "Libertad",
	transito: "Tránsito",
	familia: "Familia",
	falta: "Falta",
};

export default async function OfficerPage() {
	const session = await auth();
	if (!session) redirect("/sign-in");

	const role = session.user.role;
	const userId = session.user.id;

	const canSeeAll = [
		"comisario",
		"regional_commander",
		"internal_affairs",
		"admin",
	].includes(role);

	const rows = await db.query.complaints.findMany({
		where: canSeeAll
			? undefined //
			: or(
					eq(complaints.assignedOfficerId, userId),
					isNull(complaints.assignedOfficerId),
				),
		columns: {
			id: true,
			trackingCode: true,
			type: true,
			status: true,
			assignedOfficerId: true,
			createdAt: true,
		},
		orderBy: (c, { desc }) => [desc(c.createdAt)],
		limit: 50,
	});

	const allComplaints = await db.query.complaints.findMany({
		columns: {
			id: true,
			trackingCode: true,
			type: true,
			status: true,
			locationAddress: true,
			createdAt: true,
		},
		orderBy: (c, { desc }) => [desc(c.createdAt)],
		limit: 50,
	});

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 py-8">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold text-gray-900">
							Consola del Oficial
						</h1>
						<p className="text-sm text-gray-500 mt-1">
							{session.user.name} · {allComplaints.length} denuncias
						</p>
					</div>
				</div>

				{allComplaints.length === 0 ? (
					<div className="bg-white rounded-xl border p-12 text-center">
						<p className="text-gray-400 text-sm">
							No hay denuncias registradas.
						</p>
					</div>
				) : (
					<div className="bg-white rounded-xl border overflow-hidden">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-gray-50">
									<th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
										Código
									</th>
									<th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
										Tipo
									</th>
									<th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
										Estado
									</th>
									<th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
										Lugar
									</th>
									<th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
										Fecha
									</th>
									<th className="px-4 py-3" />
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{allComplaints.map(complaint => (
									<tr
										key={complaint.id}
										className="hover:bg-gray-50 transition-colors"
									>
										<td className="px-4 py-3 font-mono font-medium text-gray-900">
											{complaint.trackingCode}
										</td>
										<td className="px-4 py-3 text-gray-600">
											{TYPE_LABELS[complaint.type] ?? complaint.type}
										</td>
										<td className="px-4 py-3">
											<span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700">
												{STATUS_LABELS[complaint.status] ?? complaint.status}
											</span>
										</td>
										<td className="px-4 py-3 text-gray-500 max-w-50 truncate">
											{complaint.locationAddress ?? "—"}
										</td>
										<td className="px-4 py-3 text-gray-400 text-xs">
											{new Date(complaint.createdAt).toLocaleDateString(
												"es-PE",
											)}
										</td>
										<td className="px-4 py-3">
											<Link
												href={`/officer/${complaint.id}`}
												className="text-blue-600 hover:text-blue-700 text-xs font-medium"
											>
												Ver →
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
