import { moduflowRequest } from "@/lib/moduflow/client";

import type {
	FileUploadResponse,
	PresignUploadResponse,
} from "@moduflow/types";

export interface UploadApiContext {
	organizationId: string;
}

const organizationHeaders = ({
	organizationId,
}: UploadApiContext): HeadersInit => ({
	"x-organization-id": organizationId,
});

export const uploadSupplierDocument = async (
	context: UploadApiContext,
	file: File
): Promise<FileUploadResponse> => {
	const presigned = await moduflowRequest<PresignUploadResponse>(
		"/uploads/presign",
		{
			body: {
				filename: file.name,
				mimeType: file.type || "application/octet-stream",
				context: "SUPPLIER_DOCUMENT",
			},
			headers: organizationHeaders(context),
			method: "POST",
		}
	);

	const uploadResponse = await fetch(presigned.uploadUrl, {
		body: file,
		headers: {
			"Content-Type": file.type || "application/octet-stream",
		},
		method: "PUT",
	});

	if (!uploadResponse.ok) {
		throw new Error("File upload failed");
	}

	return moduflowRequest<FileUploadResponse>(
		`/uploads/${encodeURIComponent(presigned.fileId)}/confirm`,
		{
			headers: organizationHeaders(context),
			method: "POST",
		}
	);
};
