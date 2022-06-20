---
'@astrojs/lit': minor
---

Conform to Constructor based rendering

This changes `@astrojs/lit` to conform to the way rendering happens in all other frameworks. Instead of using the tag name `<my-element client:load>` you use the imported constructor function, `<MyElement client:load>` like you would do with any other framework.

Support for `tag-name` syntax had to be removed due to the fact that it was a runtime feature that was not statically analyzable. To improve build performance, we have removed all runtime based component discovery. Using the imported Constructor name allows Astro to discover what components need to be built and bundled for production without ever running your file.
