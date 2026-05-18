export const STATUS_COLORS: Record<string, string> = {
	recibida: "bg-blue-50 text-blue-700",
	en_revision: "bg-yellow-50 text-yellow-700",
	asignada: "bg-purple-50 text-purple-700",
	en_investigacion: "bg-orange-50 text-orange-700",
	derivada_fiscalia: "bg-indigo-50 text-indigo-700",
	archivada: "bg-gray-100 text-gray-500",
};

export const STATUS_LABELS: Record<string, string> = {
	recibida: "Recibida",
	en_revision: "En revisión",
	asignada: "Asignada",
	en_investigacion: "En investigación",
	derivada_fiscalia: "Derivada a Fiscalía",
	archivada: "Archivada",
};

export const TYPE_LABELS: Record<string, string> = {
	patrimonio: "Patrimonio",
	vida_cuerpo_salud: "Vida y salud",
	seguridad_publica: "Seg. pública",
	libertad: "Libertad",
	transito: "Tránsito",
	familia: "Familia",
	falta: "Falta",
};
