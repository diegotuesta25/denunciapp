"use client";
import { useState, useTransition } from "react";
import { updateComplaintStatus } from "@/server/actions/update-complaint-status";
import { getValidTransitions } from "@/server/domain/complaint-state-machine";

const STATUS_LABELS: Record<string, string> = {
	recibida: "Recibida",
	en_revision: "En revisión",
	asignada: "Asignada",
	en_investigacion: "En investigación",
	derivada_fiscalia: "Derivada a Fiscalía",
	archivada: "Archivada",
};

type Props = {
	complaintId: string;
	currentStatus: string;
	userRole: string;
};

export function StatusUpdater({ complaintId, currentStatus, userRole }: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState<string>("");
	const [reason, setReason] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const validNextStatuses = getValidTransitions(
		currentStatus as Parameters<typeof getValidTransitions>[0],
		userRole as Parameters<typeof getValidTransitions>[1],
	);

	if (validNextStatuses.length === 0) {
		return (
			<p className="text-xs text-gray-400 italic">
				Esta denuncia ya está en un estado final.
			</p>
		);
	}

	async function handleSubmit() {
		if (!selectedStatus) return;

		setError(null);

		startTransition(async () => {
			const result = await updateComplaintStatus({
				complaintId,
				newStatus: selectedStatus,
				reason: reason.trim() || undefined,
			});

			if (result.success) {
				setIsOpen(false);
				setSelectedStatus("");
				setReason("");
			} else {
				setError(result.error.message);
			}
		});
	}

	if (!isOpen) {
		return (
			<button
				onClick={() => setIsOpen(true)}
				className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
			>
				Actualizar estado
			</button>
		);
	}

	return (
		<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Nuevo estado
				</label>
				<div className="space-y-2">
					{validNextStatuses.map(status => (
						<label
							key={status}
							className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
								selectedStatus === status
									? "border-blue-500 bg-blue-50"
									: "border-gray-200 hover:bg-white"
							}`}
						>
							<input
								type="radio"
								name="newStatus"
								value={status}
								checked={selectedStatus === status}
								onChange={e => setSelectedStatus(e.target.value)}
								className="accent-blue-600"
							/>
							<span className="text-sm text-gray-700">
								{STATUS_LABELS[status] ?? status}
							</span>
						</label>
					))}
				</div>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Motivo <span className="text-gray-400 font-normal">(opcional)</span>
				</label>
				<textarea
					value={reason}
					onChange={e => setReason(e.target.value)}
					rows={3}
					maxLength={500}
					placeholder="Ej: Se asigna a Unidad de Investigación Criminal..."
					className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<p className="text-xs text-gray-400 mt-1">{reason.length} / 500</p>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-3">
					<p className="text-sm text-red-600">{error}</p>
				</div>
			)}

			<div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
				<button
					onClick={() => {
						setIsOpen(false);
						setSelectedStatus("");
						setReason("");
						setError(null);
					}}
					disabled={isPending}
					className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50"
				>
					Cancelar
				</button>
				<button
					onClick={handleSubmit}
					disabled={!selectedStatus || isPending}
					className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
				>
					{isPending ? "Guardando..." : "Confirmar cambio"}
				</button>
			</div>
		</div>
	);
}
