async function polyfill() {
  const { hydrateShadowRoots } = await import('@webcomponents/template-shadowroot/template-shadowroot.js');
  hydrateShadowRoots(document.body);
}

if (
  !new DOMParser()
    .parseFromString(`<p><template shadowroot="open"></template></p>`, 'text/html', {
      includeShadowRoots: true,
    })
    .querySelector('p')?.shadowRoot
)
  polyfill();
