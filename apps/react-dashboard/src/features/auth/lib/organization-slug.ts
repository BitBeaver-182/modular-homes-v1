export const ORGANIZATION_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugifyOrganizationName = (value: string): string =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);

export const validateOrganizationSlug = (slug: string): string | null => {
	if (!slug) {
		return "Organization slug is required";
	}

	if (!ORGANIZATION_SLUG_PATTERN.test(slug)) {
		return "Use lowercase letters, numbers, and single hyphens";
	}

	if (slug.length > 80) {
		return "Organization slug must be 80 characters or fewer";
	}

	return null;
};
