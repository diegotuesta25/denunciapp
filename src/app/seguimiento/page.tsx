import { TrackingForm } from "@/components/shared/tracking-form";
import Link from "next/link";

export default function TrackPage() {
	return (
		<div className="min-h-[calc(100vh-3.55rem)] bg-gray-50 py-12 px-4">
			<div className="max-w-lg mx-auto">
				<Link
					href="/"
					className="text-sm text-gray-500 hover:text-gray-600 mb-6 inline-block"
				>
					← Inicio
				</Link>
				<div className="mb-8">
					<h1 className="text-2xl font-semibold text-gray-900">
						Seguimiento de denuncia
					</h1>
					<p className="mt-2 text-sm text-gray-500">
						Ingresa tu código de seguimiento y los últimos 4 dígitos de tu DNI.
					</p>
				</div>

				<div className="bg-white rounded-xl shadow-sm border p-6">
					<TrackingForm />
				</div>
			</div>
		</div>
	);
}
