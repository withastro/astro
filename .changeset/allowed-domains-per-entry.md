---
'astro': patch
---

Validates the protocol, host and port from `X-Forwarded-Proto`, `X-Forwarded-Host` and `X-Forwarded-Port` together against each `security.allowedDomains` entry, instead of one at a time:

- A forwarded protocol is only applied when an entry allows it for the host in use.
- A forwarded port is only applied when the entry for that host lists it.
- A forwarded host without a forwarded protocol is validated with the protocol of the server.
- An entry with `port: '443'` (or `'80'` for `http`) now matches a host that doesn't include a port.
