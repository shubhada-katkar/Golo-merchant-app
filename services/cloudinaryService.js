const CLOUDINARY_CLOUD_NAME = "dcm1plq42";
const CLOUDINARY_UPLOAD_PRESET = "choja_preset";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

function normalizeImageUri(uri) {
    if (!uri || typeof uri !== "string") {
        return null;
    }

    return uri.startsWith("file://") ? uri : uri;
}

export async function uploadImageToCloudinary(imageUri, folder = "golo/offer-banners") {
    const normalizedUri = normalizeImageUri(imageUri);
    if (!normalizedUri) {
        return { success: false, message: "Invalid image URI." };
    }

    const filename = normalizedUri.split("/").pop().split("?")[0] || `upload_${Date.now()}.jpg`;
    const extensionMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
    const extension = extensionMatch?.[1] || "jpg";
    const mimeType = `image/${extension === "jpg" ? "jpeg" : extension}`;

    const formData = new FormData();
    formData.append("file", {
        uri: normalizedUri,
        type: mimeType,
        name: filename,
    });
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    if (folder) {
        formData.append("folder", folder);
    }

    try {
        const response = await fetch(CLOUDINARY_UPLOAD_URL, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            return {
                success: false,
                message: data?.error?.message || "Cloudinary upload failed.",
                raw: data,
            };
        }

        return {
            success: true,
            url: data.secure_url,
            publicId: data.public_id,
            raw: data,
        };
    } catch (error) {
        return {
            success: false,
            message: error?.message || "Cloudinary upload failed.",
        };
    }
}
