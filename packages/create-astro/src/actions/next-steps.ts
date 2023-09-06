import path from 'node:path';
import type { Context } from './context';

import { nextSteps, say } from '../messages.js';

export async function next(ctx: Pick<Context, 'cwd' | 'packageManager' | 'skipHouston'>) {
	let projectDir = path.relative(process.cwd(), ctx.cwd);

	const commandMap: { [key: string]: string } = {
		npm: 'npm run dev',
		bun: 'bun run dev',
		yarn: 'yarn dev',
		pnpm: 'pnpm dev',
	};

	const devCmd = commandMap[ctx.packageManager as keyof typeof commandMap] || 'npm run dev';
	await nextSteps({ projectDir, devCmd });

	if (!ctx.skipHouston) {
		await say(['Good luck out there, astronaut! 🚀']);
	}
	return;
}
