import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
const root=resolve(import.meta.dirname,'..'),action=process.argv[2];
const projects=['number-garden','snack-hole','reading-garden','robi'];
function run(folder,args){const result=spawnSync('npm',args,{cwd:resolve(root,'games',folder),stdio:'inherit',shell:process.platform==='win32'});if(result.status!==0)process.exit(result.status||1);}
if(action==='setup'){
  for(const name of [...projects,'super-eric']){
    if(!existsSync(resolve(root,'games',name,'package.json')))throw Error('Initialize the Robi submodule: git submodule update --init --recursive');
    if(name!=='reading-garden')run(name,['ci','--ignore-scripts']);
  }
}else if(action==='test'){
  for(const name of projects){
    if(['reading-garden','robi'].includes(name))run(name,['run','check']);
    run(name,['test']);
  }
  const result=spawnSync(process.execPath,['--test','tools/byte-range.test.mjs'],{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}else throw Error('Use setup or test. Super Eric has its own full framework checks; see its README.');
