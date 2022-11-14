import { runAsWorker } from 'synckit';

const dynamicImport = new Function('m', 'return import(m)');
runAsWorker(async (source: string, options: { sourcefile: string }) => {
	const { convertToTSX } = await dynamicImport('@astrojs/compiler');
	const result: any = convertToTSX(source, options);
	return result;
});
