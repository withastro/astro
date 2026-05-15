function getProxyCode(options, isSSR) {
	const stringifiedFSPath = JSON.stringify(options.fsPath);
	return `
						new Proxy(${JSON.stringify(options)}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return ${stringifiedFSPath};
							}
							${!isSSR ? `if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add(${stringifiedFSPath});` : ''}
							return target[name];
						}
					})
					`;
}
export { getProxyCode };
