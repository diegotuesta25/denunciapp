export type AppErrorCode =
	| "AUTH_REQUIRED"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "INVALID_INPUT"
	| "INVALID_TRANSITION"
	| "CHAIN_ERROR"
	| "DB_ERROR"
	| "RATE_LIMITED"
	| "UPLOAD_ERROR"
	| "UNKNOWN";

export type AppError = {
	code: AppErrorCode;
	message: string;
	detail?: string;
};

export type Result<T> =
	| { success: true; data: T }
	| { success: false; error: AppError };

export function ok<T>(data: T): Result<T> {
	return { success: true, data };
}

export function err<T>(
	code: AppErrorCode,
	message: string,
	detail?: string,
): Result<T> {
	return { success: false, error: { code, message, detail } };
}

export function isOk<T>(
	result: Result<T>,
): result is { success: true; data: T } {
	return result.success;
}
