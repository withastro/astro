---
'astro': major
---

Fixes attribute rendering for non-[boolean HTML attributes](https://developer.mozilla.org/en-US/docs/Glossary/Boolean/HTML) with boolean values to match proper attribute handling in browsers.

Previously, non-boolean attributes may not have included their values when rendered to HTML. In Astro v5.0, the values are now explicitly rendered as `="true"` or `="false"`

In the following `.astro` examples, only `allowfullscreen` is a boolean attribute:

```astro
<!-- src/pages/index.astro -->
<!-- `allowfullscreen` is a boolean attribute -->
<p allowfullscreen={true}></p>
<p allowfullscreen={false}></p>

<!-- `inherit` is *not* a boolean attribute -->
<p inherit={true}></p>
<p inherit={false}></p>

<!-- `data-*` attributes are not boolean attributes -->
<p data-light={true}></p>
<p data-light={false}></p>
```

Astro v5.0 now preserves the full data attribute with its value when rendering the HTML of non-boolean attributes:

```diff
  <p allowfullscreen></p>
  <p></p>

  <p inherit="true"></p>
- <p inherit></p>
+ <p inherit="false"></p>

- <p data-light></p>
+ <p data-light="true"></p>
- <p></p>
+ <p data-light="false"></p>
```

If you rely on attribute values, for example to locate elements or to conditionally render, update your code to match the new non-boolean attribute values:

```diff
- el.getAttribute('inherit') === ''
+ el.getAttribute('inherit') === 'false'

- el.hasAttribute('data-light')
+ el.dataset.light === 'true'
```
