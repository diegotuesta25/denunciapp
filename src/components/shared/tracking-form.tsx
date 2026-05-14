"use client";
import {
	lookupComplaint,
	type ComplaintPublicView,
} from "@/server/actions/lookup-complaint";
import { useState } from "react";

const STATUS_LABELS: Record<string, string> = {
	draft: "Borrador",
	recibida: "Recibida",
	en_revision: "En revisión",
	asignada: "Asignada",
	en_investigacion: "En investigación",
	derivada_fiscalia: "Derivada a Fiscalía",
	archivada: "Archivada",
	rectificada: "Rectificada",
	anulada: "Anulada",
};

const STATUS_COLORS: Record<string, string> = {
	draft: "bg-gray-100 text-gray-600",
	recibida: "bg-blue-50 text-blue-700",
	en_revision: "bg-yellow-50 text-yellow-700",
	asignada: "bg-purple-50 text-purple-700",
	en_investigacion: "bg-orange-50 text-orange-700",
	derivada_fiscalia: "bg-indigo-50 text-indigo-700",
	archivada: "bg-gray-100 text-gray-500",
	rectificada: "bg-green-50 text-green-700",
	anulada: "bg-red-50 text-red-600",
};

export function TrackingForm() {
	const [trackingCode, setTrackingCode] = useState("");
	const [dniSuffix, setDniSuffix] = useState("");
	const [result, setResult] = useState<ComplaintPublicView | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	console.log("DNI", dniSuffix);
	console.log("Tracking code", trackingCode);
	console.log("Loading", loading);

	async function handleLookup() {
		if (!trackingCode.trim() || !dniSuffix.trim()) return;

		setLoading(true);
		setError(null);
		setResult(null);

		const res = await lookupComplaint({
			trackingCode: trackingCode.trim().toUpperCase(),
			dniSuffix: dniSuffix.trim(),
		});

		if (res.success) {
			setResult(res.data);
		} else {
			setError(res.error);
		}

		setLoading(false);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Código de seguimiento
					</label>
					<input
						type="text"
						value={trackingCode}
						onChange={e => setTrackingCode(e.target.value.toUpperCase())}
						placeholder="DEN-XXXXXXX"
						maxLength={12}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Últimos 4 dígitos de tu DNI
					</label>
					<input
						type="text"
						value={dniSuffix}
						onChange={e => setDniSuffix(e.target.value.replace(/\D/g, ""))}
						placeholder="1234"
						maxLength={4}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<button
					onClick={handleLookup}
					disabled={
						loading || trackingCode.length < 8 || dniSuffix.length !== 4
					}
					className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{loading ? "Buscando..." : "Consultar estado"}
				</button>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<p className="text-sm text-red-600">{error}</p>
				</div>
			)}

			{result && (
				<div className="space-y-4 pt-4 border-t">
					<div className="flex items-center justify-between">
						<span className="font-mono text-sm font-bold text-gray-900">
							{result.trackingCode}
						</span>
						<span
							className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[result.status]}`}
						>
							{STATUS_LABELS[result.status]}
						</span>
					</div>

					<div className="text-sm text-gray-500 space-y-1">
						<p>
							Registrada el{" "}
							{new Date(result.createdAt).toLocaleDateString("es-PE", {
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
						</p>
					</div>

					<div>
						<p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
							Historial
						</p>
						<ol className="space-y-3">
							{result.events.map((event, index) => (
								<li key={event.id} className="flex gap-3">
									<div className="flex flex-col items-center">
										<div
											className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
												index === result.events.length - 1
													? "bg-blue-600"
													: "bg-gray-300"
											}`}
										/>
										{index < result.events.length - 1 && (
											<div className="w-px flex-1 bg-gray-200 mt-1" />
										)}
									</div>
									<div className="pb-3 flex-1">
										<p className="text-sm font-medium text-gray-900">
											{getEventLabel(event.eventType)}
										</p>
										<p className="text-xs text-gray-400 mt-0.5">
											{new Date(event.createdAt).toLocaleString("es-PE")}
										</p>
										<p className="text-xs font-mono text-gray-300 mt-1">
											#{event.hash.slice(0, 8)}
										</p>
									</div>
								</li>
							))}
						</ol>
					</div>
				</div>
			)}
		</div>
	);
}

function getEventLabel(eventType: string): string {
	const labels: Record<string, string> = {
		created: "Denuncia registrada",
		status_changed: "Estado actualizado",
		narrative_edited: "Descripción actualizada",
		assigned: "Asignada a un oficial",
		note_added: "Nota agregada",
		ai_suggestion_generated: "Mejora de IA generada",
		narrative_finalized: "Descripción finalizada",
		correction_approved: "Corrección aprobada",
		annulled: "Denuncia anulada",
		evidence_added: "Evidencia adjuntada",
	};
	return labels[eventType] ?? eventType;
}
