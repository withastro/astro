async function polyfill() {
	const { hydrateShadowRoots } = await import(
		'@webcomponents/template-shadowroot/template-shadowroot.js'
	);
	window.addEventListener('DOMContentLoaded', () => hydrateShadowRoots(document.body), {
		once: true,
	});
}

const polyfillCheckEl = document
	.parseHTMLUnsafe(`<p><template shadowrootmode="open"></template></p>`)
	.querySelector('p');

if (!polyfillCheckEl?.shadowRoot) {
	polyfill();
}
