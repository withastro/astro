import { expect } from 'chai';
import path from 'node:path';

import { getGitignorePaths, gitText2Paths } from '../dist/core/get-gitignore-paths.js';

const dirname = new URL('.', import.meta.url).pathname;
const root = path.resolve(dirname, '../../../');

describe('getGitignorePaths', () => {
	it('should be ignore files', () => {
		const res = gitText2Paths(`
# debug
!.idea/rcb-settings.xml
.pnpm-debug.log*
.env.local
.env.development.local
        `);
		expect(res.length).equal(4);
		expect(res[0]).equal('!.idea/rcb-settings.xml');
		expect(res[1]).equal('.pnpm-debug.log*');
		expect(res[2]).equal('.env.local');
		expect(res[3]).equal('.env.development.local');
	});

	it('should be ignore dir', () => {
		const res = gitText2Paths(`
# debug
target
.next/
*.node
dist
        `);
		expect(res[0]).equal('**/target/**');
		expect(res[1]).equal('**/.next/**');
		expect(res[2]).equal('*.node');
		expect(res[3]).equal('**/dist/**');
	});

	it('should be ignore by project git', async () => {
		const res = await getGitignorePaths(root);
		expect(res.length).gte(1);
		expect(res.includes('**/dist/**')).equal(true);
		expect(res.includes('.DS_Store')).equal(true);
	});
});
