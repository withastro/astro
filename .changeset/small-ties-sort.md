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

Astro v5.0 now preserves the full data attribute with its value when rendering the HTML of non-boolean attributes:

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

If you rely on attribute values, for example to locate elements or to conditionally render, update your code to match the new non-boolean attribute values:

```diff
- el.getAttribute('inherit') === ''
+ el.getAttribute('inherit') === 'false'

- el.hasAttribute('data-light')
+ el.dataset.foo === 'true'
```
