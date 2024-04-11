---
"@astrojs/mdx": patch
---

Fixes an issue where images in MDX required a relative specifier (e.g. `./`)

Now, you can use the standard `![](img.png)` syntax in MDX files for images colocated in the same folder: no relative specifier required!

There is no need to update your project; your existing images will still continue to work. However, you may wish to remove any relative specifiers from these MDX images as they are no longer necessary:

```diff
- ![A cute dog](./dog.jpg)
+ ![A cute dog](dog.jpg)
<!-- This dog lives in the same folder as my article! -->
