---
'astro': minor
---

Adds a new `eagerness` option for `prefetch()` when using `experimental.clientPrerender`

With the experimental [`clientPrerender`](https://docs.astro.build/en/reference/experimental-flags/client-prerender/) flag enabled, you can use the `eagerness` option on `prefetch()` to suggest to the browser how eagerly it should prefetch/prerender link targets.

This follows the same API described in the [Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/speculationrules#eagerness) and allows you to balance the benefit of reduced wait times against bandwidth, memory, and CPU costs for your site visitors.

For example, you can now use `prefetch()` programmatically with large sets of links and avoid [browser limits in place to guard against over-speculating](https://developer.chrome.com/blog/speculation-rules-improvements#chrome-limits)  (prerendering/prefetching too many links). Set `eagerness: 'moderate'` to take advantage of [First In, First Out (FIFO)](https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics)) strategies and browser heuristics to let the browser decide when to prerender/prefetch them and in what order:

```astro
<a class="link-moderate" href="/nice-link-1">A Nice Link 1</a>
<a class="link-moderate" href="/nice-link-2">A Nice Link 2</a>
<a class="link-moderate" href="/nice-link-3">A Nice Link 3</a>
<a class="link-moderate" href="/nice-link-4">A Nice Link 4</a>
...
<a class="link-moderate" href="/nice-link-20">A Nice Link 20</a>
<script>
  import { prefetch } from 'astro:prefetch';
  const linkModerate = document.getElementsByClassName('link-moderate');
  linkModerate.forEach((link) => prefetch(link.getAttribute('href'), {eagerness: 'moderate'}));
  
</script>
```
