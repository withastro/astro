# @astrojs/telemetry

## 0.1.3

### Patch Changes

- [#3614](https://github.com/withastro/astro/pull/3614) [`9c8a7c0b`](https://github.com/withastro/astro/commit/9c8a7c0b09db2fb6925929d4efe01d5ececbf08e) Thanks [@okikio](https://github.com/okikio)! - Fix telemetry crashing astro build/dev when using optional integrations

  Telemetry will now ignore falsy integration values but will gather a count of how many integrations out of the total are now optional integrations

* [#3614](https://github.com/withastro/astro/pull/3614) [`9c8a7c0b`](https://github.com/withastro/astro/commit/9c8a7c0b09db2fb6925929d4efe01d5ececbf08e) Thanks [@okikio](https://github.com/okikio)! - Add's optional integrations field to `@astrojs/telemetry`'s payload

## 0.1.2

### Patch Changes

- [#3299](https://github.com/withastro/astro/pull/3299) [`8021998b`](https://github.com/withastro/astro/commit/8021998bb6011e31aa736abeafa4f1cf8f5a180c) Thanks [@matthewp](https://github.com/matthewp)! - Update to telemetry to include AstroConfig keys used

## 0.1.1

### Patch Changes

- [#3276](https://github.com/withastro/astro/pull/3276) [`6d5ef41b`](https://github.com/withastro/astro/commit/6d5ef41b1ed77ccc67f71e91adeab63a50a494a8) Thanks [@FredKSchott](https://github.com/FredKSchott)! - fix "cannot exit astro" bug

## 0.1.0

### Minor Changes

- [#3256](https://github.com/withastro/astro/pull/3256) [`f76038ac`](https://github.com/withastro/astro/commit/f76038ac7db986a13701fd316e53142b52e011c8) Thanks [@matthewp](https://github.com/matthewp)! - Adds anonymous telemetry data to the cli
