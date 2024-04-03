---
"@astrojs/markdoc": patch
---

Add automatic resolution for Markdoc partials. This allows you to render other Markdoc files inside of a given entry. Reference files using the `partial` tag with a `file` attribute for the relative file path:

```md
<!--src/content/blog/post.mdoc-->

{% partial file="my-partials/_diagram.mdoc" /%}

<!--src/content/blog/my-partials/_diagram.mdoc-->

## Diagram

This partial will render inside of `post.mdoc.`

![Diagram](./diagram.png)
```
