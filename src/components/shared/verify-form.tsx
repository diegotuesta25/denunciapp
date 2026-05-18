"use client";
import { useState } from "react";
import {
	verifyComplaint,
	type VerifyResult,
} from "@/server/actions/verify-complaint";

export function VerifyForm() {
	const [trackingCode, setTrackingCode] = useState("");
	const [result, setResult] = useState<VerifyResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleVerify() {
		if (!trackingCode.trim()) return;
		setLoading(true);
		setResult(null);
		setError(null);
		try {
			const res = await verifyComplaint(trackingCode);
			if (res.success) {
				setResult(res.data);
			} else {
				setError(res.error.message);
			}
		} finally {
			setLoading(false);
		}
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
				<button
					onClick={handleVerify}
					disabled={loading || trackingCode.length < 10}
					className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
				>
					{loading ? "Verificando..." : "Verificar integridad"}
				</button>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<p className="text-sm text-red-600">{error}</p>
				</div>
			)}

			{result && (
				<div className="border-t pt-6 space-y-4">
					{/* The big trust signal */}
					<div
						className={`rounded-xl p-6 ${
							result.chainValid
								? "bg-green-50 border border-green-200"
								: "bg-red-50 border border-red-200"
						}`}
					>
						<div className="flex items-center gap-3 mb-2">
							<div
								className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xl font-bold ${
									result.chainValid ? "bg-green-600" : "bg-red-600"
								}`}
							>
								{result.chainValid ? "✓" : "✗"}
							</div>
							<div>
								<p
									className={`font-semibold ${
										result.chainValid ? "text-green-900" : "text-red-900"
									}`}
								>
									{result.chainValid ? "Registro íntegro" : "Registro alterado"}
								</p>
								<p
									className={`text-xs ${
										result.chainValid ? "text-green-700" : "text-red-700"
									}`}
								>
									{result.chainValid
										? "La cadena de eventos no ha sido modificada"
										: `Se detectó alteración en el evento #${(result.brokenAtIndex ?? 0) + 1}`}
								</p>
							</div>
						</div>
					</div>

					{/* Metadata */}
					<dl className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<dt className="text-gray-500 text-xs uppercase tracking-wide mb-1">
								Código
							</dt>
							<dd className="font-mono text-gray-900 font-medium">
								{result.trackingCode}
							</dd>
						</div>
						<div>
							<dt className="text-gray-500 text-xs uppercase tracking-wide mb-1">
								Eventos
							</dt>
							<dd className="text-gray-900 font-medium">{result.eventCount}</dd>
						</div>
						<div>
							<dt className="text-gray-500 text-xs uppercase tracking-wide mb-1">
								Primer evento
							</dt>
							<dd className="text-gray-700">
								{new Date(result.firstEventAt).toLocaleString("es-PE")}
							</dd>
						</div>
						<div>
							<dt className="text-gray-500 text-xs uppercase tracking-wide mb-1">
								Último evento
							</dt>
							<dd className="text-gray-700">
								{new Date(result.lastEventAt).toLocaleString("es-PE")}
							</dd>
						</div>
					</dl>

					<p className="text-xs text-gray-500 pt-4 border-t">
						Esta verificación se realiza recalculando los hashes SHA-256 de cada
						evento y comparándolos con los almacenados en la cadena. Si algún
						evento ha sido modificado después de su creación, la cadena se rompe
						y el sistema lo detecta automáticamente.
					</p>
				</div>
			)}
		</div>
	);
}
