"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Capture the error with full context
		Sentry.captureException(error);
	}, [error]);

	return (
		<div className="min-h-[60vh] flex items-center justify-center px-4">
			<div className="text-center max-w-md">
				<div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg
						className="w-6 h-6 text-red-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<h1 className="text-xl font-semibold text-gray-900 mb-2">
					Ocurrió un error inesperado
				</h1>
				<p className="text-sm text-gray-500 mb-2">
					El error ha sido registrado automáticamente.
				</p>
				{error.digest && (
					<p className="text-xs font-mono text-gray-500 mb-6">
						ID: {error.digest}
					</p>
				)}
				<div className="flex gap-3 justify-center">
					<button
						onClick={reset}
						className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
					>
						Intentar nuevamente
					</button>
					<a
						href="/"
						className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
					>
						Volver al inicio
					</a>
				</div>
			</div>
		</div>
	);
}
