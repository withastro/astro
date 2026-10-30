import fs from 'node:fs';
import path from 'node:path';

export const cwdAsset = fs.readFileSync(path.join(process.cwd(), 'asset.txt'), 'utf8');
