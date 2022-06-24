---
'astro': patch
---

Support for streaming responses

Astro supports streaming in its templates. Any time Astro encounters an async boundary it will stream out HTML that occurs before it. For example:

```astro
---
import LoadTodos from '../components/LoadTodos.astro';
---
<html>
<head>
<title>App</title>
</head>
<body>
  <LoadTodos />
</body>
</html>
```

In this arbtrary example Astro will streaming out the `<head>` section and everything else until it encounters `<LoadTodos />` and then stop. LoadTodos, which is also an Astro component will stream its contents as well; stopping and waiting at any other asynchronous components.

As part of this Astro also now supports async iterables within its templates. This means you can do this:

```astro
<ul>
  {(async function * () {
    for(const number of numbers) {
      await wait(1000);

      yield <li>Number: {number}</li>
      yield '\n'
    }
  })()}
</ul>
```

Which will stream out `<li>`s one at a time, waiting a second between each.
