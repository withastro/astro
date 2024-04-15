import { defineToolbarApp } from 'astro:toolbar';

export default defineToolbarApp({
	init(canvas) {
		const astroWindow = document.createElement('astro-dev-toolbar-window');

		const text = document.createElement('p');
		text.textContent = 'Hello, Astro!';

		astroWindow.appendChild(text);
		canvas.appendChild(astroWindow);
	},
});
