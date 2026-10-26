"""Generate fixed assets in an authorized Google Cloud Shell. No credentials exported."""
from pathlib import Path
import base64, concurrent.futures, json, os, subprocess, sys, time, urllib.request, urllib.error, zipfile

root=Path(__file__).resolve().parent
project=os.environ['TTS_PROJECT']
jobs=json.loads((root/'audio-jobs.json').read_text())
output=root/'prepared'; (output/'audio').mkdir(parents=True,exist_ok=True)
price=16/1_000_000
budget=3.0
requested=sum(len(j['ssml']) for j in jobs)
assert requested*price*3 < budget, 'Generation plus maximum retries would exceed cap'
token=subprocess.check_output(['gcloud','auth','print-access-token'],text=True).strip()
voice=os.environ.get('TTS_VOICE','en-US-Neural2-F')
ledger_path=output/'generation-ledger.json'
ledger=json.loads(ledger_path.read_text()) if ledger_path.exists() else {'provider':'Google Cloud Text-to-Speech','voice':voice,'characters':0,'requests':0,'estimatedDollars':0,'clips':{}}

def synth(job):
    path=output/'audio'/(job['id']+'.mp3')
    if path.exists() and job['id'] in ledger['clips']: return job['id'],ledger['clips'][job['id']],0,0
    payload={'input':{'ssml':job['ssml']},'voice':{'languageCode':'en-US','name':voice},'audioConfig':{'audioEncoding':'MP3','speakingRate':job['rate'],'sampleRateHertz':24000}}
    if job.get('marks'): payload['enableTimePointing']=['SSML_MARK']
    charged=0
    for attempt in range(3):
        charged+=len(job['ssml'])
        req=urllib.request.Request('https://texttospeech.googleapis.com/v1beta1/text:synthesize',data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+token,'Content-Type':'application/json','X-Goog-User-Project':project})
        try:
            with urllib.request.urlopen(req,timeout=45) as r: data=json.load(r)
            audio=base64.b64decode(data['audioContent']); assert len(audio)>100
            path.write_bytes(audio)
            marks=[{'word':int(x['markName'][1:]),'time':x['timeSeconds']} for x in data.get('timepoints',[]) if x['markName'].startswith('w')]
            if job.get('marks'):
                expected=len(job['text'].split())
                assert len(marks)==expected, f'Missing word timestamps for {job["id"]}'
                assert all(marks[i]['time']<=marks[i+1]['time'] for i in range(len(marks)-1))
            item={'file':'audio/'+path.name,'text':job['text'],'marks':marks,'bytes':len(audio)}
            return job['id'],item,charged,attempt+1
        except urllib.error.HTTPError as e:
            # Error bodies can contain only our fixed text, never credentials.
            detail=e.read().decode()[:400]
            if e.code not in [429,500,502,503,504] or attempt==2: raise RuntimeError(f'{job["id"]}: HTTP {e.code}: {detail}')
            time.sleep(2**attempt)
    raise RuntimeError('generation_failed')

selection=[j for j in jobs if len(sys.argv)<2 or j['id'] in sys.argv[1].split(',')]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    for n,result in enumerate(pool.map(synth,selection),1):
        id,item,characters,requests=result
        ledger['characters']+=characters; ledger['requests']+=requests; ledger['estimatedDollars']=round(ledger['characters']*price,6); ledger['clips'][id]=item
        ledger_path.write_text(json.dumps(ledger,ensure_ascii=False,indent=2))
        (output/'audio-manifest.json').write_text(json.dumps({'version':1,'provider':'Google Cloud Text-to-Speech','voice':voice,'clips':ledger['clips']},ensure_ascii=False))
        if n%20==0 or n==len(selection): print(json.dumps({'done':n,'total':len(selection),'estimatedDollars':ledger['estimatedDollars']}),flush=True)
with zipfile.ZipFile(root/'eric-reading-audio.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for p in output.rglob('*'):
        if p.is_file(): archive.write(p,p.relative_to(output))
print(json.dumps({'archive':'eric-reading-audio.zip','clips':len(ledger['clips']),'estimatedDollars':ledger['estimatedDollars']}),flush=True)
