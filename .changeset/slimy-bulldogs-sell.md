---
'astro': patch
---

Adds support for typing experimental session data

You can add optional types to your session data by creating a `src/env.d.ts` file in your project that extends the global `App.SessionData` interface. For example:

```ts
declare namespace App {
  interface SessionData {
    user: {
      id: string;
      email: string;
    };
    lastLogin: Date;
  }
}
```

Any keys not defined in this interface will be treated as `any`.

Then when you access `Astro.session` in your components, any defined keys will be typed correctly:

```astro
---
const user = await Astro.session.get('user');
//    ^? const: user: { id: string; email: string; } | undefined

const something = await Astro.session.get('something');
//    ^? const: something: any

Astro.session.set('user', 1);
//    ^? Argument of type 'number' is not assignable to parameter of type '{ id: string; email: string; }'.
---
```

See [the experimental session docs](https://docs.astro.build/en/reference/experimental-flags/sessions/) for more information.
