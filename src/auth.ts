import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
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

	session: { strategy: "jwt" },

	providers: [
		...(process.env.NEXT_PUBLIC_DEMO_MODE === "true"
			? [
					Credentials({
						id: "demo",
						credentials: { email: {} },
						async authorize(credentials) {
							const email = credentials?.email as string;
							if (email !== "demo-officer@denunciapp.demo") return null;

							const user = await db.query.users.findFirst({
								where: eq(users.email, email),
							});

							return user ?? null;
						},
					}),
				]
			: []),
		Resend({
			apiKey: process.env.AUTH_RESEND_KEY,
			from: "DenunciApp <onboarding@resend.dev>",
		}),
	],

	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				const dbUser = await db.query.users.findFirst({
					where: eq(users.id, user.id as string),
					columns: { role: true },
				});
				token.role = dbUser?.role ?? "citizen";
			}
			return token;
		},

		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.role = token.role as string;
			}
			return session;
		},
	},

	pages: {
		signIn: "/sign-in",
		verifyRequest: "/verify-request",
	},
});
