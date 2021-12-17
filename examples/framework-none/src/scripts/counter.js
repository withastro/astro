// This script will be built by Astro.
// Feel free to use web-friendly dependencies!

function init(el) {
  const output = el.querySelector('pre');

  let count = Number(output.textContent);
  const handlers = {
    decrement: () => count--,
    increment: () => count++,
  }

  el.addEventListener('click', ({ target }) => {
    const key = Object.keys(target.dataset)[0];
    handlers[key]?.();
    output.textContent = count;
  })
}

document.querySelectorAll('.counter').forEach(el => init(el));
