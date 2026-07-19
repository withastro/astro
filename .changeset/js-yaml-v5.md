---
"@astrojs/internal-helpers": patch
"astro": patch
---

Updates the YAML parser ([`js-yaml`](https://www.npmjs.com/package/js-yaml)) to v5.

This affects how YAML is parsed in Markdown/MDX frontmatter, `.yaml`/`.yml` data files in content collections, and the `file()` content loader.

Everyday frontmatter keeps working exactly as before. In particular:

- Unquoted dates such as `date: 2022-01-01` are still parsed as `Date` objects, so collection schemas using `z.date()` keep working.
- Merge keys (`<<: *anchor`) are still resolved.
- Strings, numbers, booleans, arrays, and nested objects are unchanged.

A few rarely used YAML 1.1 features are no longer supported, following the YAML 1.2 spec:

- The explicit type tags `!!binary`, `!!omap`, `!!pairs`, and `!!set` now cause a parse error instead of producing a value.
- Binary number literals (`0b1010`) and numbers with underscore separators (`100_000`) are now parsed as strings instead of numbers. Write them as plain decimals (`10`, `100000`) if you need numbers.
- Mapping keys that look like dates (`2022-01-01: value`) now cause a parse error. Previously the key was silently converted to a locale-dependent string. Quote the key (`"2022-01-01": value`) to use it as a string.

If your frontmatter or data files use none of the above, no changes are needed.
