export const SIDEBAR = {
  en: [
    { text: 'Introduction', header: true },
    { text: 'Getting Started', link: 'getting-started' },
    { text: 'Example', link: 'example' },
  ],
  es: [
    { text: 'Introducción', header: true },
    { text: 'Empezando', link: 'es/getting-started' },
    { text: 'Ejemplo', link: 'es/example' },
  ],
  fr: [
    { text: 'Introduction', header: true },
    { text: 'Commencer', link: 'fr/getting-started' },
    { text: 'Exemple', link: 'fr/example' },
  ],
};

export const SITE = {
  title: 'Astro Documentation',
  description: 'Build faster websites with less client-side Javascript.',
};

export const OPEN_GRAPH = {
  locale: 'en_US',
  image: {
    src: 'https://github.com/snowpackjs/astro/blob/main/assets/social/banner.png?raw=true',
    alt: 'astro logo on a starry expanse of space,' + ' with a purple saturn-like planet floating in the right foreground',
  },
  twitter: 'astrodotbuild',
};
