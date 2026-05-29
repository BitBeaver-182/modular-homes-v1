"use client";

 
import { FileText, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utilities";

function formatBytes(bytes: number): string {
	if (bytes === 0) {
		return "0 B";
	}

	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const sizeIndex = Math.floor(Math.log(bytes) / Math.log(1024));

	return `${(bytes / 1024 ** sizeIndex).toFixed(sizeIndex ? 1 : 0)} ${sizes[sizeIndex]}`;
}

/** Lightweight MIME/extension check so drag-drop respects the `accept` prop. */
function matchesAccept(file: File, accept: string | undefined): boolean {
	if (!accept) {
		return true;
	}

	const tokens = accept
		.split(",")
		.map((t): string => t.trim().toLowerCase())
		.filter(Boolean);

	if (tokens.length === 0) {
		return true;
	}

	const name = file.name.toLowerCase();
	const type = file.type.toLowerCase();

	return tokens.some((token): boolean => {
		if (token.startsWith(".")) {
			return name.endsWith(token);
		}

		if (token.endsWith("/*")) {
			return type.startsWith(token.slice(0, -1));
		}

		return type === token;
	});
}

interface FileUploadInputProps {
	name?: string;
	accept?: string;
	maxFiles?: number;
	maxSize?: number;
	disabled?: boolean;
	emptyLabel: string;
	browseLabel: string;
	clearLabel: string;
	hint?: string;
	removeFieldName?: string;
	existingFile?: {
		href: string;
		name: string;
		size?: number;
	} | null;
	/** Called when the staged file list changes (including clear). */
	onFilesChange?: (files: File[]) => void;
	/** Called when the user removes the existing server file from the UI. */
	onExistingClear?: () => void;
}

export const FileUploadInput = ({
	name,
	accept,
	maxFiles = 1,
	maxSize,
	disabled = false,
	emptyLabel,
	browseLabel,
	clearLabel,
	hint,
	removeFieldName,
	existingFile = null,
	onFilesChange,
	onExistingClear,
}: FileUploadInputProps) => {
	const [files, setFiles] = useState<File[]>([]);
	const [clearedExistingFile, setClearedExistingFile] = useState(false);
	const [isDragOver, setIsDragOver] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setFiles([]);
		setClearedExistingFile(false);
	}, [existingFile?.href, existingFile?.name, existingFile?.size]);

	useEffect(() => {
		if (!name) {
			return;
		}

		const el = inputRef.current;
		if (!el) {
			return;
		}

		if (files.length === 0) {
			el.value = "";
			return;
		}

		const dt = new DataTransfer();
		for (const f of files) {
			dt.items.add(f);
		}

		el.files = dt.files;
	}, [files, name]);

	const hasNewFile = files.length > 0;
	const showExistingFile =
		Boolean(existingFile?.href && existingFile?.name) &&
		!clearedExistingFile &&
		!hasNewFile;

	const onPickFiles = (list: FileList | null) => {
		if (!list?.length) {
			return;
		}

		const next: File[] = [];
		for (let i = 0; i < list.length && next.length < maxFiles; i++) {
			const f = list.item(i);
			if (!f) {
				continue;
			}

			if (!matchesAccept(f, accept)) {
				continue;
			}

			if (maxSize !== undefined && f.size > maxSize) {
				continue;
			}

			next.push(f);
		}

		setFiles(next);
		onFilesChange?.(next);
	};

	const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
		event.preventDefault();
		setIsDragOver(false);
		if (disabled) {
			return;
		}

		onPickFiles(event.dataTransfer.files);
	};

	const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
		event.preventDefault();
		if (!disabled) {
			setIsDragOver(true);
		}
	};

	const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
		event.preventDefault();
		setIsDragOver(false);
	};

	return (
		<>
			{removeFieldName && clearedExistingFile ? (
				<input type="hidden" name={removeFieldName} value="1" readOnly />
			) : null}

			{name ? (
				<input
					ref={inputRef}
					type="file"
					name={name}
					className="sr-only"
					accept={accept}
					disabled={disabled}
					multiple={maxFiles > 1}
					onChange={(event) => {
						onPickFiles(event.target.files);
						event.target.value = "";
					}}
				/>
			) : null}

			<div
				className={cn(
					"border-muted-foreground/25 bg-muted/30 flex flex-col items-center gap-2 rounded-md border border-dashed px-3 py-5 transition-colors",
					isDragOver && "border-primary bg-primary/5",
					disabled && "pointer-events-none opacity-50",
				)}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
			>
				<div className="flex items-center justify-center gap-2 text-sm">
					<FileText className="text-muted-foreground size-5 shrink-0" />
					<span className="text-muted-foreground">{emptyLabel}</span>
					<button
						type="button"
						className={cn(
							"text-foreground font-semibold underline-offset-4 hover:underline",
							"focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none",
						)}
						disabled={disabled || !name}
						onClick={() => inputRef.current?.click()}
					>
						{browseLabel}
					</button>
				</div>
			</div>

			{showExistingFile && existingFile ? (
				<div
					role="listitem"
					className="relative mt-2 flex flex-row items-center gap-2.5 rounded-md border p-3"
				>
					<div
						className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border bg-accent/50 [&>svg]:size-10"
						aria-hidden
					>
						<FileText className="size-6 text-muted-foreground" />
					</div>
					<div className="flex min-w-0 flex-1 flex-col gap-0.5">
						<a
							href={existingFile.href}
							target="_blank"
							rel="noreferrer"
							className="truncate text-sm font-medium text-foreground underline-offset-2 hover:underline"
						>
							{existingFile.name}
						</a>
						{typeof existingFile.size === "number" ? (
							<span className="text-muted-foreground text-xs">
								{formatBytes(existingFile.size)}
							</span>
						) : null}
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-7 shrink-0"
						disabled={disabled}
						onClick={() => {
							setClearedExistingFile(true);
							onExistingClear?.();
						}}
						aria-label={clearLabel}
					>
						<X className="size-4" />
					</Button>
				</div>
			) : null}

			{files.map((file, index) => (
				<div
					key={`${file.name}-${file.size}-${index}`}
					className="relative mt-2 flex flex-row items-center gap-2.5 rounded-md border p-3"
				>
					<div
						className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border bg-accent/50"
						aria-hidden
					>
						<FileText className="size-6 text-muted-foreground" />
					</div>
					<div className="flex min-w-0 flex-1 flex-col gap-0.5">
						<span className="truncate text-sm font-medium">{file.name}</span>
						<span className="text-muted-foreground text-xs">
							{formatBytes(file.size)}
						</span>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-7 shrink-0"
						disabled={disabled}
						onClick={() => {
							setFiles((previous) => {
								const next = previous.filter((_, i) => i !== index);
								onFilesChange?.(next);
								return next;
							});
						}}
						aria-label={clearLabel}
					>
						<X className="size-4" />
					</Button>
				</div>
			))}

			{hint ? (
				<p className="text-muted-foreground mt-1.5 text-xs">{hint}</p>
			) : null}
		</>
	);
}
