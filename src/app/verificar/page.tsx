import { VerifyForm } from "@/components/shared/verify-form";
import Link from "next/link";

export default function VerifyPage() {
	return (
		<div className="min-h-[calc(100vh-3.55rem)] bg-gray-50 py-12 px-4">
			<div className="max-w-2xl mx-auto">
				<Link
					href="/"
					className="text-sm text-gray-500 hover:text-gray-600 mb-6 inline-block"
				>
					← Inicio
				</Link>
				<div className="mb-8">
					<h1 className="text-2xl font-semibold text-gray-900">
						Verificar integridad de una denuncia
					</h1>
					<p className="mt-2 text-sm text-gray-500">
						Verifica criptográficamente que el historial de una denuncia no ha
						sido alterado. Ingresa el código de seguimiento.
					</p>
				</div>

				<div className="bg-white rounded-xl shadow-sm border p-6">
					<VerifyForm />
				</div>
			</div>
		</div>
	);
}
