async function polyfill() {
	const { hydrateShadowRoots } = await import(
		'@webcomponents/template-shadowroot/template-shadowroot.js'
	);
	window.addEventListener('DOMContentLoaded', () => hydrateShadowRoots(document.body), {
		once: true,
	});
}

const polyfillCheckEl = new DOMParser()
	.parseFromString(
		`<p><template shadowroot="open" shadowrootmode="open"></template></p>`,
		'text/html',
		{
			includeShadowRoots: true,
		}
	)
	.querySelector('p');

if (!polyfillCheckEl?.shadowRoot) {
	polyfill();
}
