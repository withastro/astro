export { loadFixture } from '../../../astro/test/test-utils.js';
import * as xml2js from 'xml2js';

export function readXML(fileOrPromise) {
	const parseString = xml2js.parseString;
	return Promise.resolve(fileOrPromise).then((xml) => {
		return new Promise((resolve, reject) => {
			parseString(xml, function (err, result) {
				if (err) return reject(err);
				resolve(result);
			});
		});
	});
}
