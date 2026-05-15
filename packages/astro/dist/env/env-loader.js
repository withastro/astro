import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
const isValidIdentifierRe = /^[_$a-zA-Z][\w$]*$/;
function getSecretKeys(envSchema) {
	const secrets = /* @__PURE__ */ new Set();
	for (const [key, options] of Object.entries(envSchema)) {
		if (options.access === 'secret') {
			secrets.add(key);
		}
	}
	return secrets;
}
function getPrivateEnv({ fullEnv, viteConfig, envSchema }) {
	let envPrefixes = ['PUBLIC_'];
	if (viteConfig.envPrefix) {
		envPrefixes = Array.isArray(viteConfig.envPrefix)
			? viteConfig.envPrefix
			: [viteConfig.envPrefix];
	}
	const secretKeys = getSecretKeys(envSchema);
	const privateEnv = {};
	for (const key in fullEnv) {
		if (!isValidIdentifierRe.test(key)) {
			continue;
		}
		if (secretKeys.has(key)) {
			privateEnv[key] = JSON.stringify(fullEnv[key]);
			continue;
		}
		if (envPrefixes.some((prefix) => key.startsWith(prefix))) {
			continue;
		}
		privateEnv[key] = JSON.stringify(fullEnv[key]);
	}
	return privateEnv;
}
function getEnv({ mode, config }) {
	const loaded = loadEnv(mode, config.vite.envDir ?? fileURLToPath(config.root), '');
	const privateEnv = getPrivateEnv({
		fullEnv: loaded,
		viteConfig: config.vite,
		envSchema: config.env.schema,
	});
	return { loaded, privateEnv };
}
const createEnvLoader = (options) => {
	let { loaded, privateEnv } = getEnv(options);
	return {
		get: () => {
			({ loaded, privateEnv } = getEnv(options));
			return loaded;
		},
		getPrivateEnv: () => privateEnv,
	};
};
export { createEnvLoader };
