import { args } from 'virtual:astro:adapter-config';
import * as serverEntrypointModule from 'virtual:astro:adapter-entrypoint';
import { manifest } from 'virtual:astro:manifest';
const _exports = serverEntrypointModule.createExports?.(manifest, args) || serverEntrypointModule;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](manifest, args);
}
var legacy_default = _exports;
export { legacy_default as default };
