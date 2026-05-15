import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.SENTRY_DSN,
	tracesSampleRate: 1.0,
	environment: process.env.NODE_ENV,

	ignoreErrors: ["NEXT_NOT_FOUND", "NEXT_REDIRECT"],

	beforeSend(event) {
		if (event.user) {
			delete event.user.email;
			delete event.user.ip_address;
		}
		return event;
	},
});
