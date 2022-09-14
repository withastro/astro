
import { isMainThread } from 'node:worker_threads';
import WorkerPool from './worker-pool.js';
import * as impl from './impl.js';
import execOnce from './execOnce.js';
import type { OutputFormat } from '../../loaders/index.js';

type RotateOperation = {
  type: 'rotate'
  numRotations: number
}
type ResizeOperation = {
  type: 'resize'
	width?: number
	height?: number
}
export type Operation = RotateOperation | ResizeOperation

// HACK!  Find the right import assuming this works
const getWorker = execOnce(
  () => new WorkerPool(6, './node_modules/@astrojs/image/dist/vendor/squoosh/main.js')
)

type DecodeParams = {
	operation: 'decode',
	buffer: Buffer
};
type ResizeParams = {
	operation: 'resize',
	imageData: ImageData,
	height?: number,
	width?: number
};
type RotateParams = {
	operation: 'rotate',
	imageData: ImageData,
	numRotations: number
};
type EncodeParams = {
	operation: 'encode',
	imageData: ImageData,
	format: OutputFormat,
	quality?: number
}
type JobMessage = DecodeParams | ResizeParams | RotateParams | EncodeParams

function handleJob(params: JobMessage) {
  switch (params.operation) {
    case 'decode':
      return impl.decodeBuffer(params.buffer)
		case 'resize':
			return impl.resize({ image: params.imageData as any, width: params.width, height: params.height })
		case 'rotate':
			return impl.rotate(params.imageData as any, params.numRotations);
		case 'encode':
			switch (params.format) {
				case 'jpeg':
				case 'jpg':
					return impl.encodeJpeg(params.imageData as any, { quality: params.quality || 100 })
				case 'webp':
					return impl.encodeWebp(params.imageData as any, { quality: params.quality || 100 })
				case 'avif':
					return impl.encodeAvif(params.imageData as any, { quality: params.quality || 100 })
				case 'png':
					return impl.encodePng(params.imageData as any)
				default:
					throw Error(`Unsupported encoding format`)
			}
    default:
      throw Error(`Invalid job "${(params as any).operation}"`);
  }
}

export async function processBuffer(
  buffer: Buffer,
  operations: Operation[],
  encoding: OutputFormat,
  quality: number
): Promise<Buffer> {
	const worker = await getWorker()

  let imageData = await worker.dispatchJob({
		operation: 'decode',
		buffer,
	})
  for (const operation of operations) {
    if (operation.type === 'rotate') {
			imageData = await worker.dispatchJob({
				operation: 'rotate',
				imageData,
				numRotations: operation.numRotations
			});
    } else if (operation.type === 'resize') {
			imageData = await worker.dispatchJob({
				operation: 'resize',
				imageData,
				height: operation.height,
				width: operation.width
			})
    }
  }

	return await worker.dispatchJob({
		operation: 'encode',
		format: encoding,
		imageData,
		quality
	}) as Buffer
}

if (!isMainThread) {
  WorkerPool.useThisThreadAsWorker(handleJob);
}
