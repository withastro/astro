import { createContext, useContext } from 'react';
import type { AppEntrypointProps } from '@astrojs/react';

const ThemeContext = createContext<string>('light');

export function useTheme() {
	return useContext(ThemeContext);
}

export default function Wrapper({ children, locals }: AppEntrypointProps) {
	return (
		<ThemeContext.Provider value="dark">
			<div data-testid="wrapper" data-server={locals?.serverData}>
				{children}
			</div>
		</ThemeContext.Provider>
	);
}
