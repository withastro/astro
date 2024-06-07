import mod from './add.wasm';


const addModule: any = new WebAssembly.Instance(mod);

export function add(a, b) {
    return addModule.exports.add(a, b);
}
