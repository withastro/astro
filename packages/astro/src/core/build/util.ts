import type { Rollup } from 'vite';
import type { AstroConfig } from '../../types/public/config.js';
import type { ViteBuildReturn } from './types.js';
import { ContentHeaders } from './contentHeaders.js';

export function getTimeStat(timeStart: number, timeEnd: number) {
	const buildTime = timeEnd - timeStart;
	return buildTime < 1000 ? `${Math.round(buildTime)}ms` : `${(buildTime / 1000).toFixed(2)}s`;
}

/**
 * Given the Astro configuration, it tells if a slash should be appended or not
 */
export function shouldAppendForwardSlash(
	trailingSlash: AstroConfig['trailingSlash'],
	buildFormat: AstroConfig['build']['format'],
): boolean {
	switch (trailingSlash) {
		case 'always':
			return true;
		case 'never':
			return false;
		case 'ignore': {
			switch (buildFormat) {
				case 'directory':
					return true;
				case 'preserve':
				case 'file':
					return false;
			}
		}
	}
}

export function i18nHasFallback(config: AstroConfig): boolean {
	if (config.i18n && config.i18n.fallback) {
		// we have some fallback and the control is not none
		return Object.keys(config.i18n.fallback).length > 0;
	}

	return false;
}

export function encodeName(name: string): string {
	// Detect if the chunk name has as % sign that is not encoded.
	// This is borrowed from Node core: https://github.com/nodejs/node/blob/3838b579e44bf0c2db43171c3ce0da51eb6b05d5/lib/internal/url.js#L1382-L1391
	// We do this because you cannot import a module with this character in it.
	for (let i = 0; i < name.length; i++) {
		if (name[i] === '%') {
			const third = name.codePointAt(i + 2)! | 0x20;
			if (name[i + 1] !== '2' || third !== 102) {
				return `${name.replace(/%/g, '_percent_')}`;
			}
		}
	}

	return name;
}

export function viteBuildReturnToRollupOutputs(
	viteBuildReturn: ViteBuildReturn,
): Rollup.RollupOutput[] {
	const result: Rollup.RollupOutput[] = [];
	if (Array.isArray(viteBuildReturn)) {
		result.push(...viteBuildReturn);
	} else if ('output' in viteBuildReturn) {
		result.push(viteBuildReturn);
	}
	return result;
}

export type FileDescriptor = {
	filename: string | undefined;
	encoding: BufferEncoding | undefined;
	isHtml: boolean;
};

export function getFileDescriptorFromResponse(response: Response): FileDescriptor {
	const headers = new ContentHeaders(response.headers);
	return {
		encoding: isBufferEncoding(headers.charset) ? headers.charset : undefined,
		isHtml: headers.mediaType === 'text/html',
		filename: headers.filename,
	};
}

function isBufferEncoding(val: string | null | undefined): val is BufferEncoding {
	return (
		val === 'ascii' ||
		val === 'utf8' ||
		val === 'utf-8' ||
		val === 'utf16le' ||
		val === 'ucs2' ||
		val === 'ucs-2' ||
		val === 'base64' ||
		val === 'base64url' ||
		val === 'latin1' ||
		val === 'binary' ||
		val === 'hex'
	);
}
