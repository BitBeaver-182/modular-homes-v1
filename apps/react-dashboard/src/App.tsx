import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";

import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { TanStackRouterDevelopmentTools } from "./components/utils/development-tools/TanStackRouterDevelopmentTools";

import type { FunctionComponent } from "./common/types";
import type { TanstackRouter } from "./main";


const queryClient = new QueryClient();

interface AppProps { router: TanstackRouter }

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
