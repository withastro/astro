import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parse } from 'acorn';
import colors from 'piccolore';
function appendForwardSlash(path) {
	return path.endsWith('/') ? path : path + '/';
}
function getFileInfo(id, config) {
	const sitePathname = appendForwardSlash(
		config.site ? new URL(config.base, config.site).pathname : config.base,
	);
	let url = void 0;
	try {
		url = new URL(`file://${id}`);
	} catch {}
	const fileId = id.split('?')[0];
	let fileUrl;
	const isPage = fileId.includes('/pages/');
	if (isPage) {
		fileUrl = fileId.replace(/^.*?\/pages\//, sitePathname).replace(/(?:\/index)?\.mdx$/, '');
	} else if (url?.pathname.startsWith(config.root.pathname)) {
		fileUrl = url.pathname.slice(config.root.pathname.length);
	} else {
		fileUrl = fileId;
	}
	if (fileUrl && config.trailingSlash === 'always') {
		fileUrl = appendForwardSlash(fileUrl);
	}
	return { fileId, fileUrl };
}
function safeParseFrontmatter(code, id) {
	try {
		return parseFrontmatter(code, { frontmatter: 'empty-with-spaces' });
	} catch (e) {
		if (e.name === 'YAMLException') {
			const err = e;
			err.id = id;
			err.loc = { file: e.id, line: e.mark.line + 1, column: e.mark.column };
			err.message = e.reason;
			throw err;
		} else {
			throw e;
		}
	}
}
function jsToTreeNode(
	jsString,
	acornOpts = {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
) {
	return {
		type: 'mdxjsEsm',
		value: '',
		data: {
			// @ts-expect-error `parse` return types is incompatible but it should work in runtime
			estree: {
				...parse(jsString, acornOpts),
				type: 'Program',
				sourceType: 'module',
			},
		},
	};
}
function ignoreStringPlugins(plugins, logger) {
	let validPlugins = [];
	let hasInvalidPlugin = false;
	for (const plugin of plugins) {
		if (typeof plugin === 'string') {
			logger.warn(`${colors.bold(plugin)} not applied.`);
			hasInvalidPlugin = true;
		} else if (Array.isArray(plugin) && typeof plugin[0] === 'string') {
			logger.warn(`${colors.bold(plugin[0])} not applied.`);
			hasInvalidPlugin = true;
		} else {
			validPlugins.push(plugin);
		}
	}
	if (hasInvalidPlugin) {
		logger.warn(
			`To inherit Markdown plugins in MDX, please use explicit imports in your config instead of "strings." See Markdown docs: https://docs.astro.build/en/guides/markdown-content/#markdown-plugins`,
		);
	}
	return validPlugins;
}
export { appendForwardSlash, getFileInfo, ignoreStringPlugins, jsToTreeNode, safeParseFrontmatter };
