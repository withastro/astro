export const createConfig = ({ renderers }: { renderers: string[] }) => {
  return [
    `export default {
  // projectRoot: '.',     // Where to resolve all URLs relative to. Useful if you have a monorepo project.
  // pages: './src/pages', // Path to Astro components, pages, and data
  // dist: './dist',       // When running \`astro build\`, path to final static output
  // public: './public',   // A folder of static files Astro will copy to the root. Useful for favicons, images, and other files that don’t need processing.
  buildOptions: {
    // site: 'http://example.com',           // Your public domain, e.g.: https://my-site.dev/. Used to generate sitemaps and canonical URLs.
    sitemap: true,         // Generate sitemap (set to "false" to disable)
  },
  devOptions: {
    // hostname: 'localhost',  // The hostname to run the dev server on. 
    // port: 3000,             // The port to run the dev server on.
    // tailwindConfig: '',     // Path to tailwind.config.js if used, e.g. './tailwind.config.js'
  },`,
    `  renderers: ${JSON.stringify(renderers, undefined, 2)
      .split('\n')
      .map((ln, i) => (i !== 0 ? `  ${ln}` : ln))
      .join('\n')},`,
    `};
`,
  ].join('\n');
};

export const createSnowpack = ({ renderers }: { renderers: {title: string, value: string}[] }): string => {
  let buildOptions: any = {}
  if(renderers.length > 0) {
    let reactRenderers = renderers.filter(r=>r.title.toLowerCase().includes('react'))
    // do not generate build options if preact and react are being used
    if(reactRenderers.length === 1) {
      let [renderer] = reactRenderers
      buildOptions.jsxFactory = renderer.title.toLowerCase() === 'preact' ? 'h' : 'React.createElement'
      buildOptions.jsxFragment = renderer.title.toLowerCase() === 'preact' ? 'Fragment' : 'React.Fragment'
      buildOptions.jsxInject = renderer.title.toLowerCase() === 'preact' ? `import {h,Fragment} from 'preact'` : `import React from 'react'`
    }
  }
  return `/** @type {import("snowpack").SnowpackUserConfig } */
    module.exports = {
      mount: {
        /* ... */
      },
      plugins: [
        /* ... */
      ],
      packageOptions: {
        /* ... */
      },
      devOptions: {
        /* ... */
      },
      buildOptions: ${buildOptions ? JSON.stringify(buildOptions, undefined, 2).split('\n')
      .map((ln, i) => (i !== 0 ? `\t${ln}` : ln))
      .join('\n') : `{
        /* ... */
      }`}
    }
    `
}
