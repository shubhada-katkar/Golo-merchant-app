const resolvedBaseUrl = (
	process.env.EXPO_PUBLIC_API_URL ||
	process.env.NEXT_PUBLIC_API_URL ||
	"https://api.golo.co.in"
).replace(/\/+$/, "");

export const BASE_URL = resolvedBaseUrl;