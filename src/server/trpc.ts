import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@/auth";

export async function createContext() {
	const session = await auth();
	return { session };
}

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

export const officerProcedure = protectedProcedure.use(({ ctx, next }) => {
	const role = ctx.session.user.role;
	const allowedRoles = [
		"officer",
		"comisario",
		"regional_commander",
		"internal_affairs",
		"admin",
	];

	if (!allowedRoles.includes(role)) {
		throw new TRPCError({ code: "FORBIDDEN" });
	}

	return next({ ctx });
});
