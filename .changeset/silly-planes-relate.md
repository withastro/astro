---
'@astrojs/mdx': patch
---

Fixes `.mdx` files emitting React-cased attribute names for elements added by a Sätteri `hastPlugin`. Attributes such as `strokeWidth` and `clipPath` leaked into the HTML verbatim, where browsers ignore them, while the same plugin running over a `.md` file produced `stroke-width` and `clip-path`. Both pipelines now emit the same HTML/SVG attribute names.
