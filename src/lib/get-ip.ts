import { headers } from "next/headers";

export async function getIp(): Promise<string> {
	const headersList = await headers();

	const forwarded = headersList.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0].trim();

	const realIp = headersList.get("x-real-ip");
	if (realIp) return realIp;

	return "127.0.0.1";
}
