---
'astro': patch
---

Adds a new container function called `renderComponent()`, which renders Astro components with inlined styles and scripts.

Users must import the component with the new `?container` query string:

```js
import { experimental_AstroContainer } from "astro/container";
import TodoList from "../components/TodoList.astro?container";

const container = await experimental_AstroContainer.create();

const _string = container.renderComponent(TodoList);
```
