import { loadFile, writeFile } from "magicast";

async function updateConfig() {
  try {
    const mod = await loadFile("config.js");

    mod.exports.default.foo.push("b");

    await writeFile(mod);
  } catch (e) {
    console.error('Unable to update config.js')
    console.error('Please update it manually with the following instructions: ...')
    // handle error
  }
}
