import path from 'node:path';
import type { Context } from './context';

import { nextSteps, say } from '../messages.js';

export async function next(ctx: Pick<Context, 'cwd' | 'pkgManager' | 'skipHouston'>) {
	let projectDir = path.relative(process.cwd(), ctx.cwd);
	const devCmd =
		ctx.pkgManager === 'npm'
			? 'npm run dev'
			: ctx.pkgManager === 'bun'
			? 'bun run dev'
			: `${ctx.pkgManager} dev`;
	await nextSteps({ projectDir, devCmd });

	if (!ctx.skipHouston) {
		await say(['Good luck out there, astronaut! 🚀']);
	}
	return;
}
