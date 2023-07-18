import * as fs from "node:fs";
import * as path from "node:path";
import Queue from "../queue/queue.js";
import { detector } from "./detector.js";
import { typeHandlers, type imageType } from "./types.js";
import type { ISizeCalculationResult } from "./types/interface.js";

type CallbackFn = (e: Error | null, r?: ISizeCalculationResult) => void;

// Maximum buffer size, with a default of 512 kilobytes.
// TO-DO: make this adaptive based on the initial signature of the image
const MaxBufferSize = 512 * 1024;

// This queue is for async `fs` operations, to avoid reaching file-descriptor limits
const queue = new Queue({ concurrency: 100, autostart: true });

interface Options {
  disabledFS: boolean;
  disabledTypes: imageType[];
}

const globalOptions: Options = {
  disabledFS: false,
  disabledTypes: [],
};

/**
 * Return size information based on a buffer
 *
 * @param {Buffer} buffer
 * @param {String} filepath
 * @returns {Object}
 */
function lookup(buffer: Buffer, filepath?: string): ISizeCalculationResult {
  // detect the file type.. don't rely on the extension
  const type = detector(buffer);

  if (typeof type !== "undefined") {
    if (globalOptions.disabledTypes.indexOf(type) > -1) {
      throw new TypeError("disabled file type: " + type);
    }

    // find an appropriate handler for this file type
    if (type in typeHandlers) {
      const size = typeHandlers[type].calculate(buffer, filepath);
      if (size !== undefined) {
        size.type = type;
        return size;
      }
    }
  }

  // throw up, if we don't understand the file
  throw new TypeError(
    "unsupported file type: " + type + " (file: " + filepath + ")"
  );
}

/**
 * Reads a file into a buffer.
 * @param {String} filepath
 * @returns {Promise<Buffer>}
 */
async function asyncFileToBuffer(filepath: string): Promise<Buffer> {
  const handle = await fs.promises.open(filepath, "r");
  const { size } = await handle.stat();
  if (size <= 0) {
    await handle.close();
    throw new Error("Empty file");
  }
  const bufferSize = Math.min(size, MaxBufferSize);
  const buffer = Buffer.alloc(bufferSize);
  await handle.read(buffer, 0, bufferSize, 0);
  await handle.close();
  return buffer;
}

/**
 * Synchronously reads a file into a buffer, blocking the nodejs process.
 *
 * @param {String} filepath
 * @returns {Buffer}
 */
function syncFileToBuffer(filepath: string): Buffer {
  // read from the file, synchronously
  const descriptor = fs.openSync(filepath, "r");
  const { size } = fs.fstatSync(descriptor);
  if (size <= 0) {
    fs.closeSync(descriptor);
    throw new Error("Empty file");
  }
  const bufferSize = Math.min(size, MaxBufferSize);
  const buffer = Buffer.alloc(bufferSize);
  fs.readSync(descriptor, buffer, 0, bufferSize, 0);
  fs.closeSync(descriptor);
  return buffer;
}

export default imageSize;
export function imageSize(input: Buffer | string): ISizeCalculationResult;
export function imageSize(input: string, callback: CallbackFn): void;

/**
 * @param {Buffer|string} input - buffer or relative/absolute path of the image file
 * @param {Function=} [callback] - optional function for async detection
 */
export function imageSize(
  input: Buffer | string,
  callback?: CallbackFn
): ISizeCalculationResult | void {
  // Handle buffer input
  if (Buffer.isBuffer(input)) {
    return lookup(input);
  }

  // input should be a string at this point
  if (typeof input !== "string" || globalOptions.disabledFS) {
    throw new TypeError("invalid invocation. input should be a Buffer");
  }

  // resolve the file path
  const filepath = path.resolve(input);
  if (typeof callback === "function") {
    queue.push(() =>
      asyncFileToBuffer(filepath)
        .then((buffer) =>
          process.nextTick(callback, null, lookup(buffer, filepath))
        )
        .catch(callback)
    );
  } else {
    const buffer = syncFileToBuffer(filepath);
    return lookup(buffer, filepath);
  }
}

export const disableFS = (v: boolean): void => {
  globalOptions.disabledFS = v;
};
export const disableTypes = (types: imageType[]): void => {
  globalOptions.disabledTypes = types;
};
export const setConcurrency = (c: number): void => {
  queue.concurrency = c;
};
export const types = Object.keys(typeHandlers);
