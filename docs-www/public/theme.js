(() => {
  const root = document.documentElement;
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('theme-dark');
  } else {
    root.classList.remove('theme-dark');
  }
})();
