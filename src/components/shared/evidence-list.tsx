"use client";
import { useEffect, useState } from "react";
import {
	getComplaintEvidence,
	type EvidenceItem,
} from "@/server/actions/get-evidence";

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string): string {
	if (mimeType.startsWith("image/")) return "🖼️";
	if (mimeType === "application/pdf") return "📄";
	if (mimeType.startsWith("audio/")) return "🎵";
	if (mimeType.startsWith("video/")) return "🎥";
	return "📎";
}

type EvidenceListProps = {
	complaintId: string;
	refreshKey?: number;
};

export function EvidenceList({
	complaintId,
	refreshKey = 0,
}: EvidenceListProps) {
	const [items, setItems] = useState<EvidenceItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		getComplaintEvidence(complaintId).then(result => {
			if (result.success) setItems(result.data);
			setLoading(false);
		});
	}, [complaintId, refreshKey]);

	if (loading) {
		return (
			<p className="text-xs text-gray-400 animate-pulse">
				Cargando evidencia...
			</p>
		);
	}

	if (items.length === 0) {
		return (
			<p className="text-xs text-gray-400 italic">No hay evidencia adjunta.</p>
		);
	}

	return (
		<ul className="space-y-2">
			{items.map(item => (
				<li
					key={item.id}
					className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
				>
					<div className="flex items-center gap-2 min-w-0">
						<span className="text-lg shrink-0">
							{getFileIcon(item.mimeType)}
						</span>
						<div className="min-w-0">
							<p className="text-sm font-medium text-gray-900 truncate">
								{item.fileName}
							</p>
							<p className="text-xs text-gray-400">
								{formatBytes(item.fileSize)} ·{" "}
								{new Date(item.createdAt).toLocaleDateString("es-PE")}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						{/* Hash — shortened, for auditability */}
						<span
							className="text-xs font-mono text-gray-300 hidden sm:block"
							title={`SHA-256: ${item.sha256Hash}`}
						>
							#{item.sha256Hash.slice(0, 8)}
						</span>
						<a
							href={item.blobUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs text-blue-600 hover:underline"
						>
							Ver
						</a>
					</div>
				</li>
			))}
		</ul>
	);
}
