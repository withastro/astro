---
'@astrojs/vercel': patch
---

- Cache result during bundling, to speed up the process of multiple functions;
- Avoid creating multiple symbolic links of the dependencies when building the project with `funcitonPerRoute` enabled;
