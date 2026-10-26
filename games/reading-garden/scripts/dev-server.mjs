import http from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const base=await realpath(new URL('../public/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.mp3':'audio/mpeg','.wav':'audio/wav','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://local').pathname);if(path.endsWith('/'))path+='index.html';const file=await realpath(resolve(base,'.'+path));if(!file.startsWith(base+sep)||!(await stat(file)).isFile())throw Error();const data=await readFile(file);res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(18098,'127.0.0.1',()=>console.log('Reading preview http://127.0.0.1:18098/'));
