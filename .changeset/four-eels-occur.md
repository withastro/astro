---
'@astrojs/netlify': minor
---

Updates the adapter to use Netlify's [Vite plugin](https://www.npmjs.com/package/@netlify/vite-plugin) in development.

This is an implementation update that does not require any change to your project code, but means that `astro dev` will run with an environment closer to a production deploy on Netlify. This brings several benefits you'll now notice working in dev mode!

For example, your project running in development mode will now use local versions of the Netlify Image CDN for images, and a local Blobs server for sessions. It will also will populate your environment with the variables from your linked Netlify site.

While not required for fully static, prerendered web sites, you may still wish to add this for the additional benefits of now working in a dev environment closer to your Netlify production deploy, as well as to take advantage of Netlify-exclusive features such as the Netlify Image CDN.
