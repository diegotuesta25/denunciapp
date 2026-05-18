"use server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { auth } from "@/auth";
import { ok, err, type Result } from "@/lib/result";

export type ComplaintRow = {
	id: string;
	trackingCode: string;
	type: string;
	status: string;
	locationAddress: string | null;
	createdAt: Date;
	assignedOfficerId: string | null;
	complainantName: string | null;
	complainantDni: string | null;
};

export type ComplaintFilters = {
	status?: string;
	type?: string;
	trackingCode?: string;
	complainantName?: string;
	complainantDni?: string;
	dateFrom?: string;
	dateTo?: string;
	page?: string;
};

export async function getComplaints(
	filters: ComplaintFilters = {},
): Promise<Result<{ rows: ComplaintRow[]; total: number; pageSize: number }>> {
	const session = await auth();
	if (!session) return err("AUTH_REQUIRED", "No autorizado");

	try {
		const role = session.user.role;
		const userId = session.user.id;
		const PAGE_SIZE = 20;
		const page = Math.max(1, parseInt(filters.page ?? "1", 10));
		const offset = (page - 1) * PAGE_SIZE;

		const canSeeAll = [
			"comisario",
			"regional_commander",
			"internal_affairs",
			"admin",
		].includes(role);

		const baseWhere = sql`
      WHERE 1=1
        ${!canSeeAll ? sql`AND (c.assigned_officer_id = ${userId} OR c.assigned_officer_id IS NULL)` : sql``}
        ${filters.status ? sql`AND c.status = ${filters.status}` : sql``}
        ${filters.type ? sql`AND c.type = ${filters.type}` : sql``}
        ${filters.trackingCode ? sql`AND c.tracking_code ILIKE ${"%" + filters.trackingCode + "%"}` : sql``}
        ${filters.complainantName ? sql`AND p.name ILIKE ${"%" + filters.complainantName + "%"}` : sql``}
        ${filters.complainantDni ? sql`AND p.dni ILIKE ${"%" + filters.complainantDni + "%"}` : sql``}
        ${filters.dateFrom ? sql`AND c.created_at >= ${filters.dateFrom}::date` : sql``}
        ${filters.dateTo ? sql`AND c.created_at <= ${filters.dateTo}::date + interval '1 day'` : sql``}
    `;

		const [rows, countResult] = await Promise.all([
			db.execute(sql`
        SELECT
          c.id,
          c.tracking_code,
          c.type,
          c.status,
          c.location_address,
          c.created_at,
          c.assigned_officer_id,
          p.name  AS complainant_name,
          p.dni   AS complainant_dni
        FROM complaints c
        LEFT JOIN complaint_parties cp
          ON cp.complaint_id = c.id AND cp.role = 'victima'
        LEFT JOIN persons p
          ON p.id = cp.person_id
        ${baseWhere}
        ORDER BY c.created_at DESC
        LIMIT ${PAGE_SIZE} OFFSET ${offset}
      `),
			db.execute(sql`
        SELECT count(*)::int AS total
        FROM complaints c
        LEFT JOIN complaint_parties cp
          ON cp.complaint_id = c.id AND cp.role = 'victima'
        LEFT JOIN persons p
          ON p.id = cp.person_id
        ${baseWhere}
      `),
		]);

		const total = (countResult.rows[0] as any)?.total ?? 0;

		return ok({
			rows: rows.rows.map((r: any) => ({
				id: r.id,
				trackingCode: r.tracking_code,
				type: r.type,
				status: r.status,
				locationAddress: r.location_address,
				createdAt: new Date(r.created_at),
				assignedOfficerId: r.assigned_officer_id,
				complainantName: r.complainant_name,
				complainantDni: r.complainant_dni,
			})),
			total,
			pageSize: PAGE_SIZE,
		});
	} catch (error) {
		return err("DB_ERROR", "Error al cargar las denuncias");
	}
}
