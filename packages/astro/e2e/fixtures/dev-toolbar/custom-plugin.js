export default {
	id: 'my-plugin',
	name: 'My Plugin',
	icon: 'astro:logo',
	init(canvas) {
		const astroWindow = document.createElement('astro-dev-toolbar-window');
		const myButton = document.createElement('astro-dev-toolbar-button');
		myButton.size = 'medium';
		myButton.buttonStyle = 'purple';
		myButton.innerText = 'Click me!';

		myButton.addEventListener('click', () => {
			console.log('Clicked!');
		});

		astroWindow.appendChild(myButton);

		canvas.appendChild(astroWindow);
	},
};
