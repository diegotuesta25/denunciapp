"use client";
import { useState, useRef } from "react";
import { confirmEvidenceUpload } from "@/server/actions/upload-evidence";

async function computeSHA256(file: File): Promise<string> {
	const buffer = await file.arrayBuffer();
	const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

const ALLOWED_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/heic",
	"application/pdf",
	"audio/mpeg",
	"audio/mp4",
	"audio/wav",
	"video/mp4",
	"video/quicktime",
];

const MAX_SIZE_MB = 25;

type UploadState =
	| { status: "idle" }
	| { status: "hashing" }
	| { status: "uploading" }
	| { status: "confirming" }
	| { status: "done"; fileName: string }
	| { status: "error"; message: string };

type Props = {
	complaintId: string | null;
	onUploadComplete?: (evidenceId: string) => void;
};

export function EvidenceUploader({ complaintId, onUploadComplete }: Props) {
	const [uploadState, setUploadState] = useState<UploadState>({
		status: "idle",
	});
	const inputRef = useRef<HTMLInputElement>(null);

	async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!ALLOWED_TYPES.includes(file.type)) {
			setUploadState({
				status: "error",
				message:
					"Tipo de archivo no permitido. Se aceptan imágenes, PDF, audio y video.",
			});
			return;
		}

		if (file.size > MAX_SIZE_MB * 1024 * 1024) {
			setUploadState({
				status: "error",
				message: `El archivo no puede superar ${MAX_SIZE_MB}MB.`,
			});
			return;
		}

		try {
			setUploadState({ status: "hashing" });
			const sha256Hash = await computeSHA256(file);

			setUploadState({ status: "uploading" });

			const formData = new FormData();
			formData.append("file", file);

			const uploadRes = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			if (!uploadRes.ok) {
				const { error } = await uploadRes.json();
				setUploadState({
					status: "error",
					message: error ?? "Error al subir el archivo",
				});
				return;
			}

			const { url: blobUrl } = await uploadRes.json();

			setUploadState({ status: "confirming" });

			const result = await confirmEvidenceUpload({
				complaintId,
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				blobUrl,
				sha256Hash,
			});

			if (!result.success) {
				setUploadState({ status: "error", message: result.error.message });
				return;
			}

			setUploadState({ status: "done", fileName: file.name });
			onUploadComplete?.(result.data.evidenceId);

			if (inputRef.current) inputRef.current.value = "";
		} catch (error) {
			setUploadState({
				status: "error",
				message: "Error al subir el archivo. Por favor intenta de nuevo.",
			});
		}
	}

	return (
		<div className="space-y-3">
			<div
				className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
					uploadState.status === "idle" || uploadState.status === "error"
						? "border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
						: "border-blue-200 bg-blue-50 cursor-not-allowed"
				}`}
				onClick={() => {
					if (uploadState.status === "idle" || uploadState.status === "error") {
						inputRef.current?.click();
					}
				}}
				role="button"
				tabIndex={0}
				aria-label="Seleccionar archivo de evidencia"
				onKeyDown={e => {
					if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
				}}
			>
				<input
					ref={inputRef}
					type="file"
					className="hidden"
					accept={ALLOWED_TYPES.join(",")}
					onChange={handleFileSelect}
					aria-hidden="true"
				/>

				{uploadState.status === "idle" && (
					<div className="space-y-2">
						<div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
							<svg
								className="w-5 h-5 text-gray-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
								/>
							</svg>
						</div>
						<p className="text-sm text-gray-600">
							Haz clic para adjuntar evidencia
						</p>
						<p className="text-xs text-gray-500">
							Imágenes, PDF, audio, video — máx. {MAX_SIZE_MB}MB
						</p>
					</div>
				)}

				{uploadState.status === "hashing" && (
					<p className="text-sm text-blue-600 animate-pulse">
						Calculando integridad del archivo...
					</p>
				)}

				{uploadState.status === "uploading" && (
					<p className="text-sm text-blue-600 animate-pulse">
						Subiendo archivo...
					</p>
				)}

				{uploadState.status === "confirming" && (
					<p className="text-sm text-blue-600 animate-pulse">
						Registrando en el expediente...
					</p>
				)}

				{uploadState.status === "done" && (
					<div
						className="space-y-2 cursor-pointer"
						onClick={e => {
							e.stopPropagation();
							setUploadState({ status: "idle" });
						}}
					>
						<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto">
							<svg
								className="w-5 h-5 text-green-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<p className="text-sm text-green-700 font-medium">
							{uploadState.fileName} adjuntado
						</p>
						<p className="text-xs text-gray-500">
							Clic para adjuntar otro archivo
						</p>
					</div>
				)}
			</div>

			{uploadState.status === "error" && (
				<div
					role="alert"
					aria-live="polite"
					className="bg-red-50 border border-red-200 rounded-lg p-3"
				>
					<p className="text-sm text-red-600">{uploadState.message}</p>
					<button
						onClick={() => setUploadState({ status: "idle" })}
						className="text-xs text-red-500 underline mt-1"
					>
						Intentar de nuevo
					</button>
				</div>
			)}
		</div>
	);
}
