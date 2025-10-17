import { useContext } from 'react';
import { ThemeContext } from './ThemeContext.jsx';

export default function ThemeConsumer({ id }) {
	const context = useContext(ThemeContext);

	// If context is not available, it will be the default value 'light' (string)
	// If context is available, it will be an object with { theme, setTheme }
	const isContextAvailable = typeof context === 'object' && context !== null;
	const currentTheme = isContextAvailable ? context.theme : context;

	return (
		<div data-theme-consumer={id} data-has-context={isContextAvailable}>
			Current theme: {currentTheme}
		</div>
	);
}
