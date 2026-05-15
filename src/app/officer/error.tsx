"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function OfficerError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		Sentry.captureException(error, {
			tags: { section: "officer" },
		});
	}, [error]);

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
			<div className="bg-white rounded-xl border p-8 max-w-md w-full text-center">
				<h1 className="text-lg font-semibold text-gray-900 mb-2">
					Error en la consola
				</h1>
				<p className="text-sm text-gray-500 mb-6">
					No se pudo cargar esta sección. El error fue registrado.
				</p>
				<button
					onClick={reset}
					className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
				>
					Reintentar
				</button>
			</div>
		</div>
	);
}
