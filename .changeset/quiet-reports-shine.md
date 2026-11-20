---
'@astrojs/check': minor
'astro': patch
---

Adds `--reporter` to select `default`, `json`, `sarif`, `junit`, or `checkstyle` diagnostics and run summaries. Reports go to stdout unless an adjacent `--reporter-file` selects a file:

```sh
npx astro check --reporter=json
npx astro check --reporter=default --reporter=sarif --reporter-file=reports/astro.sarif
```

Repeat the flags to combine terminal output and report files. `--reporter-file` alone writes default output to a file. Astro startup and sync logs go to stderr when there is no default stdout reporter.

`--minimumSeverity` filters reported diagnostics, while JUnit failures follow `--minimumFailingSeverity` and the full check results.

Relative paths resolve from the current working directory, and missing parent directories are created. Each completed check replaces the report, including in watch mode; cancelled checks preserve the previous report. A report write failure causes the command to fail.

Programmatic callers can pass a `reporters` array to `check()`, or `reporter` and `reporterFile` for a single output.
