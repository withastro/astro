---
'astro': patch
---

Allow TypeScript inside script tags

This makes it so that you can use TypeScript inside of script tags like so:

```html
<script>
  interface Person {
    name: string;
  }

  const person: Person = {
    name: 'Astro'
  };

  console.log(person);
</script>
```

Note that the the VSCode extension does not currently support this, however.
