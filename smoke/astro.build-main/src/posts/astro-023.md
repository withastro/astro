---
title: 'Astro 0.23 Release Notes'
description: 'Introducing: Dynamic file routes • Automatic XSS protection • two new component directives • vite 2.8 • and more!'
publishDate: 'February 19, 2022'
socialImage: '/assets/blog/astro-023/social.jpg'
lang: 'en'
authors: 
  - fred
---

**Astro v0.23.0** has just been released with some new features and highlights:

- [Dynamic File Routes](#dynamic-file-routes)
- [Automatic XSS Protection](#automatic-xss-protection)
- [New `set:html` and `set:text` directives](#new-sethtml-and-settext-directives)
- [Safe access to sensitive environment variables](#safe-access-to-sensitive-environment-variables)
- [Better builds with Vite v2.8](#better-builds-with-vite-v28)
- [Better stability with @astro/compiler v0.11](#better-stability-with-astrocompiler-v011)
- [Better build performance with `--experimental-static-builds`](#better-build-performance)

## Dynamic File Routes

You can now build dynamic, non-HTML files in your project by using Astro's new **file routes**. Use file routes to dynamically generate files during your build for things like JSON, XML, or even non-text assets like images. This feature has been one of our most requested since the early days of Astro!

To create a file route inside of your Astro project, create a new JavaScript or TypeScript file inside of your `src/pages` directory. File routes leverage Astro's existing file-based router, so be sure to include the final built file extension in the filename.


```js
// Example: src/pages/builtwith.json.ts
// Outputs: /builtwith.json

// File routes export a get() function, which gets called to generate the file.
// Return an object with `body` to save the file contents in your final build.
export async function get() {
  return {
    body: JSON.stringify({
      name: 'Astro',
      url: 'https://astro.build/',
    }),
  };
}
```

This feature is only available with the `--experimental-static-build` flag. [To learn more, check out the docs.](https://docs.astro.build/en/core-concepts/astro-pages/#non-html-pages)

## Automatic XSS Protection

Astro v0.23 begins our migration towards automatic HTML escaping inside of Astro template expressions. This new feature will protect you from accidentally injecting untrusted HTML onto your page. Without it, you open yourself up to Cross Site Scripting (XSS) attacks where malicious users can hijack your site to run untrusted or unexpected code on the page.

```astro
<!-- Examples of untrusted HTML injection -->
<div>{`<span>Hello, dangerous HTML</span>`}</div>
<div>{`<script>alert('oh no');</script>`}</div>
<div>{untrustedHtml}</div>
```

Thanks to React and other component-based UI libraries, XSS vulnerabilities are becoming a thing of the past. Astro is excited to meet this same bar of zero-effort, built-in, automatic XSS protection.

To help our users migrate, Astro v0.23 will log a warning to the console when unescaped HTML is encountered inside of a template expression. In the next version, template expressions will always escape their contents.

## New `set:html` and `set:text` directives

Two new directives are introduced to support better HTML injection when you need it. As we covered in the previous section, setting HTML directly is risky. However, in some special cases it may be required. Astro created the new `set:html` directive for those cases. You can think of it like React's `dangerouslySetInnerHTML`.

```astro
<!-- Examples of explicit HTML setting -->
<div set:html={`<span>Hello, trusted or already escaped HTML</span>`}></div>
<div set:html={`<script>alert('oh yes');</script>`}></div>
<div set:html={trustedOrAlreadyEscapedHtml}></div>
```

If you don't want a `<div>` wrapper, you can also use `set:html` on the Fragment component for zero wrapping HTML:

```
- {`<span>Hello, dangerous HTML</span>`}
+ <Fragment set:html={`<span>Hello, trusted or already escaped HTML</span>`} />
```

`set:text` is also available to set the element text directly, similar to setting the `.text` property on an element in the browser. Together, these two directives give you a bit more control over the Astro output when you need it.

## Safe access to sensitive environment variables

For security, Vite only loads environment variables that are explicitly opted-in to be exposed with a `PUBLIC_` prefix. This restriction makes sense in the browser, and protects you from accidentally leaking secret tokens and values. However, it also meant that private environment variables weren't available to you at all, even locally inside of server-rendered Astro components.

<p>In Astro v0.23, <code>import&#46;meta&#46;env</code> now lets you access your private environment variables inside of Astro and anytime code renders locally or on the server. Astro will continue to protect you on the client, and only expose <code>PUBLIC_</code> variables to the frontend that ships to your users.</p>

```js
// DB_PASSWORD is only available when building your site.
// If any code tried to run this in the browser, it will be empty.
const data = await db(import.meta.env.DB_PASSWORD);

// PUBLIC_POKEAPI is available anywhere, thanks to the PUBLIC_ prefix!
const data = fetch(`${import.meta.env.PUBLIC_POKEAPI}/pokemon/squirtle`);
```

See our [Environment Variables documentation](https://docs.astro.build/en/guides/environment-variables/) to learn more.

## Better builds with Vite v2.8

Astro v0.23 comes with an internal Vite upgrade that brings new features and huge stability improvements. Vite's npm package handling got a boost as well, so that more packages should work in more projects. [Check out their changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md) to learn more.

## Better stability with @astro/compiler v0.11

Astro v0.23 also got a compiler upgrade which should result in noticeable performance and stability improvements across all projects. [Check out the changelog](https://github.com/withastro/compiler/releases) to learn more.

## Better build performance
You may have noticed the reference to `--experimental-static-build` above, and the fact that some new features are only available behind this flag. This flag is not new in v0.23, but it continues to improve as we get closer to an official release of the feature. This new "static build" strategy will soon become the default build behavior in Astro.

If you haven't tried the `--experimental-static-build` flag out yet in your build, please give it a try and leave us feedback in Discord. Check out our blog post [Scaling Astro to 10,000+ Pages](/blog/experimental-static-build) to learn more about this future build strategy for Astro.


## 👋

Thank you for reading! [Follow us on Twitter](https://twitter.com/astrodotbuild) to stay up to date on Astro releases and news. 

If you've read this far, you should definitely [join us on Discord.](https://astro.build/chat) ;)
