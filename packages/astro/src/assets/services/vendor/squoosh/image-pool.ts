import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { isMainThread } from 'node:worker_threads';
import type { ImageOutputFormat } from '../../../types.js';
import { getModuleURL } from './emscripten-utils.js';
import type { Operation } from './image.js';
import * as impl from './impl.js';
import execOnce from './utils/execOnce.js';
import WorkerPool from './utils/workerPool.js';

const getWorker = execOnce(() => {
	return new WorkerPool(
		// There will be at most 7 workers needed since each worker will take
		// at least 1 operation type.
		Math.max(1, Math.min(cpus().length - 1, 7)),
		fileURLToPath(getModuleURL(import.meta.url))
	);
});

type DecodeParams = {
	operation: 'decode';
	buffer: Uint8Array;
};
type ResizeParams = {
	operation: 'resize';
	imageData: ImageData;
	height?: number;
	width?: number;
};
type RotateParams = {
	operation: 'rotate';
	imageData: ImageData;
	numRotations: number;
};
type EncodeAvifParams = {
	operation: 'encodeavif';
	imageData: ImageData;
	quality: number;
};
type EncodeJpegParams = {
	operation: 'encodejpeg';
	imageData: ImageData;
	quality: number;
};
type EncodePngParams = {
	operation: 'encodepng';
	imageData: ImageData;
};
type EncodeWebpParams = {
	operation: 'encodewebp';
	imageData: ImageData;
	quality: number;
};
type JobMessage =
	| DecodeParams
	| ResizeParams
	| RotateParams
	| EncodeAvifParams
	| EncodeJpegParams
	| EncodePngParams
	| EncodeWebpParams;

function handleJob(params: JobMessage) {
	switch (params.operation) {
		case 'decode':
			return impl.decodeBuffer(params.buffer);
		case 'resize':
			return impl.resize({
				image: params.imageData as any,
				width: params.width,
				height: params.height,
			});
		case 'rotate':
			return impl.rotate(params.imageData as any, params.numRotations);
		case 'encodeavif':
			return impl.encodeAvif(params.imageData as any, { quality: params.quality });
		case 'encodejpeg':
			return impl.encodeJpeg(params.imageData as any, { quality: params.quality });
		case 'encodepng':
			return impl.encodePng(params.imageData as any);
		case 'encodewebp':
			return impl.encodeWebp(params.imageData as any, { quality: params.quality });
		default:
			throw Error(`Invalid job "${(params as any).operation}"`);
	}
}

export async function processBuffer(
	buffer: Uint8Array,
	operations: Operation[],
	encoding: ImageOutputFormat,
	quality?: number
): Promise<Uint8Array> {
	// @ts-ignore
	const worker = await getWorker();

	let imageData = await worker.dispatchJob({
		operation: 'decode',
		buffer,
	});
	for (const operation of operations) {
		if (operation.type === 'rotate') {
			imageData = await worker.dispatchJob({
				operation: 'rotate',
				imageData,
				numRotations: operation.numRotations,
			});
		} else if (operation.type === 'resize') {
			imageData = await worker.dispatchJob({
				operation: 'resize',
				imageData,
				height: operation.height,
				width: operation.width,
			});
		}
	}

	switch (encoding) {
		case 'avif':
			return (await worker.dispatchJob({
				operation: 'encodeavif',
				imageData,
				quality,
			})) as Uint8Array;
		case 'jpeg':
		case 'jpg':
			return (await worker.dispatchJob({
				operation: 'encodejpeg',
				imageData,
				quality,
			})) as Uint8Array;
		case 'png':
			return (await worker.dispatchJob({
				operation: 'encodepng',
				imageData,
			})) as Uint8Array;
		case 'webp':
			return (await worker.dispatchJob({
				operation: 'encodewebp',
				imageData,
				quality,
			})) as Uint8Array;
		case 'svg':
		default:
			throw Error(`Unsupported encoding format`);
	}
}

if (!isMainThread) {
	WorkerPool.useThisThreadAsWorker(handleJob);
}
