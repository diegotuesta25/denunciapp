const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateTrackingCode(): string {
	const randomPart = Array.from(
		{ length: 7 },
		() => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
	).join("");

	return `DEN-${randomPart}`;
}
