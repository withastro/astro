export const SITE = {
  title: 'Your Documentation Website',
  description: 'Your website description.',
  lang: 'en',
  dir: 'ltr',
  image: {
    src: 'https://github.com/snowpackjs/astro/blob/main/assets/social/banner.png?raw=true',
    alt: 'The Astro logo over an outerspace background image, with stars and planets.',
  },
};

export const KNOWN_LANGUAGES = {
  English: 'en',
};

// Uncomment this to add an "Edit this page" button to every page of documentation.
// The path of the page content is always appended to this URL.
// export const EDIT_URL = `https://github.com/snowpackjs/astro/blob/main/docs/`;

// Uncomment this to add an "Join our Community" button to every page of documentation.
// export const COMMUNITY_URL = `https://astro.build/chat`;

// Uncomment this to enable the Twitter SEO meta tag.
// export const TWITTER = 'astrodotbuild';

// Uncomment this to enable site search.
// See "Algolia" section of the README for more information.
// export const ALGOLIA = {
//   indexName: 'XXXXXXXXXX',
//   apiKey: 'XXXXXXXXXX',
// }

export const SIDEBAR = {
  en: [
    { text: 'Section Header', header: true },
    { text: 'Introduction', link: 'en/introduction' },
    { text: 'Page 2', link: 'en/page-2' },
    { text: 'Page 3', link: 'en/page-3' },

    { text: 'Another Section', header: true },
    { text: 'Page 4', link: 'en/page-4' },
  ],
};
