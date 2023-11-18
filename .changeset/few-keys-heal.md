---
'astro': minor
---
Take full control over the behavior of view transitions!

Three new events now complement the existing `astro:after-swap` and `astro:page-load` events:

``` javascript
astro:before-preparation // Control how the DOM and other resources of the target page are loaded 
astro:after-preparation // Last changes before taking off? Remove that loading indicator? Here you go!
astro:before-swap // Control how the DOM is updated to match the new page
```

The `astro:before-*` events allow you to change properties and strategies of the view transition implementation.
The `astro:after-*` events allow you to make changes to the current DOM before and after the transition. 
Head over to [View Transition docs](https://docs.astro.build/en/guides/view-transitions/) to find out more about the events!
