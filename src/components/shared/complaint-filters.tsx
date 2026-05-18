"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const STATUS_OPTIONS = [
	{ value: "", label: "Todos los estados" },
	{ value: "recibida", label: "Recibida" },
	{ value: "en_revision", label: "En revisión" },
	{ value: "asignada", label: "Asignada" },
	{ value: "en_investigacion", label: "En investigación" },
	{ value: "derivada_fiscalia", label: "Derivada a Fiscalía" },
	{ value: "archivada", label: "Archivada" },
];

const TYPE_OPTIONS = [
	{ value: "", label: "Todos los tipos" },
	{ value: "patrimonio", label: "Patrimonio" },
	{ value: "vida_cuerpo_salud", label: "Vida y salud" },
	{ value: "seguridad_publica", label: "Seg. pública" },
	{ value: "libertad", label: "Libertad" },
	{ value: "transito", label: "Tránsito" },
	{ value: "familia", label: "Familia" },
	{ value: "falta", label: "Falta" },
];

export function ComplaintFilters() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const updateFilter = useCallback(
		(key: string, value: string) => {
			const params = new URLSearchParams(searchParams.toString());
			if (value) {
				params.set(key, value);
			} else {
				params.delete(key);
			}
			params.delete("page");
			router.replace(`${pathname}?${params.toString()}`);
		},
		[router, pathname, searchParams],
	);

	const clearAll = () => router.replace(pathname);

	const hasFilters = searchParams.toString().length > 0;

	return (
		<div className="bg-white rounded-xl border p-4 space-y-3">
			{/* Row 1 — text searches */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<input
					type="text"
					placeholder="Código (DEN-XXXXX)"
					defaultValue={searchParams.get("trackingCode") ?? ""}
					onChange={e => updateFilter("trackingCode", e.target.value)}
					className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
				/>
				<input
					type="text"
					placeholder="Nombre del denunciante"
					defaultValue={searchParams.get("complainantName") ?? ""}
					onChange={e => updateFilter("complainantName", e.target.value)}
					className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<input
					type="text"
					placeholder="DNI"
					defaultValue={searchParams.get("complainantDni") ?? ""}
					onChange={e => updateFilter("complainantDni", e.target.value)}
					maxLength={8}
					className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
				/>
			</div>

			{/* Row 2 — dropdowns + dates */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<select
					value={searchParams.get("status") ?? ""}
					onChange={e => updateFilter("status", e.target.value)}
					className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{STATUS_OPTIONS.map(o => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>

				<select
					value={searchParams.get("type") ?? ""}
					onChange={e => updateFilter("type", e.target.value)}
					className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{TYPE_OPTIONS.map(o => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>

				<input
					type="date"
					value={searchParams.get("dateFrom") ?? ""}
					onChange={e => updateFilter("dateFrom", e.target.value)}
					className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<input
					type="date"
					value={searchParams.get("dateTo") ?? ""}
					onChange={e => updateFilter("dateTo", e.target.value)}
					className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			{/* Clear button */}
			{hasFilters && (
				<button
					onClick={clearAll}
					className="text-xs text-gray-400 hover:text-gray-600 underline"
				>
					Limpiar filtros
				</button>
			)}
		</div>
	);
}
