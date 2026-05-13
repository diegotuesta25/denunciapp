import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens,
	}),

	providers: [
		Resend({
			apiKey: process.env.AUTH_RESEND_KEY,
			from: "DenunciApp <onboarding@resend.dev>",
		}),
	],

	callbacks: {
		async session({ session, user }) {
			if (session.user) {
				session.user.id = user.id;

				const dbUser = await db.query.users.findFirst({
					where: eq(users.id, user.id),
					columns: { role: true },
				});

				session.user.role = dbUser?.role ?? "citizen";
			}
			return session;
		},
	},

	pages: {
		signIn: "/sign-in",
		verifyRequest: "/verify-request",
	},
});
