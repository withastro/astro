async function polyfill() {
	const { hydrateShadowRoots } = await import(
		'@webcomponents/template-shadowroot/template-shadowroot.js'
	);
	const listener = () => hydrateShadowRoots(document.body);
	document.addEventListener('astro:after-swap', listener);
	window.addEventListener('DOMContentLoaded', listener, {
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
