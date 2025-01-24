---
'@astrojs/tailwind': major
---

Drops support for Astro <= 5.0 and Tailwind <= 4.0

Tailwind CSS now offers a Vite plugin which is the preferred way to use Tailwind 4 in Astro. This Astro integration is now provided only as a convenience for existing projects if you're unable to upgrade to the Vite plugin at this time. You may continue to use this integration until it is removed.

However, we recommend that you uninstall this integration as soon as you are able. The `astro add tailwind` command will now set up the Vite plugin for you and will no longer install this integration. Or, you can follow the [Tailwind documentation for manual installation](https://tailwindcss.com/docs/installation/framework-guides/astro).

Note the `nesting` option is removed as it's supported out of the box.
