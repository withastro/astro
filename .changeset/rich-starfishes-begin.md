---
'astro': minor
---

**This is a breaking change!**

Astro props are now accessed from the `Astro.props` global. This change is meant to make prop definitions more ergonomic, leaning into JavaScript patterns you already know (destructuring and defaults). Astro components previously used a prop syntax borrowed from [Svelte](https://svelte.dev/docs#1_export_creates_a_component_prop), but it became clear that this was pretty confusing for most users.

```diff
 ---
+ const { text = 'Hello world!' } = Astro.props;
- export let text = 'Hello world!';
 ---

 <div>{text}</div>
```

[Read more about the `.astro` syntax](https://github.com/snowpackjs/astro/blob/main/docs/syntax.md#data-and-props)

---

### How do I define what props my component accepts?

Astro frontmatter scripts are TypeScript! Because of this, we can leverage TypeScript types to define the shape of your props.

```ts
---
export interface Props {
  text?: string;
}
const { text = 'Hello world!' } = Astro.props as Props;
---
```

> **Note** Casting `Astro.props as Props` is a temporary workaround. We expect our Language Server to handle this automatically soon!

### How do I access props I haven't explicitly defined?

One of the great things about this change is that it's straight-forward to access _any_ props. Just use `...props`!

```ts
---
export interface Props {
  text?: string;
  [attr: string]: unknown;
}
const { text = 'Hello world!', ...props } = Astro.props as Props;
---
```

### What about prop validation?

We considered building prop validation into Astro, but decided to leave that implementation up to you! This way, you can use any set of tools you like.

```ts
---
const { text = 'Hello world!' } = Astro.props;

if (typeof text !== 'string') throw new Error(`Expected "text" to be of type "string" but recieved "${typeof string}"!`);
---
```
