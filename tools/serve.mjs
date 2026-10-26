import http from 'node:http';
import {createReadStream} from 'node:fs';
import {realpath,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {byteRange} from './byte-range.mjs';
const root=await realpath(resolve(import.meta.dirname,'../dist')),port=Number(process.env.PORT||18102);
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg','.wav':'audio/wav','.ttf':'font/ttf','.woff2':'font/woff2','.txt':'text/plain'};
http.createServer(async(req,res)=>{try{
  let pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);if(pathname.endsWith('/'))pathname+='index.html';
  if(pathname.split('/').some(part=>part.startsWith('.')))throw Error();
  const file=await realpath(resolve(root,'.'+pathname)),info=await stat(file);if(!file.startsWith(root+sep)||!info.isFile())throw Error();
  const range=byteRange(req.headers.range,info.size);if(range?.invalid){res.writeHead(416,{'content-range':`bytes */${info.size}`});res.end();return;}
  res.writeHead(range?206:200,{'content-type':types[extname(file)]||'application/octet-stream','content-length':range?range.length:info.size,'cache-control':'no-store','accept-ranges':'bytes',...(range?{'content-range':`bytes ${range.start}-${range.end}/${info.size}`}:{})});
  if(req.method==='HEAD'){res.end();return;}createReadStream(file,range?{start:range.start,end:range.end}:undefined).pipe(res);
}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`Family Game Room: http://127.0.0.1:${port}/`));
