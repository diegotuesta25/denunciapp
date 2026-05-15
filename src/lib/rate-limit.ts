import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const complaintSubmitLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(5, "1h"),
	analytics: true,
	prefix: "denunciapp:submit",
});

export const trackingLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(30, "1m"),
	analytics: true,
	prefix: "denunciapp:track",
});

export const dashboardLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(60, "1m"),
	analytics: true,
	prefix: "denunciapp:dashboard",
});

export const verifyLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(20, "1m"),
	analytics: true,
	prefix: "denunciapp:verify",
});
