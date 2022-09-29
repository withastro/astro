---
'astro': minor
'@astrojs/cloudflare': minor
'@astrojs/deno': minor
'@astrojs/netlify': minor
'@astrojs/node': minor
'@astrojs/vercel': minor
---

Adds the Astro.cookies API

`Astro.cookies` is a new API for manipulating cookies in Astro components and API routes.

In Astro components, the new `Astro.cookies` object is a map-like object that allows you to get, set, delete, and check for a cookie's existence (`has`):

```astro
---
type Prefs = {
  darkMode: boolean;
}

Astro.cookies.set<Prefs>('prefs', { darkMode: true }, {
  expires: '1 month'
});

const prefs = Astro.cookies.get<Prefs>('prefs').json();
---
<body data-theme={prefs.darkMode ? 'dark' : 'light'}>
```

Once you've set a cookie with Astro.cookies it will automatically be included in the outgoing response.

This API is also available with the same functionality in API routes:

```js
export function post({ cookies }) {
  cookies.set('loggedIn', false);

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/login'
    }
  });
}
```

See [the RFC](https://github.com/withastro/rfcs/blob/main/proposals/0025-cookie-management.md) to learn more.
