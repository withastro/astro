const checkbox = document.querySelector('#marquee-pause');
function onChange(element) {
    const paused = element.checked;
    localStorage.setItem('astro:marquee-paused', `${paused}`);
}
checkbox.addEventListener('change', ({ target }) => onChange(target))
checkbox.addEventListener('keydown', event => {
    const { key, target } = event as KeyboardEvent
    if (key !== 'Enter') return;
    onChange(target);
})