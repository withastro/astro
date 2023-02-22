import { init as initSatoriWasm } from 'satori';
import yoga from "yoga-wasm-web";
import { initWasm as initResvgWasm } from '@resvg/resvg-wasm';

import resvgWasm from './resvg.wasm?asset';
import yogaWasm from './yoga.wasm?asset';
import font400File from './inter-400.woff?asset';
import font400iFile from './inter-400i.woff?asset';
import font700File from './inter-700.woff?asset';
import font700iFile from './inter-700i.woff?asset';

const noop = () => {}
const initResvg = Promise.resolve(resvgWasm).then(buf => initResvgWasm(new WebAssembly.Module(buf))).catch(console.error);
const initSatori = Promise.resolve(yogaWasm).then(buf => yoga(buf).then((x) => initSatoriWasm(x))).catch(noop);
const initFont = Promise.all([font400File, font400iFile, font700File, font700iFile]).then(([$400, $400i, $700, $700i]) => [{ name: "sans-serif", data: $400, weight: 401, style: "normal" }, { name: "sans-serif", data: $400i, weight: 401, style: "italic" }, { name: "sans-serif", data: $700, weight: 701, style: "normal" }, { name: "sans-serif", data: $700i, weight: 701, style: "italic" }]).catch(noop)

export default async function init() {
    const [fonts] = await Promise.all([initFont, initResvg, initSatori]);
    return { fonts }
}
