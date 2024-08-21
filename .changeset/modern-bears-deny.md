---
'astro': major
---

Makes the `compiledContent` property of Markdown content an async function, this change should fix underlying issues where sometimes when using a custom image service and images inside Markdown, Node would exit suddenly without any error message.

```diff
---
import * as myPost from "../post.md";

- const content = myPost.compiledContent();
+ const content = await myPost.compiledContent();
---

<Fragment set:html={content} />
```
