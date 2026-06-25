const resolvedBaseUrl = (
	process.env.EXPO_PUBLIC_API_URL ||
	process.env.NEXT_PUBLIC_API_URL ||
	""
).replace(/\/+$/, "");

export const BASE_URL = resolvedBaseUrl;