async function loop(element: Element) {
    const animations = element.getAnimations({ subtree: true });
    await Promise.all(animations.map(anim => anim.finished));
    // reset the animation after 3.5 seconds
    setTimeout(() => {
        const clone = element.cloneNode(true)
        element.replaceWith(clone);
        loop(clone as Element);
    }, 3500)
}

function setup() {
    const illustrations = Array.from(document.querySelectorAll('.illustration'));
    const hydrate = illustrations.find(el => (el as HTMLElement).dataset.name === 'hydration');
    loop(hydrate);
}
setup();

window.addEventListener('astro:navchange', () => {
    setup();
});
