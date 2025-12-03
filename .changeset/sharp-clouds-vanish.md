---
'@astrojs/language-server': patch
---

Fixes an issue with the volar-service-emmet that was pointing to a github username/repository instead of a npm package. This type of dependencies are not supported for Deno installations and it can break in enterprise environments that use private registries or don't have access to public github.
