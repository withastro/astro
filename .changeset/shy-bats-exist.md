---
'@astrojs/mdx': minor
'@astrojs/internal-helpers': minor
'@astrojs/markdown-remark': minor
'astro': minor
---

Adds the ability to process and optimize remote images in Markdown files

Previously, Astro only allowed local images to be optimized when included using `![]()` syntax in plain Markdown files. Astro's image service could only display remote images without any processing. 

Now, Astro's image service can also optimize remote images written in standard Markdown syntax. This allows you to enjoy the benefits of Astro's image processing when your images are stored externally, for example in a CMS or digital asset manager.

No additional configuration is required to use this feature! Any existing remote images written in Markdown will now automatically be optimized. To opt-out of this processing, write your images in Markdown using the HTML `<img>` tag instead. Note that images located in your `public/` folder are still never processed.
