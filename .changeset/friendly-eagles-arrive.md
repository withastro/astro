---
"@astrojs/partytown": patch
---

Prevent Partytown from crashing when View Transitions are enabled

When View Transitions are turned on, Partytown executes on every transition.
It's not meant to be like that, and therefore it breaks the integration completely.
Starting from now, Partytown will be executed only once.
