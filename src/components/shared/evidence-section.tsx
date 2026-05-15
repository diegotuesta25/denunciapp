"use client";
import { useState } from "react";
import { EvidenceUploader } from "@/components/shared/evidence-uploader";
import { EvidenceList } from "@/components/shared/evidence-list";

type Props = {
	complaintId: string;
};

export function EvidenceSection({ complaintId }: Props) {
	const [refreshKey, setRefreshKey] = useState(0);

	return (
		<div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
			<h2 className="text-sm font-semibold text-gray-900">Evidencia</h2>

			<EvidenceList complaintId={complaintId} refreshKey={refreshKey} />

			<div className="pt-4 border-t">
				<p className="text-xs text-gray-400 mb-3">Adjuntar nueva evidencia</p>
				<EvidenceUploader
					complaintId={complaintId}
					onUploadComplete={() => setRefreshKey(k => k + 1)}
				/>
			</div>
		</div>
	);
}
