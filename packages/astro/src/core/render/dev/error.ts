import type { BuildResult } from 'esbuild';
import type vite from '../../vite';
import type { SSRError } from '../../../@types/astro';

import eol from 'eol';
import fs from 'fs';
import { codeFrame } from '../../util.js';

interface ErrorHandlerOptions {
	filePath: URL;
	viteServer: vite.ViteDevServer;
}

export async function errorHandler(e: unknown, { viteServer, filePath }: ErrorHandlerOptions) {
	// normalize error stack line-endings to \n
	if ((e as any).stack) {
		(e as any).stack = eol.lf((e as any).stack);
	}

	// fix stack trace with Vite (this searches its module graph for matches)
	if (e instanceof Error) {
		viteServer.ssrFixStacktrace(e);
	}

	// Astro error (thrown by esbuild so it needs to be formatted for Vite)
	if (Array.isArray((e as any).errors)) {
		const { location, pluginName, text } = (e as BuildResult).errors[0];
		const err = e as SSRError;
		if (location) err.loc = { file: location.file, line: location.line, column: location.column };
		let src = err.pluginCode;
		if (!src && err.id && fs.existsSync(err.id)) src = await fs.promises.readFile(err.id, 'utf8');
		if (!src) src = await fs.promises.readFile(filePath, 'utf8');
		err.frame = codeFrame(src, err.loc);
		err.id = location?.file;
		err.message = `${location?.file}: ${text}
${err.frame}
`;
		if (pluginName) err.plugin = pluginName;
		throw err;
	}

	// Generic error (probably from Vite, and already formatted)
	throw e;
}
