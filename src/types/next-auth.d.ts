import type { DefaultSession } from "next-auth";
import type { role } from "@/lib/db/schema";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			role: (typeof role.enumValues)[number];
		} & DefaultSession["user"];
	}
}
