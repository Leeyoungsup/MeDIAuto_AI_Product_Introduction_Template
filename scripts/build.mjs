import { rm, mkdir, cp } from 'node:fs/promises';
await rm('dist', {recursive:true,force:true});
await mkdir('dist',{recursive:true});
// Explicit allowlist: never copy archives, credentials, or working-directory metadata.
for(const path of ['index.html','src','public']) await cp(path,`dist/${path}`,{recursive:true});
console.log('Built static site in dist/');
