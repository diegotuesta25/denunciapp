"use client";
import { useState, useTransition } from "react";
import { reconcileComplaints } from "@/server/actions/reconcile-complaints";
import type { ReconciliationResult } from "@/server/actions/reconcile-complaints";

export function ReconciliationTrigger() {
	const [result, setResult] = useState<ReconciliationResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	function handleRun() {
		setError(null);
		setResult(null);
		startTransition(async () => {
			const res = await reconcileComplaints();
			if (res.success) {
				setResult(res.data);
			} else {
				setError(res.error.message);
			}
		});
	}

	return (
		<div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
			<div>
				<h2 className="text-sm font-semibold text-gray-900">
					Reconciliación de estados
				</h2>
				<p className="text-xs text-gray-500 mt-1">
					Verifica que el estado almacenado de cada denuncia coincida con lo que
					indica la cadena de eventos.
				</p>
			</div>

			<button
				onClick={handleRun}
				disabled={isPending}
				className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
			>
				{isPending ? "Verificando..." : "Ejecutar reconciliación"}
			</button>

			{error && <p className="text-sm text-red-600">{error}</p>}

			{result && (
				<div className="space-y-3">
					<p className="text-sm text-gray-600">
						{result.total} denuncias verificadas —{" "}
						<span
							className={
								result.mismatches.length > 0
									? "text-red-600 font-medium"
									: "text-green-600 font-medium"
							}
						>
							{result.mismatches.length === 0
								? "sin discrepancias"
								: `${result.mismatches.length} discrepancia${result.mismatches.length !== 1 ? "s" : ""} detectada${result.mismatches.length !== 1 ? "s" : ""}`}
						</span>
					</p>

					{result.mismatches.length > 0 && (
						<ul className="space-y-2">
							{result.mismatches.map(m => (
								<li
									key={m.complaintId}
									className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs space-y-1"
								>
									<p className="font-mono font-bold text-red-900">
										{m.trackingCode}
									</p>
									<p className="text-red-700">
										Almacenado:{" "}
										<span className="font-medium">{m.storedStatus}</span>
										{" → "}
										Esperado:{" "}
										<span className="font-medium">{m.expectedStatus}</span>
									</p>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}
