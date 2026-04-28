// @ts-check

import { Transform } from 'node:stream';
import { CILogger } from './github-utils.js';

// Custom reporter for the Node.js test runner used to log tests for analysis and reporting in CI.
export default new Transform({
	writableObjectMode: true,
	/**
	 * @param {import('node:test/reporters').TestEvent} event
	 * @param {BufferEncoding} _encoding
	 * @param {import('node:stream').TransformCallback} callback
	 */
	transform(event, _encoding, callback) {
		switch (event.type) {
			case 'test:pass':
				CILogger.logTest({
					duration: event.data.details.duration_ms,
					name: event.data.name,
					file: event.data.file,
					line: event.data.line,
					column: event.data.column,
					isSuite: event.data.details.type === 'suite',
				});
				break;
		}
		callback();
	},
});
