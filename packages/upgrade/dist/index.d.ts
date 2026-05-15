import { getContext } from './actions/context.js';
import { install } from './actions/install.js';
import { collectPackageInfo, verify } from './actions/verify.js';
import { setStdout } from './messages.js';
export declare function main(): Promise<void>;
export { getContext, install, setStdout, verify, collectPackageInfo };
