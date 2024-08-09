---
'astro': major
---

Fixes attribute rendering for non-[boolean attributes](https://developer.mozilla.org/en-US/docs/Glossary/Boolean/HTML) with boolean values. This matches proper attribute handling in browsers and allows you to read the attribute values consistently.

Given this Astro code (where `allowfullscreen` is a boolean attribute):

```astro
<p allowfullscren={true}></p>
<p allowfullscren={false}></p>
<p unknown={true}></p>
<p unknown={false}></p>
<p data-foo={true}></p>
<p data-foo={false}></p>
```

The rendered HTML will be:

```diff
<p allowfullscren></p>
<p></p>
<p unknown="true"></p>
- <p unknown></p>
+ <p unknown="false"></p>
- <p data-foo></p>
+ <p data-foo="true"></p>
- <p></p>
+ <p data-foo="false"></p>
```

To migrate, make sure you're reading the attribute values state correctly. For example:

```diff
- el.getAttribute('unknown') === ''
+ el.getAttribute('unknown') === 'false'

- el.hasAttribute('data-foo')
+ el.dataset.foo === 'true'
```
