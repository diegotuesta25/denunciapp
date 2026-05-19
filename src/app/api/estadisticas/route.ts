import { getDashboardStats } from "@/server/actions/get-dashboard-stats";
import { dashboardLimiter } from "@/lib/rate-limit";
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
		const data = await getDashboardStats();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Dashboard API error:", error);
		return NextResponse.json(
			{ error: "Error al obtener datos del dashboard" },
			{ status: 500 },
		);
	}
}
