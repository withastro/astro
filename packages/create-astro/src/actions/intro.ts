import type { Context } from './context';

import { color, label } from '@astrojs/cli-kit';
import { random } from '@astrojs/cli-kit/utils';
import { banner, say, welcome } from '../messages.js';

export async function intro(ctx: Pick<Context, 'hat' | 'skipHouston' | 'version' | 'username' | 'fancy'>) {
	banner();

	if (!ctx.skipHouston) {
		await say(
			[
				[
					'Welcome',
					'to',
					label('astro', color.bgGreen, color.black),
					Promise.resolve(ctx.version).then(version => ((version ? color.green(`v${version}`) : '') + ',')),
					Promise.resolve(ctx.username).then(username => `${username}!`),
				],
				random(welcome),
			],
			{ clear: true, hat: ctx.hat }
		);
	}
}
