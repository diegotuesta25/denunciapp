"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StepIndicator } from "./step-indicator";
import { submitComplaint } from "@/server/actions/submit-complaint";
import {
	complaintFormSchema,
	type ComplaintFormData,
} from "@/lib/validations/complaint";
import Link from "next/link";
import { EvidenceUploader } from "./evidence-uploader";
import { LIMA_DISTRICTS } from "@/lib/constants/lima-districts";

const COMPLAINT_TYPES = [
	{ value: "patrimonio", label: "Contra el patrimonio (robo, hurto, estafa)" },
	{
		value: "vida_cuerpo_salud",
		label: "Contra la vida y salud (lesiones, homicidio)",
	},
	{ value: "seguridad_publica", label: "Seguridad pública (drogas, armas)" },
	{ value: "libertad", label: "Contra la libertad (secuestro, amenazas)" },
	{ value: "transito", label: "Accidente de tránsito" },
	{ value: "familia", label: "Violencia familiar" },
	{ value: "falta", label: "Falta administrativa" },
] as const;

type FormStep = 1 | 2 | 3;

export function ComplaintForm() {
	const [currentStep, setCurrentStep] = useState<FormStep>(1);
	const [trackingCode, setTrackingCode] = useState<string | null>(null);
	const [complaintId, setComplaintId] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const form = useForm<ComplaintFormData>({
		resolver: zodResolver(complaintFormSchema),
		mode: "onTouched",
		defaultValues: {
			type: undefined,
			subtype: "",
			incidentDate: "",
			incidentTime: "",
			narrative: "",
			locationAddress: "",
			complainantName: "",
			complainantDni: "",
			complainantEmail: "",
			complainantPhone: "",
		},
	});

	async function handleNextStep() {
		let isValid = false;

		if (currentStep === 1) {
			isValid = await form.trigger(
				["type", "incidentDate", "incidentTime", "narrative"],
				{ shouldFocus: true },
			);
		} else if (currentStep === 2) {
			isValid = await form.trigger(["locationAddress"], {
				shouldFocus: true,
			});
		}

		if (isValid) setCurrentStep(s => (s + 1) as FormStep);
	}
	console.log("complaintId being passed:", complaintId);
	async function handleSubmit(data: ComplaintFormData) {
		setIsSubmitting(true);
		setSubmitError(null);

		try {
			const result = await submitComplaint(data);
			if (result.success) {
				setTrackingCode(result.data.trackingCode);
				setComplaintId(result.data.complaintId);
			} else {
				setSubmitError(result.error.message);
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	if (trackingCode) {
		return (
			<div className="text-center py-8">
				<div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg
						className="w-8 h-8 text-green-600"
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
				<h2 className="text-2xl font-semibold text-gray-900 mb-2">
					Denuncia registrada
				</h2>
				<p className="text-gray-500 mb-6">
					Guarda este código para hacer seguimiento de tu denuncia
				</p>
				<div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 inline-block">
					<p className="text-sm text-blue-600 mb-1">Código de seguimiento</p>
					<p className="text-3xl font-mono font-bold text-blue-900">
						{trackingCode}
					</p>
				</div>
				<div className="mt-8 text-left border-t pt-6">
					<p className="text-sm font-medium text-gray-700 mb-1">
						¿Tienes fotos, videos o documentos relacionados?
					</p>
					<p className="text-xs text-gray-400 mb-3">
						Puedes adjuntarlos ahora o más tarde desde la sección de
						seguimiento.
					</p>

					<EvidenceUploader complaintId={complaintId} />
				</div>
				<p className="text-sm text-gray-400 pt-5">
					Visita la sección de seguimiento e ingresa este código junto con los
					últimos 4 dígitos de tu DNI.
				</p>

				<div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
					<Link
						href={`/track`}
						className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-center"
					>
						Consultar estado de mi denuncia
					</Link>
					<Link
						href="/"
						className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2 text-center"
					>
						Volver al inicio
					</Link>
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
			<StepIndicator
				currentStep={currentStep}
				totalSteps={3}
				labels={["Incidente", "Lugar", "Tus datos"]}
			/>

			{/* ── Step 1 — Incident details ── */}
			{currentStep === 1 && (
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Tipo de denuncia <span className="text-red-500">*</span>
						</label>
						<select
							{...form.register("type")}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Selecciona una opción</option>
							{COMPLAINT_TYPES.map(t => (
								<option key={t.value} value={t.value}>
									{t.label}
								</option>
							))}
						</select>
						{form.formState.errors.type && (
							<p className="text-red-500 text-xs mt-1">
								{form.formState.errors.type.message}
							</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Fecha del incidente <span className="text-red-500">*</span>
							</label>
							<input
								type="date"
								{...form.register("incidentDate")}
								max={new Date().toISOString().split("T")[0]}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							{form.formState.errors.incidentDate && (
								<p className="text-red-500 text-xs mt-1">
									{form.formState.errors.incidentDate.message}
								</p>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Hora aproximada <span className="text-red-500">*</span>
							</label>
							<input
								type="time"
								{...form.register("incidentTime")}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							{form.formState.errors.incidentTime && (
								<p className="text-red-500 text-xs mt-1">
									{form.formState.errors.incidentTime.message}
								</p>
							)}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Descripción de los hechos <span className="text-red-500">*</span>
						</label>
						<textarea
							{...form.register("narrative")}
							rows={6}
							placeholder="Describe lo que ocurrió con el mayor detalle posible: qué pasó, cuándo, dónde, quiénes estuvieron involucrados..."
							className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
						/>
						<div className="flex justify-between mt-1">
							{form.formState.errors.narrative ? (
								<p className="text-red-500 text-xs">
									{form.formState.errors.narrative.message}
								</p>
							) : (
								<span />
							)}
							<p className="text-xs text-gray-400">
								{form.watch("narrative")?.length ?? 0} / 5000
							</p>
						</div>
					</div>
				</div>
			)}

			{/* ── Step 2 — Location ── */}
			{currentStep === 2 && (
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Dirección donde ocurrió el incidente{" "}
							<span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							{...form.register("locationAddress")}
							placeholder="Ej: Av. Abancay 123, Cercado de Lima"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						{form.formState.errors.locationAddress && (
							<p className="text-red-500 text-xs mt-1">
								{form.formState.errors.locationAddress.message}
							</p>
						)}
					</div>

					<p className="text-xs text-gray-400">
						Sé lo más específico posible. En una próxima versión podrás marcar
						la ubicación en un mapa.
					</p>
				</div>
			)}

			{/* ── Step 3 — Complainant identity ── */}
			{currentStep === 3 && (
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Nombre completo <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							{...form.register("complainantName")}
							placeholder="Nombres y apellidos completos"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						{form.formState.errors.complainantName && (
							<p className="text-red-500 text-xs mt-1">
								{form.formState.errors.complainantName.message}
							</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							DNI <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							{...form.register("complainantDni")}
							placeholder="12345678"
							maxLength={8}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						{form.formState.errors.complainantDni && (
							<p className="text-red-500 text-xs mt-1">
								{form.formState.errors.complainantDni.message}
							</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Correo electrónico{" "}
							<span className="text-gray-400">(opcional)</span>
						</label>
						<input
							type="email"
							{...form.register("complainantEmail")}
							placeholder="para recibir actualizaciones de tu denuncia"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						{form.formState.errors.complainantEmail && (
							<p className="text-red-500 text-xs mt-1">
								{form.formState.errors.complainantEmail.message}
							</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Teléfono <span className="text-gray-400">(opcional)</span>
						</label>
						<input
							type="tel"
							{...form.register("complainantPhone")}
							placeholder="987654321"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{submitError && (
						<p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
							{submitError}
						</p>
					)}
				</div>
			)}

			{/* ── Buttons ── */}
			<div className="flex justify-between pt-4 border-t">
				{currentStep > 1 ? (
					<button
						type="button"
						onClick={() => setCurrentStep(s => (s - 1) as FormStep)}
						className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
					>
						Atrás
					</button>
				) : (
					<span />
				)}

				{currentStep < 3 ? (
					<button
						type="button"
						onClick={handleNextStep}
						className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						Continuar
					</button>
				) : (
					<button
						type="submit"
						disabled={isSubmitting}
						className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSubmitting ? "Registrando..." : "Enviar denuncia"}
					</button>
				)}
			</div>
		</form>
	);
}
