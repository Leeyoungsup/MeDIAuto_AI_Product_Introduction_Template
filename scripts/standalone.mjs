import { readFile, writeFile } from 'node:fs/promises';
const read = path => readFile(path, 'utf8');
const manifest = JSON.parse(await read('public/mediauto-ai/manifest.json'));
for (const pair of manifest.pairs) {
  pair.web = Object.fromEntries(await Promise.all(['before','after'].map(async side => {
    const bytes = await readFile(`public/mediauto-ai/${pair.web?.[side] || pair[side]}`);
    return [side, `data:image/webp;base64,${bytes.toString('base64')}`];
  })));
}
let html = await read('index.html');
html = html.replace('<link rel="stylesheet" href="./src/style.css"><script type="module" src="./src/main.js"></script>', `<style>${await read('src/style.css')}</style>`);
const review = await readFile('public/mediauto-ai/expert-review.webp');
html = html.replace('./public/mediauto-ai/expert-review.webp', `data:image/webp;base64,${review.toString('base64')}`);
const comparison = (await read('src/comparison.js')).replace('export class ', 'class ');
const content = (await read('src/content.js')).replace('export const ', 'const ');
const config = (await read('src/config.js')).replaceAll('export const ', 'const ').replace('import.meta.url', 'location.href');
const main = (await read('src/main.js'))
  .replace(/^import .*;\n/gm, '')
  .replace("const response=await fetch(manifestURL); if(!response.ok) throw new Error('manifest');\n  const manifest=await response.json();", 'const manifest = embeddedManifest;');
const script = `(() => {\nconst embeddedManifest = ${JSON.stringify(manifest)};\n${comparison}\n${content}\n${config}\n${main}\n})();`;
html = html.replace('</body>', `<script>${script.replaceAll('</script', '<\\/script')}</script></body>`);
await writeFile('MeDIAuto-AI.html', html);
console.log(`Created MeDIAuto-AI.html (${(Buffer.byteLength(html)/1024/1024).toFixed(1)} MB), fully offline.`);
