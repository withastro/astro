---
'@astrojs/node': patch
---

Fixes per-route static headers (e.g. `Content-Security-Policy`) being applied to the wrong prerendered response when one route's pathname is a substring of another's. The static handler was matching header entries with `.includes()` instead of equality, so e.g. a request for `/users` could pick up the headers stored for `/users/profile` depending on Map insertion order.