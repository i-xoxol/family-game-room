const fs=require('node:fs');
const path=require('node:path');
const esbuild=require('esbuild');
const crypto=require('node:crypto');
const root=__dirname,dest=path.join(root,'dist');
fs.mkdirSync(dest,{recursive:true});
esbuild.buildSync({absWorkingDir:root,entryPoints:['art.js','logic.js','voice.js','app.js'],outdir:dest,target:['safari12'],minify:true,charset:'utf8',legalComments:'none',logLevel:'warning'});
for(const file of ['style.css','icon.svg','fredoka-500.woff2','fredoka-700.woff2','FONT-LICENSE.txt'])fs.copyFileSync(path.join(root,file),path.join(dest,file));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'audio-manifest.json'),'utf8'));
fs.mkdirSync(path.join(dest,'audio'),{recursive:true});
const audioMap={};
for(const clip of manifest.clips){const source=path.join(root,clip.file);if(!fs.existsSync(source)||fs.statSync(source).size<500)throw new Error('Missing prerecorded clip: '+clip.id);const data=fs.readFileSync(source);fs.copyFileSync(source,path.join(dest,clip.file));audioMap[clip.id]={file:clip.file+'?v='+crypto.createHash('sha256').update(data).digest('hex').slice(0,10),text:clip.text};}
fs.writeFileSync(path.join(dest,'audio-map.js'),esbuild.transformSync('window.GardenAudioClips='+JSON.stringify(audioMap)+';',{target:'safari12',minify:true,charset:'utf8'}).code);
fs.copyFileSync(path.join(root,'audio-manifest.json'),path.join(dest,'audio/transcripts.json'));
const hash=crypto.createHash('sha256');
for(const file of ['art.js','logic.js','voice.js','app.js','audio-map.js','style.css']){const data=fs.readFileSync(path.join(dest,file));if(/sk-[A-Za-z0-9_-]{30,}|api\.openai\.com/.test(data.toString()))throw new Error('Private API material must not enter the public build');hash.update(data);}
const version=hash.digest('hex').slice(0,12);
fs.writeFileSync(path.join(dest,'index.html'),fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\?v=3/g,'?v='+version));
const bytes=manifest.clips.reduce((n,clip)=>n+fs.statSync(path.join(dest,clip.file)).size,0);
console.log(`Built the garden for Safari 12 with ${manifest.clips.length} saved voice clips (${(bytes/1024/1024).toFixed(2)} MiB, loaded only when played).`);
