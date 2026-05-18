"use server";
import { db } from "@/lib/db";
import { jurisdictions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type JurisdictionOption = {
	id: string;
	name: string;
};

export async function getDistrictJurisdictions(): Promise<
	JurisdictionOption[]
> {
	try {
		const rows = await db.query.jurisdictions.findMany({
			where: eq(jurisdictions.type, "district"),
			columns: { id: true, name: true },
			orderBy: (j, { asc }) => [asc(j.name)],
		});
		return rows;
	} catch {
		return [];
	}
}
