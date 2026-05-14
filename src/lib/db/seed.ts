import { db } from "./index";
import {
	users,
	jurisdictions,
	complaints,
	complaintEvents,
	persons,
	complaintParties,
} from "./schema";
import { LIMA_DISTRICTS } from "./seeds/lima-districts";
import { buildEvent, GENESIS_HASH } from "@/server/domain/audit-chain";
import { generateTrackingCode } from "@/lib/tracking-code";
import { v4 as uuid } from "uuid";

const CRIME_TYPE_WEIGHTS = [
	{ type: "patrimonio", weight: 0.5 },
	{ type: "vida_cuerpo_salud", weight: 0.13 },
	{ type: "seguridad_publica", weight: 0.12 },
	{ type: "libertad", weight: 0.06 },
	{ type: "transito", weight: 0.1 },
	{ type: "familia", weight: 0.06 },
	{ type: "falta", weight: 0.03 },
] as const;

const DISTRICT_WEIGHTS: Record<string, number> = {
	"San Juan de Lurigancho": 4,
	Ate: 3,
	"Villa El Salvador": 3,
	Comas: 3,
	"La Victoria": 3,
	"San Martín de Porres": 2.5,
	"Cercado de Lima": 2.5,
	"Villa María del Triunfo": 2,
	"San Juan de Miraflores": 2,
	"El Agustino": 2,
	Chorrillos: 1.5,
	Rímac: 1.5,
};

function weightedRandom<T>(items: readonly { type: T; weight: number }[]): T {
	const total = items.reduce((sum, item) => sum + item.weight, 0);
	let rand = Math.random() * total;
	for (const item of items) {
		rand -= item.weight;
		if (rand <= 0) return item.type;
	}
	return items[items.length - 1].type;
}

function pickDistrict() {
	const weighted = LIMA_DISTRICTS.map(d => ({
		district: d,
		weight: DISTRICT_WEIGHTS[d.name] ?? 1,
	}));
	const total = weighted.reduce((sum, d) => sum + d.weight, 0);
	let rand = Math.random() * total;
	for (const d of weighted) {
		rand -= d.weight;
		if (rand <= 0) return d.district;
	}
	return weighted[weighted.length - 1].district;
}

function randomDate(daysBack: number): Date {
	const now = Date.now();
	const past = now - daysBack * 24 * 60 * 60 * 1000;
	return new Date(past + Math.random() * (now - past));
}

const STATUSES = [
	"recibida",
	"recibida",
	"recibida",
	"en_revision",
	"en_revision",
	"asignada",
	"en_investigacion",
	"archivada",
] as const;

async function seed() {
	console.log("🌱 Starting seed...");

	await db
		.insert(users)
		.values({
			id: "00000000-0000-0000-0000-000000000001",
			email: "diegotv536@gmail.com",
			name: "Suboficial Tuesta",
			role: "officer",
			emailVerified: new Date(),
		})
		.onConflictDoNothing();
	console.log("✓ Officer account");

	const limaId = uuid();
	await db
		.insert(jurisdictions)
		.values({
			id: limaId,
			name: "Lima",
			type: "province",
			ubigeo: "1501",
		})
		.onConflictDoNothing();

	const districtIds: Record<string, string> = {};
	for (const district of LIMA_DISTRICTS) {
		const id = uuid();
		districtIds[district.ubigeo] = id;
		await db
			.insert(jurisdictions)
			.values({
				id,
				name: district.name,
				type: "district",
				parentId: limaId,
				ubigeo: district.ubigeo,
			})
			.onConflictDoNothing();
	}
	console.log(`✓ ${LIMA_DISTRICTS.length} districts`);

	const COMPLAINT_COUNT = 200;
	let created = 0;

	for (let i = 0; i < COMPLAINT_COUNT; i++) {
		const district = pickDistrict();
		const complaintType = weightedRandom(CRIME_TYPE_WEIGHTS);
		const incidentAt = randomDate(180);
		const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
		const complaintId = uuid();
		const trackingCode = generateTrackingCode();
		const jurisdictionId = districtIds[district.ubigeo];

		const personId = uuid();
		const fakeDni = String(10000000 + Math.floor(Math.random() * 89999999));

		const genesisEvent = buildEvent({
			complaintId,
			eventType: "created",
			actorId: null,
			actorRole: "citizen",
			actorIp: null,
			payload: { type: complaintType, synthetic: true },
			reason: null,
			prevHash: GENESIS_HASH,
		});

		try {
			await db.transaction(async tx => {
				await tx
					.insert(persons)
					.values({
						id: personId,
						dni: fakeDni,
						name: `Ciudadano ${i + 1}`,
					})
					.onConflictDoNothing();

				await tx.insert(complaints).values({
					id: complaintId,
					trackingCode,
					type: complaintType as "patrimonio",
					status: status as "recibida",
					narrativeOriginal: `Denuncia sintética #${i + 1} — ${district.name}`,
					narrativeFinal: `Denuncia sintética #${i + 1} — ${district.name}`,
					locationAddress: `${district.name}, Lima`,
					incidentAt,
					jurisdictionId,
					currentHash: genesisEvent.hash,
				});

				await tx.insert(complaintEvents).values(genesisEvent);

				await tx.insert(complaintParties).values({
					complaintId,
					personId,
					role: "victima",
				});
			});
			created++;
		} catch (err) {
			console.error(`Failed complaint ${i}:`, err);
		}
	}

	console.log(`✓ ${created} synthetic complaints`);
	console.log("✅ Seed complete");
	process.exit(0);
}

seed().catch(err => {
	console.error(err);
	process.exit(1);
});
