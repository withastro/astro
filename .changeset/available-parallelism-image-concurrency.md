---
'astro': patch
---

Uses `os.availableParallelism()` instead of `os.cpus().length` to size the image-optimization concurrency queue during `astro build`. On CPU-limited containers (e.g. Docker/Kubernetes with `--cpus`), `os.cpus().length` returns the host core count, oversubscribing the available CPU and multiplying peak memory, which can trigger OOM kills. `os.availableParallelism()` reflects the CPU actually available to the process. On unconstrained hosts the two return the same value, so behavior is unchanged outside containers.
