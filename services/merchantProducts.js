import { BASE_URL } from "../config";

export async function fetchMerchantProducts({ token, page = 1, limit = 100, search = "" } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append("search", search);

    const response = await fetch(`${BASE_URL}/merchant/products?${params.toString()}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const responseBody = await response.json().catch(() => ({ message: "Invalid server response" }));

    if (!response.ok) {
        const errorMessage = responseBody?.message || "Failed to fetch merchant products.";
        throw new Error(errorMessage);
    }

    return responseBody;
}
