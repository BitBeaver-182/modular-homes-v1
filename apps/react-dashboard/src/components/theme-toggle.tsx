import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();

	const isDark = resolvedTheme === "dark";

	return (
		<Button
			aria-label="Toggle dark mode"
			onClick={() => setTheme(isDark ? "light" : "dark")}
			size="icon-sm"
			type="button"
			variant="outline"
		>
			{isDark ? <SunIcon /> : <MoonIcon />}
		</Button>
	);
}

