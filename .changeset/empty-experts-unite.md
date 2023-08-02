---
'astro': minor
---

Persistent DOM and Islands in Experimental View Transitions

With `viewTransitions: true` enabled in your Astro config's experimental section, pages using the `<ViewTransition />` routing component can now access a new `transition:persist` directive. 

With this directive, you can keep the state of DOM elements and islands on the old page when transitioning to the new page.

For example, to keep a video playing across page navigation, add `transition:persist` to the element:

```astro
<video controls="" autoplay="" transition:persist>
  <source src="https://ia804502.us.archive.org/33/items/GoldenGa1939_3/GoldenGa1939_3_512kb.mp4" type="video/mp4">
</video>
```

This `<video>` element, with its current state, will be moved over to the next page (if the video also exists on that page).

Likewise, this feature works with any client-side framework component island. In this example, a counter's state is preserved and moved to the new page:

```astro
<Counter count={5} client:load transition:persist />
```

See our [View Transitions Guide](https://docs.astro.build/en/guides/view-transitions/#maintaining-state) to learn more on usage.
