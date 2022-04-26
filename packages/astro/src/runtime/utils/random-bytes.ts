// Based off of https://www.npmjs.com/package/@lumeweb/randombytes-browser and https://www.npmjs.com/package/randombytes
// This rendition adds better browser support, plus better typescript support

// limit of Crypto.getRandomValues()
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
const MAX_BYTES = 65536;

// Node supports requesting up to this number of bytes
// https://github.com/nodejs/node/blob/master/lib/internal/crypto/random.js#L48
const MAX_UINT32 = 4294967295;

const GlobalCrypto = globalThis.crypto as Crypto;

export function randomBytes(size: number, cb?: (...args: any) => any) {
    if (!(GlobalCrypto && GlobalCrypto.getRandomValues)) {
        throw new Error('Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11')
    }

    // phantomjs needs to throw
    if (size > MAX_UINT32) throw new RangeError('requested too many random bytes');

    let bytes = new Uint32Array(size)

    if (size > 0) {  // getRandomValues fails on IE if size == 0
        if (size > MAX_BYTES) { // this is the max bytes crypto.getRandomValues
            // can do at once see https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
            for (let generated = 0; generated < size; generated += MAX_BYTES) {
                // buffer.slice automatically checks if the end is past the end of
                // the buffer so we don't have to here
                GlobalCrypto.getRandomValues(bytes.slice(generated, generated + MAX_BYTES));
            }
        } else {
            GlobalCrypto.getRandomValues(bytes);
        }
    }

    if (typeof cb === 'function') {
        Promise.resolve().then(() => {
            return cb(null, bytes);
        });
        return;
    }

    return bytes;
}

export default randomBytes;