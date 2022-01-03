# Example `@example/my-component`

This is an example package, exported as `@example/my-component`. It consists of two Astro components, **Button** and **Heading**.

### Button

The **Button** component generates a `<button>` with a default **type** of **button**.

```astro
---
import * as Component from '@example/my-component'
---
<Component.Button>Plain Button</Component.Button>
```

```html
<!-- generated html -->
<button type="button">Plain Button</button>
```

### Heading

The **Heading** component generates an `<h>` tag with a default **role** of **heading** and a **level** attribute that gets written to **aria-level**.

```astro
---
import * as Component from '@example/my-component'
---
<Component.Heading>Heading</Component.Heading>
<Component.Heading level="2">Subheading</Component.Heading>
```

```html
<!-- generated html -->
<h role="heading" aria-level="1">Plain Button</h>
<h role="heading" aria-level="2">Subheading</h>
```
