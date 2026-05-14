import { db } from "@/lib/db";
import { complaints, jurisdictions } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
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
