import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getComplaints } from "@/server/actions/get-complaints";
import { Suspense } from "react";
import { ComplaintFilters } from "@/components/shared/complaint-filters";
import {
	STATUS_COLORS,
	STATUS_LABELS,
	TYPE_LABELS,
} from "@/lib/constants/status";

type SearchParams = {
	status?: string;
	type?: string;
	trackingCode?: string;
	complainantName?: string;
	complainantDni?: string;
	dateFrom?: string;
	dateTo?: string;
	page?: string;
};

// ── Pagination component ────────────────────────────────────────────────────
function Pagination({
	currentPage,
	totalPages,
	searchParams,
}: {
	currentPage: number;
	totalPages: number;
	searchParams: SearchParams;
}) {
	if (totalPages <= 1) return null;

	// Build a URL with updated page, preserving all other filters
	function pageUrl(page: number) {
		const params = new URLSearchParams();
		if (searchParams.status) params.set("status", searchParams.status);
		if (searchParams.type) params.set("type", searchParams.type);
		if (searchParams.trackingCode)
			params.set("trackingCode", searchParams.trackingCode);
		if (searchParams.complainantName)
			params.set("complainantName", searchParams.complainantName);
		if (searchParams.complainantDni)
			params.set("complainantDni", searchParams.complainantDni);
		if (searchParams.dateFrom) params.set("dateFrom", searchParams.dateFrom);
		if (searchParams.dateTo) params.set("dateTo", searchParams.dateTo);
		params.set("page", String(page));
		return `/officer?${params.toString()}`;
	}

	// Generate page numbers to show — always show first, last, current ± 1
	function getPageNumbers(): (number | "...")[] {
		const pages: (number | "...")[] = [];
		const delta = 1;

		for (let i = 1; i <= totalPages; i++) {
			if (
				i === 1 ||
				i === totalPages ||
				(i >= currentPage - delta && i <= currentPage + delta)
			) {
				pages.push(i);
			} else if (
				(i === currentPage - delta - 1 && i > 1) ||
				(i === currentPage + delta + 1 && i < totalPages)
			) {
				pages.push("...");
			}
		}

		return pages;
	}

	const pageNumbers = getPageNumbers();

	return (
		<div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100">
			<p className="text-xs text-gray-400">
				Página {currentPage} de {totalPages}
			</p>

			<div className="flex items-center gap-1">
				{/* Previous */}
				{currentPage > 1 ? (
					<Link
						href={pageUrl(currentPage - 1)}
						className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
					>
						← Anterior
					</Link>
				) : (
					<span className="px-3 py-1.5 text-xs text-gray-300 border border-gray-100 rounded-lg cursor-not-allowed">
						← Anterior
					</span>
				)}

				{/* Page numbers */}
				<div className="flex items-center gap-1">
					{pageNumbers.map((p, i) =>
						p === "..." ? (
							<span
								key={`ellipsis-${i}`}
								className="px-2 py-1.5 text-xs text-gray-400"
							>
								...
							</span>
						) : (
							<Link
								key={p}
								href={pageUrl(p as number)}
								className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
									p === currentPage
										? "bg-blue-600 text-white font-medium"
										: "text-gray-600 border border-gray-200 hover:bg-gray-50"
								}`}
							>
								{p}
							</Link>
						),
					)}
				</div>

				{/* Next */}
				{currentPage < totalPages ? (
					<Link
						href={pageUrl(currentPage + 1)}
						className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
					>
						Siguiente →
					</Link>
				) : (
					<span className="px-3 py-1.5 text-xs text-gray-300 border border-gray-100 rounded-lg cursor-not-allowed">
						Siguiente →
					</span>
				)}
			</div>
		</div>
	);
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function OfficerPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const session = await auth();
	if (!session) redirect("/sign-in");

	const filters = await searchParams;
	const result = await getComplaints(filters);

	const rows = result.success ? result.data.rows : [];
	const total = result.success ? result.data.total : 0;
	const pageSize = result.success ? result.data.pageSize : 20;
	const currentPage = Math.max(1, parseInt(filters.page ?? "1", 10));
	const totalPages = Math.ceil(total / pageSize);
	const hasFilters = Object.entries(filters)
		.filter(([k]) => k !== "page")
		.some(([, v]) => Boolean(v));

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold text-gray-900">
							Consola del Oficial
						</h1>
						<p className="text-sm text-gray-500 mt-1">
							{session.user.name} ·{" "}
							{hasFilters
								? `${total} resultado${total !== 1 ? "s" : ""} (filtrado)`
								: `${total} denuncia${total !== 1 ? "s" : ""}`}
						</p>
					</div>
				</div>

				{/* Filters */}
				<Suspense fallback={null}>
					<ComplaintFilters />
				</Suspense>

				{/* Table */}
				{rows.length === 0 ? (
					<div className="bg-white rounded-xl border p-12 text-center">
						<p className="text-gray-400 text-sm">
							{hasFilters
								? "No se encontraron denuncias con los filtros aplicados."
								: "No hay denuncias registradas."}
						</p>
					</div>
				) : (
					<div className="bg-white rounded-xl border overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-gray-50">
										<th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
											Código
										</th>
										<th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
											Denunciante
										</th>
										<th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
											DNI
										</th>
										<th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
											Tipo
										</th>
										<th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
											Estado
										</th>
										<th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
											Lugar
										</th>
										<th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
											Fecha
										</th>
										<th className="px-4 py-3" />
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100">
									{rows.map(complaint => (
										<tr
											key={complaint.id}
											className="hover:bg-gray-50 transition-colors"
										>
											<td className="px-4 py-3 font-mono font-medium text-gray-900 whitespace-nowrap">
												{complaint.trackingCode}
											</td>
											<td className="px-4 py-3 text-gray-900 whitespace-nowrap">
												{complaint.complainantName ?? (
													<span className="text-gray-300">—</span>
												)}
											</td>
											<td className="px-4 py-3 font-mono text-gray-600 whitespace-nowrap">
												{complaint.complainantDni ? (
													<>
														<span className="text-gray-300">••••</span>
														{complaint.complainantDni.slice(-4)}
													</>
												) : (
													<span className="text-gray-300">—</span>
												)}
											</td>
											<td className="px-4 py-3 text-gray-600 whitespace-nowrap">
												{TYPE_LABELS[complaint.type] ?? complaint.type}
											</td>
											<td className="px-4 py-3 whitespace-nowrap">
												<span
													className={`text-xs font-medium px-2 py-1 rounded-full ${
														STATUS_COLORS[complaint.status] ??
														"bg-gray-100 text-gray-600"
													}`}
												>
													{STATUS_LABELS[complaint.status] ?? complaint.status}
												</span>
											</td>
											<td className="px-4 py-3 text-gray-500 max-w-48 truncate">
												{complaint.locationAddress ?? (
													<span className="text-gray-300">—</span>
												)}
											</td>
											<td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
												{new Date(complaint.createdAt).toLocaleDateString(
													"es-PE",
												)}
											</td>
											<td className="px-4 py-3">
												<Link
													href={`/officer/${complaint.id}`}
													className="text-blue-600 hover:text-blue-700 text-xs font-medium whitespace-nowrap"
												>
													Ver →
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Pagination — inside the table card, below the rows */}
						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							searchParams={filters}
						/>
					</div>
				)}

				{/* Summary line */}
				{rows.length > 0 && (
					<p className="text-xs text-gray-400 text-center">
						Mostrando {(currentPage - 1) * pageSize + 1}–
						{Math.min(currentPage * pageSize, total)} de {total} denuncias
					</p>
				)}
			</div>
		</div>
	);
}
