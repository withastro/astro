const nav = document.querySelector('body > header');

if (!window.matchMedia('(prefers-reduced-motion)').matches) {
  window.addEventListener('scroll', onScroll, { passive: true });
}

let prev = -1;
let prevDir = 0;
let threshold = 32;

function onScroll() {
  const curr = window.scrollY;
  const dir = curr > prev ? 1 : -1;
  
  if (curr < threshold) {
    show();
    document.documentElement.classList.add('initial');
  } else if (dir !== prevDir) {
    if (dir === 1) {
      hide();
    } else {
      show();
    }
  }
  
  prev = curr;
}

const hide = () => {
  nav.classList.add('hidden')
  document.documentElement.classList.add('scrolled');
  document.documentElement.classList.remove('initial');
};
const show = () => {
  nav.classList.remove('hidden');
  document.documentElement.classList.remove('scrolled');
}
