---
"astro": minor
---

Adds new utilities to ease the creation of toolbar apps. These new utilities hope to abstract away some of the boilerplate code that is common in toolbar apps, and lower the barrier of entry.

For example, instead of creating an event listener for the `app-toggled` event and manually typing the value in the callback, you can now use the `onAppToggled` method. Additionally, communicating with the server does not require knowing any of the Vite APIs anymore, as a new `server` object is passed to the `init` function that contains easy to use methods for communicating with the server.

```diff
import { defineToolbarApp } from "astro/toolbar";

export default defineToolbarApp({
  init(canvas, app, server) {

-    app.addEventListener("app-toggled", (e) => {
-      console.log(`App is now ${state ? "enabled" : "disabled"}`);.
-    });

+    app.onToggled(({ state }) => {
+        console.log(`App is now ${state ? "enabled" : "disabled"}`);
+    });

-    if (import.meta.hot) {
-      import.meta.hot.send("my-app:my-client-event", { message: "world" });
-    }

+    server.send("my-app:my-client-event", { message: "world" })

-    if (import.meta.hot) {
-      import.meta.hot.on("my-server-event", (data: {message: string}) => {
-        console.log(data.message);
-      });
-    }

+    server.on<{ message: string }>("my-server-event", (data) => {
+      console.log(data.message); // data is typed using the type parameter
+    });
  },
})
```

Server helpers are also available on the server side, in your integration:

```ts
"astro:server:setup": ({ toolbar }) => {
  toolbar.on<{ message: string }>("my-app:my-client-event", (data) => {
    console.log(data.message);
    toolbar.send("my-server-event", { message: "hello" });
  });
}
```
