document.querySelector('#injected').addEventListener('click', async () => {
	const { mount } = await import('./widget.js');
	mount('injected');
});
