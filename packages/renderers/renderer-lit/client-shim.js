async function polyfill() {
  const { hydrateShadowRoots } = await import('@webcomponents/template-shadowroot/template-shadowroot.js');
  hydrateShadowRoots(document.body);
}

const polyfillCheckEl = new DOMParser().parseFromString(`<p><template shadowroot="open"></template></p>`, 'text/html', { includeShadowRoots: true }).querySelector('p');

if (!polyfillCheckEl || !polyfillCheckEl.shadowRoot) {
  polyfill();
}
