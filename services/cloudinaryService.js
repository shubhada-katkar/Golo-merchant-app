const CLOUDINARY_CLOUD_NAME = "dcm1plq42";
const CLOUDINARY_UPLOAD_PRESET = "choja_preset";

function normalizeFileUri(uri) {
    if (!uri || typeof uri !== "string") {
        return null;
    }

    return uri.startsWith("file://") ? uri : uri;
}

function getFileExtension(filename = "") {
    const extensionMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extensionMatch?.[1]?.toLowerCase();
    if (!ext || ext === "tmp" || ext === "bin") {
        return "jpg";
    }
    return ext;
}

function getMimeType(resourceType, extension) {
    if (resourceType === "video") {
        if (extension === "mp4") return "video/mp4";
        if (extension === "mov") return "video/quicktime";
        if (extension === "webm") return "video/webm";
        return `video/${extension}`;
    }

    if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
    if (extension === "png") return "image/png";
    if (extension === "webp") return "image/webp";
    if (extension === "heic") return "image/heic";
    return `image/${extension}`;
}

async function uploadToCloudinary(fileUri, folder, resourceType) {
    const normalizedUri = normalizeFileUri(fileUri);
    if (!normalizedUri) {
        return {
            success: false,
            message: `Invalid ${resourceType} URI.`,
        };
    }

    const filename = normalizedUri.split("/").pop().split("?")[0] || `upload_${Date.now()}.${resourceType === "video" ? "mp4" : "jpg"}`;
    const extension = getFileExtension(filename);
    const mimeType = getMimeType(resourceType, extension);
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

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
    if (resourceType === "image") {
        formData.append("format", "png");
    }

    try {
        const response = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            return {
                success: false,
                message: data?.error?.message || `Cloudinary ${resourceType} upload failed.`,
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
            message: error?.message || `Cloudinary ${resourceType} upload failed.`,
        };
    }
}

export async function uploadImageToCloudinary(imageUri, folder = "golo/offer-banners") {
    return uploadToCloudinary(imageUri, folder, "image");
}

export async function uploadVideoToCloudinary(videoUri, folder = "golo/product-videos") {
    return uploadToCloudinary(videoUri, folder, "video");
}
