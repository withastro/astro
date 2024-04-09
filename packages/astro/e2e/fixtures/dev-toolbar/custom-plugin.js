import { defineToolbarApp } from "astro:toolbar";

export default defineToolbarApp({
	init(canvas, app) {
		const astroWindow = document.createElement('astro-dev-toolbar-window');
		const myButton = document.createElement('astro-dev-toolbar-button');
		myButton.size = 'medium';
		myButton.buttonStyle = 'purple';
		myButton.innerText = 'Click me!';

		myButton.addEventListener('click', () => {
			console.log('Clicked!');
		});

		app.toggleNotification({
			state: true,
			level: 'warning'
		})

		astroWindow.appendChild(myButton);

		canvas.appendChild(astroWindow);
	},
});
