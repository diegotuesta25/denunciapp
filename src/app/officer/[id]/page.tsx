import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { complaints, complaintEvents, complaintParties } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyChain } from "@/server/domain/audit-chain";
import Link from "next/link";
import { StatusUpdater } from "@/components/shared/status-updater";
import { NoteAdder } from "@/components/shared/note-adder";
import { EvidenceSection } from "@/components/shared/evidence-section";
import {
	STATUS_COLORS,
	STATUS_LABELS,
	TYPE_LABELS,
} from "@/lib/constants/status";

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

	const [events, party] = await Promise.all([
		db.query.complaintEvents.findMany({
			where: eq(complaintEvents.complaintId, id),
			orderBy: (e, { asc }) => [asc(e.createdAt)],
		}),
		db.query.complaintParties.findFirst({
			where: and(
				eq(complaintParties.complaintId, id),
				eq(complaintParties.role, "victima"),
			),
			with: {
				person: {
					columns: {
						name: true,
						dni: true,
						phone: true,
						email: true,
					},
				},
			},
		}),
	]);

	const chainResult = verifyChain(events);
	const complainant = party?.person ?? null;

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto px-4 py-8">
				<Link
					href="/officer"
					className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block"
				>
					← Volver al panel
				</Link>

				{/* ── Header ── */}
				<div className="bg-white rounded-xl border p-6 mb-6">
					<div className="flex items-start justify-between mb-4">
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

						<div className="flex flex-col items-end gap-2 shrink-0 ml-4">
							{/* Status badge */}
							<span
								className={`text-xs font-medium px-3 py-1.5 rounded-full ${
									STATUS_COLORS[complaint.status] ?? "bg-gray-100 text-gray-600"
								}`}
							>
								{STATUS_LABELS[complaint.status] ?? complaint.status}
							</span>

							{/* Chain integrity badge */}
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

					{/* ── Complainant info ── */}
					<div className="pt-4 border-t border-gray-100">
						<p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
							Denunciante
						</p>
						{complainant ? (
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
								<div>
									<p className="text-xs text-gray-400 mb-0.5">Nombre</p>
									<p className="text-sm font-medium text-gray-900 truncate">
										{complainant.name}
									</p>
								</div>
								<div>
									<p className="text-xs text-gray-400 mb-0.5">DNI</p>
									<p className="text-sm font-mono text-gray-900">
										{complainant.dni}
									</p>
								</div>
								{complainant.phone && (
									<div>
										<p className="text-xs text-gray-400 mb-0.5">Teléfono</p>
										<p className="text-sm text-gray-900">{complainant.phone}</p>
									</div>
								)}
								{complainant.email && (
									<div>
										<p className="text-xs text-gray-400 mb-0.5">Correo</p>
										<p className="text-sm text-gray-900 truncate">
											{complainant.email}
										</p>
									</div>
								)}
							</div>
						) : (
							<p className="text-xs text-gray-400 italic">
								No hay datos del denunciante registrados.
							</p>
						)}
					</div>

					{/* ── Incident metadata ── */}
					<div className="pt-4 mt-4 border-t border-gray-100">
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
							<div>
								<p className="text-xs text-gray-400 mb-0.5">
									Fecha del incidente
								</p>
								<p className="text-sm text-gray-900">
									{complaint.incidentAt
										? new Date(complaint.incidentAt).toLocaleString("es-PE")
										: "—"}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-400 mb-0.5">
									Fecha de registro
								</p>
								<p className="text-sm text-gray-900">
									{new Date(complaint.createdAt).toLocaleString("es-PE")}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-400 mb-0.5">Subtipo</p>
								<p className="text-sm text-gray-900">
									{complaint.subtype ?? "—"}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* ── Actions ── */}
				<div className="bg-white rounded-xl border p-6 mb-6">
					<h2 className="text-sm font-medium text-gray-700 mb-4">Acciones</h2>
					<div className="flex flex-col gap-3">
						<StatusUpdater
							complaintId={complaint.id}
							currentStatus={complaint.status}
							userRole={session.user.role}
						/>
						<NoteAdder complaintId={complaint.id} />
					</div>
				</div>

				{/* ── Narrative ── */}
				<div className="bg-white rounded-xl border p-6 mb-6">
					<h2 className="text-sm font-medium text-gray-700 mb-3">
						Descripción de los hechos
					</h2>
					<p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap wrap-break-word">
						{complaint.narrativeFinal ?? complaint.narrativeOriginal}
					</p>
				</div>

				{/* ── Evidence ── */}
				<div className="mb-6">
					<EvidenceSection complaintId={complaint.id} />
				</div>

				{/* ── Audit log ── */}
				<div className="bg-white rounded-xl border p-6">
					<h2 className="text-sm font-medium text-gray-700 mb-4">
						Registro de eventos
					</h2>

					{events.length === 0 ? (
						<p className="text-xs text-gray-400 italic">
							No hay eventos registrados.
						</p>
					) : (
						<ol className="space-y-4">
							{events.map((event, index) => {
								const payload = event.payload as Record<string, unknown> | null;
								const isNote = event.eventType === "note_added";
								const isStatusChange = event.eventType === "status_changed";
								const noteText =
									isNote && typeof payload?.text === "string"
										? payload.text
										: null;
								const noteVisibility =
									isNote && typeof payload?.visibility === "string"
										? payload.visibility
										: null;
								const statusFrom =
									isStatusChange && typeof payload?.from === "string"
										? payload.from
										: null;
								const statusTo =
									isStatusChange && typeof payload?.to === "string"
										? payload.to
										: null;

								return (
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
												{noteVisibility === "private" && (
													<span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
														Privada
													</span>
												)}
											</div>

											<p className="text-xs text-gray-400 mt-0.5">
												{new Date(event.createdAt).toLocaleString("es-PE")}
											</p>

											{/* Status transition detail */}
											{statusFrom && statusTo && (
												<p className="text-xs text-gray-500 mt-1">
													<span className="font-medium">
														{STATUS_LABELS[statusFrom] ?? statusFrom}
													</span>{" "}
													→{" "}
													<span className="font-medium">
														{STATUS_LABELS[statusTo] ?? statusTo}
													</span>
												</p>
											)}

											{/* Note text */}
											{noteText && (
												<p className="text-sm text-gray-700 mt-2 bg-gray-50 border border-gray-100 rounded-lg p-3">
													{noteText}
												</p>
											)}

											{/* Hash */}
											<p className="text-xs font-mono text-gray-300 mt-1">
												{event.hash.slice(0, 16)}...
											</p>
										</div>
									</li>
								);
							})}
						</ol>
					)}
				</div>
			</div>
		</div>
	);
}
