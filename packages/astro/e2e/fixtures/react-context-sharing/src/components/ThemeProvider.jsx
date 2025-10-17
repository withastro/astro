import { useState } from 'react';
import { ThemeContext } from './ThemeContext.jsx';

export default function ThemeProvider({ children }) {
	const [theme, setTheme] = useState('light');

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			<div data-theme-provider={theme}>
				{children}
			</div>
		</ThemeContext.Provider>
	);
}
