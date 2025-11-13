import { args } from 'virtual:astro:adapter-config';
import * as serverEntrypointModule from 'virtual:astro:adapter-entrypoint';
import { manifest } from 'virtual:astro:manifest';

const _exports = serverEntrypointModule.createExports?.(manifest, args) || serverEntrypointModule;

// NOTE: This is intentionally obfuscated!
// Do NOT simplify this to something like `serverEntrypointModule.start?.(_manifest, _args)`
// They are NOT equivalent! Some bundlers will throw if `start` is not exported, but we
// only want to silently ignore it... hence the dynamic, obfuscated weirdness.
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	(serverEntrypointModule as any)[_start](manifest, args);
}

export default _exports;
