import { db } from "./index";
import { users } from "./schema";

async function seed() {
	console.log("Seeding officer account...");

	await db
		.insert(users)
		.values({
			id: "00000000-0000-0000-0000-000000000001",
			email: "diegotv536@gmail.com",
			name: "Suboficial Ramos",
			role: "officer",
			emailVerified: new Date(),
		})
		.onConflictDoNothing();

	console.log("Done. Officer email: diegotv536@gmail.com");
	process.exit(0);
}

seed().catch(err => {
	console.error(err);
	process.exit(1);
});
