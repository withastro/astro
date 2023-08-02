---
'astro': minor
---

Persistent DOM and Islands in Experimental View Transitions

If you have `viewTransitions: true` enabled in your Astro config's experimental section, you can now take advantage of the new `transition:persist` directive. With this directive, you can keep the state of DOM elements and islands on the old page when transitioning to the new page.

For example, say you have a Video playing, it might look like this:

```astro
<video controls="" autoplay="" transition:persist>
  <source src="https://ia804502.us.archive.org/33/items/GoldenGa1939_3/GoldenGa1939_3_512kb.mp4" type="video/mp4">
</video>
```

In 2.10 you can now add the `transition:persist` directive and this video will be moved over to the next page (if the video also exists on that page).

Likewise, this feature works with any client-side framework component island. In this example, a counter's state is preserved and moved to the new page:

```astro
<Counter count={5} client:load transition:persist />
```

See our [View Transitions Guide](https://docs.astro.build/en/guides/view-transitions/#maintaining-state) to learn more on usage.
