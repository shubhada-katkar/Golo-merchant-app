"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
	signInWithPopup,
	GoogleAuthProvider,
	FacebookAuthProvider,
	OAuthProvider,
} from "firebase/auth";
import { firebaseAuth } from "../lib/firebase-client";
import { socialAuthUser } from "../lib/api";

const providerFactory = {
	google: () => {
		const provider = new GoogleAuthProvider();
		provider.setCustomParameters({ prompt: "select_account" });
		return provider;
	},
	facebook: () => {
		const provider = new FacebookAuthProvider();
		provider.addScope("email");
		return provider;
	},
	apple: () => {
		const provider = new OAuthProvider("apple.com");
		provider.addScope("email");
		provider.addScope("name");
		return provider;
	},
};

export default function SocialButtons({ redirectPath = "/" }) {
	const router = useRouter();
	const { refreshProfile } = useAuth();
	const [loadingProvider, setLoadingProvider] = useState("");
	const [error, setError] = useState("");

	const handleSocialAuth = async (providerKey) => {
		setError("");
		setLoadingProvider(providerKey);

		try {
			if (!firebaseAuth) {
				throw new Error("Social login is not configured yet.");
			}

			const provider = providerFactory[providerKey]?.();
			if (!provider) {
				throw new Error("Unsupported social provider.");
			}

			const result = await signInWithPopup(firebaseAuth, provider);
			const socialUser = result?.user;
			const email = socialUser?.email;

			if (!email) {
				throw new Error("Your social account did not return an email. Please use another method.");
			}

			const fullName = socialUser?.displayName || email.split("@")[0] || "GOLO User";
			const phone = socialUser?.phoneNumber || undefined;

			const backendAuth = await socialAuthUser({
				name: fullName,
				email,
				provider: providerKey,
				phone,
			});

			const authData = backendAuth?.data;
			if (!authData?.accessToken || !authData?.refreshToken || !authData?.user) {
				throw new Error("Social login response is invalid.");
			}

			localStorage.setItem("accessToken", authData.accessToken);
			localStorage.setItem("refreshToken", authData.refreshToken);
			localStorage.setItem("user", JSON.stringify(authData.user));

			await refreshProfile();
			router.push(redirectPath || "/");
		} catch (authError) {
			setError(authError?.message || "Social sign-in failed. Please try again.");
		} finally {
			setLoadingProvider("");
		}
	};

	return (
		<>
			<div className="social-buttons">
				<button
					type="button"
					className="social-btn google"
					disabled={Boolean(loadingProvider)}
					onClick={() => handleSocialAuth("google")}
				>
					<span className="icon">G</span>
					{loadingProvider === "google" ? "Connecting..." : "Google"}
				</button>

				<button
					type="button"
					className="social-btn facebook"
					disabled={Boolean(loadingProvider)}
					onClick={() => handleSocialAuth("facebook")}
				>
					<span className="icon">f</span>
					{loadingProvider === "facebook" ? "Connecting..." : "Facebook"}
				</button>

				<button
					type="button"
					className="social-btn apple"
					disabled={Boolean(loadingProvider)}
					onClick={() => handleSocialAuth("apple")}
				>
					<span className="icon"></span>
					{loadingProvider === "apple" ? "Connecting..." : "Apple"}
				</button>
			</div>

			{error && (
				<p style={{ color: "red", fontSize: "13px", marginTop: "10px", marginBottom: "10px", textAlign: "center" }}>
					{error}
				</p>
			)}
		</>
	);
}
