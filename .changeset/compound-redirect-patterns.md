---
'@astrojs/underscore-redirects': patch
---

Fixed `_redirects` generation truncating compound dynamic route segments: `post-[id]` now generates `/post-:id` instead of `/post-`.
