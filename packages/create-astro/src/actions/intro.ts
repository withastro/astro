import { type Context } from './context';

import { banner, welcome } from '../messages.js';
import { say, label, color } from '@astrojs/cli-kit';
import { random } from '@astrojs/cli-kit/utils';

export async function intro(ctx: Pick<Context, 'skipHouston'|'version'|'username'>) {
	if (!ctx.skipHouston) {
		await say([
			[
				'Welcome',
				'to',
				label('astro', color.bgGreen, color.black),
				color.green(`v${ctx.version}`) + ',',
				`${ctx.username}!`,
			],
			random(welcome),
		]);
		await banner(ctx.version);
	} else {
		await banner(ctx.version);
	}
}
