import { expect } from 'chai';
import { createLoader } from '../../../dist/core/module-loader/loader.js';
import {
	createController,
	runWithErrorHandling,
} from '../../../dist/vite-plugin-astro-server/controller.js';

describe('vite-plugin-astro-server', () => {
	describe('controller', () => {
		it('calls the onError method when an error occurs in the handler', async () => {
			const controller = createController({ loader: createLoader() });
			let error = undefined;
			await runWithErrorHandling({
				controller,
				pathname: '/',
				run() {
					throw new Error('oh no');
				},
				onError(err) {
					error = err;
				},
			});
			expect(error).to.not.be.an('undefined');
			expect(error).to.be.an.instanceOf(Error);
		});

		it('sets the state to error when an error occurs in the handler', async () => {
			const controller = createController({ loader: createLoader() });
			await runWithErrorHandling({
				controller,
				pathname: '/',
				run() {
					throw new Error('oh no');
				},
				onError() {},
			});
			expect(controller.state.state).to.equal('error');
		});

		it('calls reload when a file change occurs when in an error state', async () => {
			let reloads = 0;
			const loader = createLoader({
				eachModule() {},
				clientReload() {
					reloads++;
				},
			});
			const controller = createController({ loader });
			loader.events.emit('file-change');
			expect(reloads).to.equal(0);
			await runWithErrorHandling({
				controller,
				pathname: '/',
				run() {
					throw new Error('oh no');
				},
				onError() {},
			});
			expect(reloads).to.equal(0);
			loader.events.emit('file-change');
			expect(reloads).to.equal(1);
		});

		it('does not call reload on file change if not in an error state', async () => {
			let reloads = 0;
			const loader = createLoader({
				eachModule() {},
				clientReload() {
					reloads++;
				},
			});
			const controller = createController({ loader });
			loader.events.emit('file-change');
			expect(reloads).to.equal(0);
			await runWithErrorHandling({
				controller,
				pathname: '/',
				run() {
					throw new Error('oh no');
				},
				onError() {},
			});
			expect(reloads).to.equal(0);
			loader.events.emit('file-change');
			expect(reloads).to.equal(1);
			loader.events.emit('file-change');
			expect(reloads).to.equal(2);

			await runWithErrorHandling({
				controller,
				pathname: '/',
				// No error here
				run() {},
			});
			loader.events.emit('file-change');
			expect(reloads).to.equal(2);
		});

		it('Invalidates broken modules when a change occurs in an error state', async () => {
			const mods = [
				{ id: 'one', ssrError: new Error('one') },
				{ id: 'two', ssrError: null },
				{ id: 'three', ssrError: new Error('three') },
			];

			const loader = createLoader({
				eachModule(cb) {
					return mods.forEach(cb);
				},
				invalidateModule(mod) {
					mod.ssrError = null;
				},
			});
			const controller = createController({ loader });

			await runWithErrorHandling({
				controller,
				pathname: '/',
				run() {
					throw new Error('oh no');
				},
				onError() {},
			});

			loader.events.emit('file-change');

			expect(mods).to.deep.equal([
				{ id: 'one', ssrError: null },
				{ id: 'two', ssrError: null },
				{ id: 'three', ssrError: null },
			]);
		});
	});
});
