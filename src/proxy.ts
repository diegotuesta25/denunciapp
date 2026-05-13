import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED_ROUTES: { prefix: string; roles: string[] }[] = [
	{
		prefix: "/officer",
		roles: [
			"officer",
			"comisario",
			"regional_commander",
			"internal_affairs",
			"admin",
		],
	},
	{
		prefix: "/dashboard",
		roles: ["comisario", "regional_commander", "internal_affairs", "admin"],
	},
];

export default auth(req => {
	const { nextUrl, auth: session } = req;
	const pathname = nextUrl.pathname;

	const match = PROTECTED_ROUTES.find(route =>
		pathname.startsWith(route.prefix),
	);

	if (!match) return NextResponse.next();

	if (!session) {
		const signInUrl = new URL("/sign-in", nextUrl.origin);
		signInUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(signInUrl);
	}
	if (!match.roles.includes(session.user.role)) {
		return NextResponse.redirect(new URL("/", nextUrl.origin));
	}

	return NextResponse.next();
});

export const config = {
	matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
