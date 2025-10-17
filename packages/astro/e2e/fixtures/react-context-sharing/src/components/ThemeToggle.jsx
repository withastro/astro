import { useContext } from 'react';
import { ThemeContext } from './ThemeContext.jsx';

export default function ThemeToggle() {
	const context = useContext(ThemeContext);
	const isContextAvailable = typeof context === 'object' && context !== null;

	if (!isContextAvailable) {
		return <button data-theme-toggle disabled>No context available</button>;
	}

	const { theme, setTheme } = context;

	return (
		<button
			data-theme-toggle
			onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
		>
			Toggle theme (current: {theme})
		</button>
	);
}
