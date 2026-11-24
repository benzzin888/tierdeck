// A self-contained Sites Worker keeps the editor and its Steam API on one origin.
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { extname } from 'node:path';
const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp','.txt':'text/plain'};
const assets = {};
async function readAssets(path = '') {
  for (const entry of await readdir('public' + path, { withFileTypes: true })) {
    const key = path + '/' + entry.name;
    if (entry.isDirectory()) { await readAssets(key); continue; }
    const type = types[extname(key)];
    if (!type) throw new Error('Unknown asset type: ' + key);
    const bytes = await readFile('public' + key);
    const compressed = key.endsWith('.json') && bytes.length > 50000;
    const payload = compressed ? gzipSync(bytes, {level:9}) : bytes;
    assets[key] = [type, compressed, payload.toString('base64')];
  }
}
await readAssets();
await mkdir('dist/server', {recursive:true});
const handler = await readFile('worker/index.mjs','utf8');
await writeFile('dist/server/index.js', 'const siteAssets = ' + JSON.stringify(assets) + ';\n' + handler);
