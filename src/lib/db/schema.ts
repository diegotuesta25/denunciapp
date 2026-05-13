import {
	pgTable,
	pgEnum,
	uuid,
	varchar,
	text,
	timestamp,
	date,
	jsonb,
	integer,
} from "drizzle-orm/pg-core";
import { customType } from "drizzle-orm/pg-core";

const geometry = customType<{ data: string }>({
	dataType() {
		return "geometry(Point, 4326)";
	},
});

export const roleEnum = pgEnum("role", [
	"citizen",
	"officer",
	"comisario",
	"regional_commander",
	"internal_affairs",
	"admin",
]);

export const complaintStatusEnum = pgEnum("complaint_status", [
	"draft",
	"recibida",
	"en_revision",
	"asignada",
	"en_investigacion",
	"derivada_fiscalia",
	"archivada",
	"rectificada",
	"anulada",
]);

export const complaintTypeEnum = pgEnum("complaint_type", [
	"patrimonio",
	"vida_cuerpo_salud",
	"seguridad_publica",
	"libertad",
	"transito",
	"familia",
	"falta",
]);

export const eventTypeEnum = pgEnum("event_type", [
	"created",
	"narrative_edited",
	"status_changed",
	"assigned",
	"evidence_added",
	"ai_suggestion_generated",
	"narrative_finalized",
	"correction_approved",
	"annulled",
	"note_added",
]);

export const partyRoleEnum = pgEnum("party_role", [
	"victima",
	"denunciado",
	"testigo",
]);

export const evidenceKindEnum = pgEnum("evidence_kind", [
	"image",
	"video",
	"document",
	"audio",
]);

export const jurisdictionTypeEnum = pgEnum("jurisdiction_type", [
	"department",
	"province",
	"district",
	"comisaria",
]);

export const aiOutcomeEnum = pgEnum("ai_outcome", [
	"accepted",
	"modified",
	"rejected",
]);

export const jurisdictions = pgTable("jurisdictions", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	type: jurisdictionTypeEnum("type").notNull(),
	parentId: uuid("parent_id"),
	ubigeo: varchar("ubigeo", { length: 6 }),
});

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	emailVerified: timestamp("email_verified", { mode: "date" }),
	name: varchar("name", { length: 255 }),
	image: varchar("image", { length: 255 }),
	role: roleEnum("role").notNull().default("citizen"),
	jurisdictionId: uuid("jurisdiction_id").references(() => jurisdictions.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const persons = pgTable("persons", {
	id: uuid("id").primaryKey().defaultRandom(),
	dni: varchar("dni", { length: 12 }).unique(),
	name: varchar("name", { length: 255 }).notNull(),
	dob: date("dob"),
	phone: varchar("phone", { length: 20 }),
	email: varchar("email", { length: 255 }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const complaints = pgTable("complaints", {
	id: uuid("id").primaryKey().defaultRandom(),
	trackingCode: varchar("tracking_code", { length: 12 }).notNull().unique(),
	type: complaintTypeEnum("type").notNull(),
	subtype: varchar("subtype", { length: 100 }),
	status: complaintStatusEnum("status").notNull().default("draft"),
	narrativeOriginal: text("narrative_original"),
	narrativeAiSuggestion: text("narrative_ai_suggestion"),
	narrativeFinal: text("narrative_final"),
	aiOutcome: aiOutcomeEnum("ai_outcome"),
	locationGeom: geometry("location_geom"),
	locationAddress: text("location_address"),
	incidentAt: timestamp("incident_at"),
	jurisdictionId: uuid("jurisdiction_id").references(() => jurisdictions.id),
	complainantId: uuid("complainant_id").references(() => users.id),
	lockedAt: timestamp("locked_at"),
	currentHash: varchar("current_hash", { length: 64 }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const complaintEvents = pgTable("complaint_events", {
	id: varchar("id", { length: 26 }).primaryKey(), // ULID
	complaintId: uuid("complaint_id")
		.notNull()
		.references(() => complaints.id),
	eventType: eventTypeEnum("event_type").notNull(),
	actorId: uuid("actor_id").references(() => users.id),
	actorRole: roleEnum("actor_role"),
	actorIp: varchar("actor_ip", { length: 45 }),
	payload: jsonb("payload"),
	reason: text("reason"),
	prevHash: varchar("prev_hash", { length: 64 }),
	hash: varchar("hash", { length: 64 }).notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const complaintParties = pgTable("complaint_parties", {
	id: uuid("id").primaryKey().defaultRandom(),
	complaintId: uuid("complaint_id")
		.notNull()
		.references(() => complaints.id),
	personId: uuid("person_id")
		.notNull()
		.references(() => persons.id),
	role: partyRoleEnum("role").notNull(),
});

export const evidence = pgTable("evidence", {
	id: uuid("id").primaryKey().defaultRandom(),
	complaintId: uuid("complaint_id")
		.notNull()
		.references(() => complaints.id),
	kind: evidenceKindEnum("kind").notNull(),
	url: text("url").notNull(),
	sha256: varchar("sha256", { length: 64 }).notNull(),
	uploadedBy: uuid("uploaded_by").references(() => users.id),
	uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

// --- Auth.js ---

export const accounts = pgTable("accounts", {
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	type: varchar("type", { length: 255 }).notNull(),
	provider: varchar("provider", { length: 255 }).notNull(),
	providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
	refresh_token: text("refresh_token"),
	access_token: text("access_token"),
	expires_at: integer("expires_at"),
	token_type: varchar("token_type", { length: 255 }),
	scope: varchar("scope", { length: 255 }),
	id_token: text("id_token"),
	session_state: varchar("session_state", { length: 255 }),
});

export const sessions = pgTable("sessions", {
	sessionToken: varchar("session_token", { length: 255 })
		.notNull()
		.primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
	identifier: varchar("identifier", { length: 255 }).notNull(),
	token: varchar("token", { length: 255 }).notNull(),
	expires: timestamp("expires", { mode: "date" }).notNull(),
});
