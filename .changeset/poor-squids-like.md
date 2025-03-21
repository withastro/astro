---
'astro': minor
---

Add `eagerness` support for `prefetch()`

With [`clientPrerender`](https://docs.astro.build/en/reference/experimental-flags/client-prerender/) experiment enabled, you can use `eagerness` option, following the same API described in [Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/speculationrules#eagerness).

For example, you have a set of links that you want to be prerendered/prefetched but there are too many for browsers to handle (Chrome have some [limits in place](https://developer.chrome.com/blog/speculation-rules-improvements#chrome-limits)).
To prevent that, you can set `eagerness: 'moderate'` to get advantage of FIFO strategies and browser heuristics to let it decide when prerender/prefetch them and in what order.

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
