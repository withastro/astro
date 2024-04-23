---
"astro": patch
---

Fixes an issue where images in MD required a relative specifier (e.g. `./`)

Now, you can use the standard `![](relative/img.png)` syntax in MD files for images colocated in the same folder: no relative specifier required!

There is no need to update your project; your existing images will still continue to work. However, you may wish to remove any relative specifiers from these MD images as they are no longer necessary:

```diff
- ![A cute dog](./dog.jpg)
+ ![A cute dog](dog.jpg)
<!-- This dog lives in the same folder as my article! -->
```
