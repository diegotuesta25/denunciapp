"use client";
import { useState, useTransition } from "react";
import { addComplaintNote } from "@/server/actions/add-complaint-note";

export function NoteAdder({ complaintId }: { complaintId: string }) {
	const [isOpen, setIsOpen] = useState(false);
	const [text, setText] = useState("");
	const [visibility, setVisibility] = useState<"public" | "private">("private");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	function handleSubmit() {
		if (text.trim().length < 5) return;
		setError(null);
		startTransition(async () => {
			const result = await addComplaintNote({
				complaintId,
				text: text.trim(),
				visibility,
			});
			if (result.success) {
				setText("");
				setIsOpen(false);
			} else {
				setError(result.error.message);
			}
		});
	}

	if (!isOpen) {
		return (
			<button
				onClick={() => setIsOpen(true)}
				className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
			>
				Agregar nota
			</button>
		);
	}

	return (
		<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
			<textarea
				value={text}
				onChange={e => setText(e.target.value)}
				rows={4}
				maxLength={2000}
				placeholder="Ej: Se contactó al denunciante para coordinar declaración..."
				className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3 text-sm">
					<label className="flex items-center gap-1.5 cursor-pointer">
						<input
							type="radio"
							checked={visibility === "private"}
							onChange={() => setVisibility("private")}
							className="accent-blue-600"
						/>
						<span className="text-gray-700">Privada</span>
					</label>
					<label className="flex items-center gap-1.5 cursor-pointer">
						<input
							type="radio"
							checked={visibility === "public"}
							onChange={() => setVisibility("public")}
							className="accent-blue-600"
						/>
						<span className="text-gray-700">Visible al ciudadano</span>
					</label>
				</div>
				<span className="text-xs text-gray-400">{text.length} / 2000</span>
			</div>

			{error && <p className="text-sm text-red-600">{error}</p>}

			<div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
				<button
					onClick={() => {
						setIsOpen(false);
						setText("");
						setError(null);
					}}
					disabled={isPending}
					className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50"
				>
					Cancelar
				</button>
				<button
					onClick={handleSubmit}
					disabled={text.trim().length < 5 || isPending}
					className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
				>
					{isPending ? "Guardando..." : "Guardar nota"}
				</button>
			</div>
		</div>
	);
}
