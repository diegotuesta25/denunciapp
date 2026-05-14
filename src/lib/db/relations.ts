import { relations } from "drizzle-orm";
import {
	users,
	complaints,
	complaintEvents,
	complaintParties,
	persons,
	evidence,
	accounts,
	sessions,
	jurisdictions,
} from "./schema";

export const usersRelations = relations(users, ({ many, one }) => ({
	complaints: many(complaints),
	events: many(complaintEvents),
	jurisdiction: one(jurisdictions, {
		fields: [users.jurisdictionId],
		references: [jurisdictions.id],
	}),
}));

export const complaintsRelations = relations(complaints, ({ one, many }) => ({
	jurisdiction: one(jurisdictions, {
		fields: [complaints.jurisdictionId],
		references: [jurisdictions.id],
	}),
	complainant: one(users, {
		fields: [complaints.complainantId],
		references: [users.id],
	}),
	events: many(complaintEvents),
	parties: many(complaintParties),
	evidence: many(evidence),
}));

export const complaintEventsRelations = relations(
	complaintEvents,
	({ one }) => ({
		complaint: one(complaints, {
			fields: [complaintEvents.complaintId],
			references: [complaints.id],
		}),
		actor: one(users, {
			fields: [complaintEvents.actorId],
			references: [users.id],
		}),
	}),
);

export const complaintPartiesRelations = relations(
	complaintParties,
	({ one }) => ({
		complaint: one(complaints, {
			fields: [complaintParties.complaintId],
			references: [complaints.id],
		}),
		person: one(persons, {
			fields: [complaintParties.personId],
			references: [persons.id],
		}),
	}),
);

export const personsRelations = relations(persons, ({ many }) => ({
	parties: many(complaintParties),
}));

export const evidenceRelations = relations(evidence, ({ one }) => ({
	complaint: one(complaints, {
		fields: [evidence.complaintId],
		references: [complaints.id],
	}),
}));

export const jurisdictionsRelations = relations(
	jurisdictions,
	({ one, many }) => ({
		parent: one(jurisdictions, {
			fields: [jurisdictions.parentId],
			references: [jurisdictions.id],
			relationName: "jurisdiction_hierarchy",
		}),
		children: many(jurisdictions, {
			relationName: "jurisdiction_hierarchy",
		}),
	}),
);
