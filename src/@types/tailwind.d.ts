// we shouldn‘t have this as a dependency for Astro, but we may dynamically import it if a user requests it, so let TS know about it
declare module 'tailwindcss';
declare module '@tailwindcss/jit';
