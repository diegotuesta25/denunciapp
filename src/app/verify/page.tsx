import { VerifyForm } from "@/components/shared/verify-form";

export default function VerifyPage() {
	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4">
			<div className="max-w-2xl mx-auto">
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
