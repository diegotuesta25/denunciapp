import Link from "next/link";

export default function NotFound() {
	return (
		<div className="min-h-[60vh] flex items-center justify-center px-4">
			<div className="text-center max-w-md">
				<p className="text-6xl font-mono font-bold text-gray-200 mb-4">404</p>
				<h1 className="text-xl font-semibold text-gray-900 mb-2">
					Página no encontrada
				</h1>
				<p className="text-sm text-gray-500 mb-8">
					La página que buscas no existe o fue movida.
				</p>
				<div className="flex gap-3 justify-center">
					<Link
						href="/"
						className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
					>
						Volver al inicio
					</Link>
					<Link
						href="/seguimiento"
						className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
					>
						Consultar denuncia
					</Link>
				</div>
			</div>
		</div>
	);
}
