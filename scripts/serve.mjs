import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=resolve(process.argv.includes('--dist')?'dist':'.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp'};
const port=Number(process.env.PORT||4173);
createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let path=resolve(root,'.'+pathname);if(!path.startsWith(root+sep)&&path!==root)throw Error();if((await stat(path)).isDirectory())path=resolve(path,'index.html');if(!['.html','.js','.css','.json','.png','.webp'].includes(extname(path)))throw Error();res.writeHead(200,{'Content-Type':types[extname(path)],'Cache-Control':'no-cache'});res.end(await readFile(path));}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
