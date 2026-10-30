---
"astro": minor
---

Adds a `serverIslands.routePrefix` config option to replace the hard-coded value `/_server-islands/` during client-side server islands requests.

This config option can help deployments where routing is handled by another system and thus an hard-coded value doesn't necessarily fit in that deployment scheme. 

For example, if you have a federated micro-frontend setup where each application is handled by a sub-path such as `/app1` and `/app2`, an hard-coded value means you simply cannot use server islands. This config option can help enable server islands in these setups.

```
serverIslands: {
    routePrefix: "/app1/_internal-islands"
  }
```
