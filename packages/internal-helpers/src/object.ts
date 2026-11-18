/**
 * Keys that must be rejected when traversing object paths (e.g. dot-separated
 * property lookups) to prevent prototype-pollution attacks.
 */
export const FORBIDDEN_PATH_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
