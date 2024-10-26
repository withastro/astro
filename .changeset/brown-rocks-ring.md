---
'astro': major
---

add `checked` to htmlBooleanAttributes.

Previously, `checked={true}` returned `checked="true"`, which is considered [invalid](https://html.spec.whatwg.org/#boolean-attributes).
Now, this should return `checked` only. 
Note: Falsy values would omit the attribute, which is correct behavior.

You'll only need to edit your existing code if you are checking the `checked` attribute's value to be the string `'true'` like so:
```js
- el.getAttribute('checked') === 'true'
+ el.hasAttribute('checked')
```