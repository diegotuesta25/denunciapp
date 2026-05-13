import { ComplaintForm } from "@/components/shared/complaint-form";

export default function DenunciarPage() {
	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4">
			<div className="max-w-xl mx-auto">
				<div className="mb-8">
					<h1 className="text-2xl font-semibold text-gray-900">
						Registrar una denuncia
					</h1>
					<p className="mt-2 text-sm text-gray-500">
						Completa el formulario. Recibirás un código único para hacer
						seguimiento de tu caso.
					</p>
				</div>
				<div className="bg-white rounded-xl shadow-sm border p-6">
					<ComplaintForm />
				</div>
			</div>
		</div>
	);
}
