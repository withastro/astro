import type { ExecaChildProcess } from 'execa';
import { execa } from 'execa';

/**
 *  Credit: Azhar22
 *  @see https://github.com/azhar22k/ourl/blob/master/index.js
 */
const getPlatformSpecificCommand = (): [string]|[string, string[]] => {
	const isGitPod = Boolean(process.env.GITPOD_REPO_ROOT);
	const platform = isGitPod ? 'gitpod' : process.platform;

	switch (platform) {
		case 'android':
		case 'linux':
			return ['xdg-open'];
		case 'darwin':
			return ['open'];
		case 'win32':
			return ['cmd', ['/c', 'start']];
		case 'gitpod':
			return ['/ide/bin/remote-cli/gitpod-code', ['--openExternal']];
		default:
			throw new Error(
				`It looks like your platform ("${platform}") isn't supported!\nTo view Astro's docs, please visit https://docs.astro.build`
			);
	}
};

export async function openInBrowser(url: string): Promise<ExecaChildProcess> {
	const [command, args = []] = getPlatformSpecificCommand();
	return execa(command, [...args, encodeURI(url)]);
};
