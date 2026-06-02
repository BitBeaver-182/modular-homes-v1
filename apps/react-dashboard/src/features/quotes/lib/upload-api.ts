import { moduflowRequest } from "@/lib/moduflow/client";

import type {
	FileUploadResponse,
	PresignUploadResponse,
} from "@moduflow/types";

export interface PendingSupplierDocumentUpload {
	fileId: string;
}

export interface UploadApiContext {
	organizationId: string;
}

const organizationHeaders = ({
	organizationId,
}: UploadApiContext): HeadersInit => ({
	"x-organization-id": organizationId,
});

const presignSupplierDocument = async (
	context: UploadApiContext,
	file: File,
): Promise<PresignUploadResponse> =>
	moduflowRequest<PresignUploadResponse>("/uploads/presign", {
		body: {
			filename: file.name,
			mimeType: file.type || "application/octet-stream",
			context: "SUPPLIER_DOCUMENT",
		},
		headers: organizationHeaders(context),
		method: "POST",
	});

const uploadPresignedSupplierDocument = async (
	file: File,
	uploadUrl: string,
): Promise<void> => {
	const uploadResponse = await fetch(uploadUrl, {
		body: file,
		headers: {
			"Content-Type": file.type || "application/octet-stream",
		},
		method: "PUT",
	});

	if (!uploadResponse.ok) {
		throw new Error("File upload failed");
	}
};

export const deleteSupplierDocumentUpload = async (
	context: UploadApiContext,
	fileId: string,
): Promise<void> =>
	moduflowRequest<void>(`/uploads/${encodeURIComponent(fileId)}`, {
		headers: organizationHeaders(context),
		method: "DELETE",
	});

export const createPendingSupplierDocumentUpload = async (
	context: UploadApiContext,
	file: File,
): Promise<PendingSupplierDocumentUpload> => {
	const presigned = await presignSupplierDocument(context, file);

	try {
		await uploadPresignedSupplierDocument(file, presigned.uploadUrl);

		return {
			fileId: presigned.fileId,
		};
	} catch (error) {
		void deleteSupplierDocumentUpload(context, presigned.fileId).catch(
			() => undefined,
		);
		throw error;
	}
};

export const uploadSupplierDocument = async (
	context: UploadApiContext,
	file: File
): Promise<FileUploadResponse> => {
	const presigned = await presignSupplierDocument(context, file);

	try {
		await uploadPresignedSupplierDocument(file, presigned.uploadUrl);

		return await moduflowRequest<FileUploadResponse>(
			`/uploads/${encodeURIComponent(presigned.fileId)}/confirm`,
			{
				headers: organizationHeaders(context),
				method: "POST",
			}
		);
	} catch (error) {
		void deleteSupplierDocumentUpload(context, presigned.fileId).catch(
			() => undefined,
		);
		throw error;
	}
};
