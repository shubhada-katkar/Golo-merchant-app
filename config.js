const resolvedBaseUrl = (
	process.env.EXPO_PUBLIC_API_URL ||
	process.env.NEXT_PUBLIC_API_URL ||
	"https://golo-backend-89vm.onrender.com"
).replace(/\/+$/, "");

export const BASE_URL = resolvedBaseUrl;