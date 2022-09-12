import { execa } from 'execa';

export default async function installDeps({ pkgManager, cwd }: { pkgManager: string, cwd: string }) {
		const installExec = execa(pkgManager, ['install'], { cwd });
		return new Promise<void>((resolve, reject) => {
			installExec.on('error', (error) => reject(error));
			installExec.on('close', () => resolve());
		});
}
