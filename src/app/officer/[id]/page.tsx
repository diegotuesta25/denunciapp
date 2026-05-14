import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { complaints, complaintEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyChain } from "@/server/domain/audit-chain";
import Link from "next/link";

const EVENT_LABELS: Record<string, string> = {
	created: "Denuncia registrada",
	status_changed: "Estado actualizado",
	narrative_edited: "Descripción editada",
	assigned: "Asignada",
	note_added: "Nota agregada",
	ai_suggestion_generated: "Sugerencia de IA generada",
	narrative_finalized: "Descripción finalizada",
	correction_approved: "Corrección aprobada",
	annulled: "Anulada",
	evidence_added: "Evidencia adjuntada",
};

const TYPE_LABELS: Record<string, string> = {
	patrimonio: "Contra el patrimonio",
	vida_cuerpo_salud: "Contra la vida y salud",
	seguridad_publica: "Seguridad pública",
	libertad: "Contra la libertad",
	transito: "Accidente de tránsito",
	familia: "Violencia familiar",
	falta: "Falta administrativa",
};

export default async function ComplaintDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await auth();
	if (!session) redirect("/sign-in");

	const { id } = await params;

	const complaint = await db.query.complaints.findFirst({
		where: eq(complaints.id, id),
	});

	if (!complaint) notFound();

	const events = await db.query.complaintEvents.findMany({
		where: eq(complaintEvents.complaintId, id),
		orderBy: (e, { asc }) => [asc(e.createdAt)],
	});

	const chainResult = verifyChain(events);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto px-4 py-8">
				<Link
					href="/officer"
					className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block"
				>
					← Volver al panel
				</Link>

				<div className="bg-white rounded-xl border p-6 mb-6">
					<div className="flex items-start justify-between">
						<div>
							<p className="text-xs text-gray-400 font-mono mb-1">
								{complaint.trackingCode}
							</p>
							<h1 className="text-xl font-semibold text-gray-900">
								Denuncia — {TYPE_LABELS[complaint.type] ?? complaint.type}
							</h1>
							<p className="text-sm text-gray-500 mt-1">
								{complaint.locationAddress}
							</p>
						</div>

						<div
							className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
								chainResult.valid
									? "bg-green-50 text-green-700"
									: "bg-red-50 text-red-600"
							}`}
						>
							<span>{chainResult.valid ? "✓" : "✗"}</span>
							<span>
								{chainResult.valid ? "Registro íntegro" : "Registro alterado"}
							</span>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl border p-6 mb-6">
					<h2 className="text-sm font-medium text-gray-700 mb-3">
						Descripción de los hechos
					</h2>
					<p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
						{complaint.narrativeFinal ?? complaint.narrativeOriginal}
					</p>
				</div>

				<div className="bg-white rounded-xl border p-6">
					<h2 className="text-sm font-medium text-gray-700 mb-4">
						Registro de eventos
					</h2>
					<ol className="space-y-4">
						{events.map((event, index) => (
							<li key={event.id} className="flex gap-4">
								<div className="flex flex-col items-center">
									<div
										className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${
											index === events.length - 1
												? "bg-blue-600"
												: "bg-gray-200"
										}`}
									/>
									{index < events.length - 1 && (
										<div className="w-px flex-1 bg-gray-100 my-1" />
									)}
								</div>
								<div className="pb-2 flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<p className="text-sm font-medium text-gray-900">
											{EVENT_LABELS[event.eventType] ?? event.eventType}
										</p>
										{event.actorRole && (
											<span className="text-xs text-gray-400">
												por {event.actorRole}
											</span>
										)}
									</div>
									<p className="text-xs text-gray-400 mt-0.5">
										{new Date(event.createdAt).toLocaleString("es-PE")}
									</p>

									<p className="text-xs font-mono text-gray-300 mt-1">
										{event.hash.slice(0, 16)}...
									</p>
								</div>
							</li>
						))}
					</ol>
				</div>
			</div>
		</div>
	);
}
