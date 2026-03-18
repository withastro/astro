## Description

Fixes issue #15976 - Content collection validation errors in v6 are no longer human-readable.

## Changes

Previously, validation errors showed raw zod error output like:
```
**: [{"expected": "object", "code": "invalid_type", "path": ["label"], "message": "label: Required"}]
```

Now they show human-readable format:
```
  - label: Required
```

The fix formats `error.issues` to show each validation issue with its path and message.
