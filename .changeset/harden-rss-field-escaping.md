---
'@astrojs/rss': patch
---

Hardens RSS feed generation by escaping the `source` and `enclosure` item fields. These fields are now serialized as structured XML values, ensuring that special characters in values like `source.title` and `enclosure.type` are always treated as text rather than markup, consistent with how other feed fields are handled.
