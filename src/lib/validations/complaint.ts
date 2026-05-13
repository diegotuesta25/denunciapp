import { z } from "zod";

export const step1Schema = z.object({
	type: z.enum(
		[
			"patrimonio",
			"vida_cuerpo_salud",
			"seguridad_publica",
			"libertad",
			"transito",
			"familia",
			"falta",
		],
		{ required_error: "Selecciona el tipo de denuncia" },
	),

	subtype: z.string().optional(),

	incidentDate: z
		.string()
		.min(1, "La fecha del incidente es requerida")
		.refine(date => {
			return new Date(date) <= new Date();
		}, "La fecha no puede ser en el futuro"),

	incidentTime: z.string().min(1, "La hora del incidente es requerida"),

	narrative: z
		.string()
		.min(50, "La descripción debe tener al menos 50 caracteres")
		.max(5000, "La descripción no puede superar los 5000 caracteres"),
});

export const step2Schema = z.object({
	locationAddress: z.string().min(5, "Ingresa una dirección válida"),
	locationLat: z.number().optional(),
	locationLng: z.number().optional(),
});

export const step3Schema = z.object({
	complainantName: z.string().min(2, "Ingresa tu nombre completo"),

	complainantDni: z
		.string()
		.min(8, "El DNI debe tener 8 dígitos")
		.max(8, "El DNI debe tener 8 dígitos")
		.regex(/^\d+$/, "El DNI solo debe contener números"),

	complainantEmail: z
		.string()
		.email("Ingresa un correo válido")
		.optional()
		.or(z.literal("")),

	complainantPhone: z
		.string()
		.min(9, "Ingresa un número válido")
		.optional()
		.or(z.literal("")),
});

export const complaintFormSchema = step1Schema
	.merge(step2Schema)
	.merge(step3Schema);

export type ComplaintFormData = z.infer<typeof complaintFormSchema>;
export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
