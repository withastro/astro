---
"astro": minor
---

Adds support for emitting warning and info notifications from dev toolbar apps.

When using the `toggle-notification` event, the severity can be specified through `detail.level`:

```ts
eventTarget.dispatchEvent(
  new CustomEvent("toggle-notification", {
    detail: {
      level: "warning",
    },
  })
);
```
