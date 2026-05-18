"use server";
import { signIn } from "@/auth";

const DEMO_ENABLED = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function loginAsDemoOfficer() {
	if (!DEMO_ENABLED) {
		throw new Error("Demo mode is not enabled");
	}

	await signIn("demo", {
		email: "demo-officer@denunciapp.demo",
		redirectTo: "/officer",
	});
}
