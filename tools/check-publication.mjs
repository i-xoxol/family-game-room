import {readdirSync,readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,join,relative,extname,dirname,sep} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const skip=new Set(['.git','node_modules','dist','qa-output','.vercel','.tanstack','.output','__pycache__']);
const textTypes=new Set(['.md','.html','.css','.js','.mjs','.cjs','.ts','.tsx','.json','.yml','.yaml','.svg','.txt','.toml','.py','.sh','']);
const patterns=[
  ['provider key',/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}/],
  ['Google key',/\bAIza[A-Za-z0-9_-]{30,}/],
  ['GitHub token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/],
  ['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['private deployment location',/(?:192\.168\.4\.\d+|\/home\/igorx|C:[\\/]Data[\\/]General Tasks)/i],
  ['private family context',new RegExp(['Spring Glen School','Miss Lavorgna','Leeloo','\\bEvie\\b'].join('|'),'i')]
];
const errors=[];let checked=0;
function walk(dir,callback){for(const item of readdirSync(dir,{withFileTypes:true})){if(skip.has(item.name))continue;const file=join(dir,item.name);if(item.isDirectory())walk(file,callback);else if(item.isFile())callback(file);}}
walk(root,file=>{
  const path=relative(root,file).replaceAll('\\','/');
  if(/(?:^|\/)(?:\.env(?:\..+)?|family-profile\.json|robot\.db|OPERATIONS\.private\.md)$/.test(path)&&!path.endsWith('.env.example'))errors.push(path+': private operational file');
  if(!textTypes.has(extname(file))||statSync(file).size>2000000||path==='tools/check-publication.mjs')return;
  const source=readFileSync(file,'utf8');checked++;
  for(const [label,pattern]of patterns)if(pattern.test(source))errors.push(path+': '+label);
});
const site=join(root,'dist');
if(!existsSync(site))errors.push('Run npm run build before checking portfolio links');
else for(const item of readdirSync(site)){
  if(!item.endsWith('.html'))continue;
  const file=join(site,item),source=readFileSync(file,'utf8');
  for(const match of source.matchAll(/(?:href|src)="([^"]+)"/g)){
    const link=match[1];if(/^(?:https?:|data:|#|mailto:)/.test(link))continue;
    const clean=decodeURIComponent(link.split(/[?#]/)[0]);let target=resolve(dirname(file),clean);
    if(!target.startsWith(site+sep)&&target!==site){errors.push(item+': path outside build');continue;}
    if(existsSync(target)&&statSync(target).isDirectory())target=join(target,'index.html');
    if(!existsSync(target))errors.push(item+': missing '+link);
  }
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Checked ${checked} source files and all local portfolio references. No prohibited publication data found.`);
