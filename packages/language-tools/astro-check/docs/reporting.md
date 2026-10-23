# Diagnostic reports

## Reporter flags

### `--reporter=FORMAT`

Selects how diagnostics and the run summary are written. The default is `default`, which streams human-readable diagnostics and a summary to stdout.

Choose a structured reporter to write a report to stdout:

```shell
npx astro check --reporter=json
```

Astro's startup and sync logs go to stderr when there is no default reporter on stdout. The selected reporter is the only check output on stdout.

### `--reporter-file=PATH`

Writes the adjacent reporter to a file instead of stdout. Without an adjacent `--reporter`, writes the default plain-text report:

```shell
npx astro check --reporter=sarif --reporter-file=reports/astro.sarif
npx astro check --reporter-file=reports/astro-check.txt
```

Keep `--reporter` and its `--reporter-file` next to each other, in either order. Relative paths resolve from the current working directory; the file extension does not select the format.

### Multiple reporters

Repeat the flags to keep live terminal output and save a structured report:

```shell
npx astro check --reporter=default --reporter=sarif --reporter-file=reports/astro.sarif
```

Each reporter without a file writes to stdout. To generate multiple artifacts:

```shell
npx astro check --reporter=json --reporter-file=reports/astro.json --reporter=junit --reporter-file=reports/astro.xml
```

When several reporters target stdout, their outputs share that stream. Select just one structured stdout reporter for tools that expect a single document.

## Formats

| Reporter     | Output                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `default`    | Human-readable diagnostics and result summary. Files contain plain text without ANSI color or control sequences.                             |
| `json`       | [Astro's JSON report](#json-report) for scripts and custom integrations.                                                                     |
| `sarif`      | [SARIF 2.1.0](https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/sarif-v2.1.0-os.html) for static analysis tools.                             |
| `junit`      | [JUnit XML](https://docs.junit.org/current/advanced-topics/junit-platform-reporting.html) for CI test reports, with one test case per check. |
| `checkstyle` | [Checkstyle XML](https://checkstyle.org/apidocs/com/puppycrawl/tools/checkstyle/XMLLogger.html) for diagnostic integrations.                 |

## Severity and results

`--minimumSeverity` controls which diagnostics appear in the terminal and report. JSON retains the check's total error, warning, and hint counts before filtering. `--minimumFailingSeverity` controls which diagnostics cause the command to fail. A completed check writes its report even when diagnostics cause failure.

JUnit uses the same failure threshold and full check counts, so its test case can fail even when `--minimumSeverity` hides the diagnostic details. Visible diagnostics are included in the failure text for failing checks and in `system-out` for successful checks.

SARIF maps errors to `error`, warnings to `warning`, and information and hints to `note`. Checkstyle uses `error`, `warning`, and `info`, respectively. SARIF locations use absolute file URIs with UTF-16 columns. Checkstyle file paths are relative to the project root and use forward slashes.

## JSON report

The `json` reporter uses Astro's versioned format:

```json
{
  "version": 1,
  "filesChecked": 1,
  "summary": { "errors": 1, "warnings": 0, "hints": 0 },
  "diagnostics": [
    {
      "file": "src/pages/index.astro",
      "severity": "error",
      "code": 2322,
      "source": "ts",
      "message": "Type 'string' is not assignable to type 'number'.",
      "range": {
        "start": { "line": 2, "column": 7 },
        "end": { "line": 2, "column": 12 }
      }
    }
  ]
}
```

File paths are relative to the project root and use forward slashes. Severity is `error`, `warning`, `information`, or `hint`. `code` and `source` are omitted when unavailable; diagnostic codes retain their original string or number type. Lines and columns are 1-based, columns count UTF-16 code units, and the end position is exclusive.

## Output path

Relative paths resolve from the directory where you run the command, independently of `--root`:

```shell
npx astro check --root ./site --reporter-file ./reports/astro-check.txt
```

This checks `site/` and writes `reports/astro-check.txt` in the current directory. Absolute paths are also supported. Missing parent directories are created, and each completed check overwrites the file. If the report cannot be written, the command fails.

## Watch mode

```shell
npx astro check --watch --reporter=default --reporter=json --reporter-file=reports/astro.json
```

Each completed check replaces the report. If a check is cancelled because another starts, the previous completed report stays on disk. Report files are excluded from the watcher. `--preserveWatchOutput` affects default stdout only; it does not append reports to the file.

A structured stdout reporter emits a complete document for each completed check, without terminal resets or watch messages. The stream contains consecutive documents, not one JSON or XML document; use file output when the consumer expects a single report.

## Programmatic usage

Pass `reporters` to `check()` from `@astrojs/check`:

```js
import { check } from '@astrojs/check';

const failed = await check({
  reporters: [
    { reporter: 'default' },
    { reporter: 'sarif', reporterFile: './reports/astro.sarif' },
  ],
});

process.exitCode = failed ? 1 : 0;
```

For a single output, use `reporter` and optional `reporterFile` directly instead of `reporters`. Do not combine the two forms. Omitting all reporter options selects default stdout.

The same format and severity rules apply. The path resolves from `process.cwd()`, independently of the `root` option. A report write failure rejects the promise.
