 
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";

export interface QuotesEmptyStateProps {
	onAddQuote: () => void;
}

export const QuotesEmptyState = ({ onAddQuote }: QuotesEmptyStateProps) => {
	const { t } = useTranslation();

	return (
		<div className="flex flex-1 flex-col items-center justify-center py-8">
			<Empty>
				<EmptyHeader>
					<EmptyTitle>{t("quotes.emptyStateTitle")}</EmptyTitle>
					<EmptyDescription>{t("quotes.emptyStateDescription")}</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button
						size="lg"
						type="button"
						onClick={onAddQuote}
					>
						<Plus className="size-4" />
						{t("quotes.addQuote")}
					</Button>
				</EmptyContent>
			</Empty>
		</div>
	);
};
