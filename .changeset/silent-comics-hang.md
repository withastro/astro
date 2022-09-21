---
'astro': minor
---

Allows Responses to be passed to set:html

This expands the abilities of `set:html` to ultimate service this use-case:

```astro
<div set:html={fetch('/legacy-post.html')}></div>
```

This means you can take a legacy app that has been statically generated to HTML and directly consume that HTML within your templates. As is always the case with `set:html`, this should only be used on trusted content.

To make this possible, you can also pass several other types into `set:html` now:

* `Response` objects, since that is what fetch() returns:
    ```astro
    <div set:html={new Response('<span>Hello world</span>', {
      headers: {
        'content-type': 'text/html'
      }
    })}></div>
    ```
* `ReadableStream`s:
    ```astro
    <div set:html={new ReadableStream({
      start(controller) {
        controller.enqueue(`<span>read me</span>`);
        controller.close();
      }
    })}></div>
    ```
* `AsyncIterable`s:
    ```astro
    <div set:html={(async function * () {
      for await (const num of [1, 2, 3, 4, 5]) {
        yield `<li>${num}</li>`;
      }
    })()}>
    ```
* `Iterable`s (non-async):
    ```astro
    <div set:html={(function * () {
      for (const num of [1, 2, 3, 4, 5]) {
        yield `<li>${num}</li>`;
      }
    })()}>
    ```
