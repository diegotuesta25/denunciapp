import { router } from "@/server/trpc";
import { complaintsRouter } from "./complaints";

export const appRouter = router({
	complaints: complaintsRouter,
});

export type AppRouter = typeof appRouter;
