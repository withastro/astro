---
'astro': minor
---

Reworks route priority processing to allow for more flexible and intuitive redirects and route injection

- Priority order for project routes, injected routes and redirects are now all the same.
- Injected routes and redirects can now specify if they should be prioritized above,
  with or below project routes. This is done by adding a `priority` property to the route
  object in `injectRoute` and in the `redirects` property in `astro.config.mjs`.
- Now more specific routes always take priority over less specific routes.  
  Example: `/blog/[...slug]` will take priority over `/[...slug]`
- Static redirects now have a lower priority than all project routed, even if the routes are dynamic,
  matching the already documented behavior.  
  Example: `/blog (redirect)` will no longer override a `/[slug]` route by default, this can be re-enabled
  using the new `priority` field. 
- Collision detection between routes can now detect coliisions between similar dynamic routes
  of any kind (project routes, injected routes and redirects).  
  Example: `/blog/[page]` will now be detected as a collision with `/blog/[slug]`
- Colision detection is now reported as a warning for backward compatibility with all the previous false negatives.
