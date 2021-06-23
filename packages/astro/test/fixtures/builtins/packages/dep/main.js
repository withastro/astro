import fs from 'fs';

const readFile = fs.promises.readFile;

export async function readJson(path) {
  const json = await readFile(path, 'utf-8');
  const data = JSON.parse(json);
  return data;
}

