import type { Context } from './context';

import { color, label } from '@astrojs/cli-kit';
import { random } from '@astrojs/cli-kit/utils';
import { banner, say, welcome } from '../messages.js';

export async function intro(ctx: Pick<Context, 'skipHouston' | 'version' | 'username' | 'fancy'>) {
	if (!ctx.skipHouston) {
		const hat = ctx.fancy ? random(['🎩', '🎩', '👑', '🧢', '🍦']) : undefined;
		await say(
			[
				[
					'Welcome',
					'to',
					label('astro', color.bgGreen, color.black),
					(ctx.version ? color.green(`v${ctx.version}`) : '') + ',',
					`${ctx.username}!`,
				],
				random(welcome),
			],
			{ hat }
		);
		await banner(ctx.version);
	} else {
		await banner(ctx.version);
	}
}
