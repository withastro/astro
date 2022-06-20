---
'@astrojs/lit': minor
---

Conform to Constructor based rendering

This changes `@astrojs/lit` to conform to the way rendering happens in all other frameworks. Instead of using the tag name `<my-element client:load>` you use the imported constructor function, `<MyElement client:load>` like you would do with any other framework.

Removing the tagName had to be removed due to the fact that it was a run-time feature. To improve build performance we have removed all run-time based component discovery. Using the imported Constructor name allows Astro to know what components need to be built and bundled for production.
