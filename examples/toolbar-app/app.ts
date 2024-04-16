import { defineToolbarApp } from 'astro:toolbar';

// https://docs.astro.build/en/reference/dev-toolbar-app-reference/
export default defineToolbarApp({
	init(canvas) {
		const astroWindow = document.createElement('astro-dev-toolbar-window');

		const text = document.createElement('p');
		text.textContent = 'Hello, Astro!';

		astroWindow.appendChild(text);

		canvas.appendChild(astroWindow);
	},
});
