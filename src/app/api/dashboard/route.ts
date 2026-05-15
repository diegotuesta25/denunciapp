import { db } from "@/lib/db";
import { complaints, jurisdictions } from "@/lib/db/schema";
import { dashboardLimiter } from "@/lib/rate-limit";
import { eq, sql, and, gte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET(req: NextRequest) {
	const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
	const { success } = await dashboardLimiter.limit(ip);

	if (!success) {
		return NextResponse.json(
			{ error: "Too many requests" },
			{ status: 429, headers: { "Retry-After": "60" } },
		);
	}
	try {
		const districtCounts = await db
			.select({
				jurisdictionId: complaints.jurisdictionId,
				districtName: jurisdictions.name,
				ubigeo: jurisdictions.ubigeo,
				count: sql<number>`count(*)::int`,
			})
			.from(complaints)
			.leftJoin(jurisdictions, eq(complaints.jurisdictionId, jurisdictions.id))
			.where(sql`${complaints.jurisdictionId} is not null`)
			.groupBy(
				complaints.jurisdictionId,
				jurisdictions.name,
				jurisdictions.ubigeo,
			)
			.orderBy(sql`count(*) desc`);

		const typeCounts = await db
			.select({
				type: complaints.type,
				count: sql<number>`count(*)::int`,
			})
			.from(complaints)
			.groupBy(complaints.type)
			.orderBy(sql`count(*) desc`);

		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

		const monthlyTrend = await db
			.select({
				month: sql<string>`to_char(${complaints.createdAt}, 'YYYY-MM')`,
				type: complaints.type,
				count: sql<number>`count(*)::int`,
			})
			.from(complaints)
			.where(gte(complaints.createdAt, sixMonthsAgo))
			.groupBy(
				sql`to_char(${complaints.createdAt}, 'YYYY-MM')`,
				complaints.type,
			)
			.orderBy(sql`to_char(${complaints.createdAt}, 'YYYY-MM')`);

		return NextResponse.json({
			districtCounts,
			typeCounts,
			monthlyTrend,
			generatedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Dashboard API error:", error);
		return NextResponse.json(
			{ error: "Error al obtener datos del dashboard" },
			{ status: 500 },
		);
	}
}
