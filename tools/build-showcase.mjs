import {cpSync,mkdirSync,readFileSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {resolve,join,sep,basename} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..'),dest=join(root,'dist');
if(!dest.startsWith(root+sep)||basename(dest)!=='dist'||JSON.parse(readFileSync(join(root,'package.json'),'utf8')).name!=='family-game-room')throw Error('Unexpected build output directory');
if(existsSync(dest))rmSync(dest,{recursive:true});mkdirSync(dest,{recursive:true});cpSync(join(root,'site'),dest,{recursive:true});
for(const name of ['number-garden','snack-hole']){
  const game=join(root,'games',name),result=spawnSync('npm',['run','build'],{cwd:game,stdio:'inherit',shell:process.platform==='win32'});
  if(result.status!==0)process.exit(result.status||1);
  const out=join(dest,'play',name);mkdirSync(out,{recursive:true});cpSync(join(game,'dist'),out,{recursive:true});
  const index=join(out,'index.html');writeFileSync(index,readFileSync(index,'utf8').replace(/href="\/"/g,'href="../../"'));
}
const reader=join(dest,'play','reading-garden');mkdirSync(reader,{recursive:true});cpSync(join(root,'games/reading-garden/public'),reader,{recursive:true,filter:source=>basename(source)!=='login.html'});
for(const name of ['index.html','login.html']){const file=join(reader,name);if(existsSync(file))writeFileSync(file,readFileSync(file,'utf8').replace(/href="\/"/g,'href="../../"'));}
const manifest=JSON.parse(readFileSync(join(reader,'manifest.webmanifest'),'utf8'));
Object.assign(manifest,{id:'./',start_url:'./',scope:'./'});writeFileSync(join(reader,'manifest.webmanifest'),JSON.stringify(manifest,null,2));
writeFileSync(join(dest,'.nojekyll'),'');
console.log('Built the portfolio and three API-free static demos in dist/.');
