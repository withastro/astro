document.querySelector('button')?.addEventListener('click', async () => {
	const { mount } = await import('./widget.js');
	mount();
});
