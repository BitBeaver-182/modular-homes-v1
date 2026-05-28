import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import type { FunctionComponent } from "./common/types";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/sonner";
import type { TanstackRouter } from "./main";
import { TanStackRouterDevelopmentTools } from "./components/utils/development-tools/TanStackRouterDevelopmentTools";
import { ThemeProvider } from "./components/theme-provider";

const queryClient = new QueryClient();

type AppProps = { router: TanstackRouter };

const App = ({ router }: AppProps): FunctionComponent => {
	return (
		<ThemeProvider>
			<QueryClientProvider client={queryClient}>
				<TooltipProvider>
					<RouterProvider router={router} />
				</TooltipProvider>
				<Toaster />
				<TanStackRouterDevelopmentTools
					initialIsOpen={false}
					position="bottom-left"
					router={router}
				/>
				<ReactQueryDevtools initialIsOpen={false} position="bottom" />
			</QueryClientProvider>
		</ThemeProvider>
	);
};

export default App;
