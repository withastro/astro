import type { AstroConfig } from 'astro';

export function formatPathname({
	pathname,
	config,
}: {
	pathname: string;
	config: AstroConfig;
}): string {
	return shouldAppendForwardSlash(config)
		? pathname.replace(/\/?$/, '/').replace(/^\//, '')
		: pathname.replace(/^\//, '');
}

function shouldAppendForwardSlash(config: AstroConfig): boolean {
	switch (config.trailingSlash) {
		case 'always':
			return true;
		case 'never':
			return false;
		case 'ignore': {
			switch (config.build.format) {
				case 'directory':
					return true;
				case 'file':
					return false;
			}
		}
	}
}
