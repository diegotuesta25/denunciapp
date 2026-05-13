import type { complaintStatusEnum } from "@/lib/db/schema";

type ComplaintStatus = (typeof complaintStatusEnum.enumValues)[number];

const TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
	draft: ["recibida"],
	recibida: ["en_revision"],
	en_revision: ["asignada"],
	asignada: ["en_investigacion"],
	en_investigacion: ["derivada_fiscalia", "archivada"],
	derivada_fiscalia: ["archivada"],
	archivada: [],
	rectificada: [],
	anulada: [],
};

type Role =
	| "citizen"
	| "officer"
	| "comisario"
	| "regional_commander"
	| "internal_affairs"
	| "admin";

const TRANSITION_PERMISSIONS: Partial<Record<ComplaintStatus, Role[]>> = {
	recibida: ["officer", "comisario", "admin"],
	en_revision: ["officer", "comisario", "admin"],
	asignada: ["officer", "comisario", "admin"],
	en_investigacion: ["officer", "comisario", "admin"],
	derivada_fiscalia: ["comisario", "regional_commander", "admin"],
	archivada: ["comisario", "regional_commander", "admin"],
};

export function canTransition(
	from: ComplaintStatus,
	to: ComplaintStatus,
	role: Role,
): boolean {
	const validNextStatuses = TRANSITIONS[from];
	if (!validNextStatuses.includes(to)) return false;

	const allowedRoles = TRANSITION_PERMISSIONS[to];
	if (!allowedRoles) return false;

	return allowedRoles.includes(role);
}

export function transition(
	from: ComplaintStatus,
	to: ComplaintStatus,
	role: Role,
): ComplaintStatus {
	if (!canTransition(from, to, role)) {
		throw new Error(
			`Invalid transition: ${from} → ${to} is not allowed for role "${role}"`,
		);
	}
	return to;
}

export function getValidTransitions(
	from: ComplaintStatus,
	role: Role,
): ComplaintStatus[] {
	return TRANSITIONS[from].filter(to => canTransition(from, to, role));
}
