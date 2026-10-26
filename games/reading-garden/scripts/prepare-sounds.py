"""Prepare isolated phonemes on Linux with libespeak-ng; no network/API calls.

Google narration stays untouched. Bare consonant SSML can fall back to letter
names. Generate a controlled phoneme carrier locally and remove its vowel at
the engine's phoneme event boundary. Save PCM WAV, avoiding encoder delay.
Usage: python3 scripts/prepare-sounds.py /path/to/public
Requires the distribution's libespeak-ng1 and python3-numpy packages.
"""
from pathlib import Path
import ctypes as c
import ctypes.util
import json
import sys
import wave
import numpy as np

# Explicit US phonemes. I; prevents word-final short-i becoming happy /i/.
# r- is the American approximant; bare r is a different phoneme.
MODELS = {
    'a': ('a', ['æ']), 'b': ('b@', ['b']), 'c': ('k@', ['k']),
    'd': ('d@', ['d']), 'e': ('E', ['ɛ']), 'f': ('f:', ['f']),
    'g': ('g@', ['ɡ']), 'h': ('h@', ['h']), 'i': ('I;', ['ɪ']),
    'j': ('dZ@', ['dʒ']), 'k': ('k@', ['k']), 'l': ('l@', ['l']),
    'm': ('m@', ['m']), 'n': ('n@', ['n']), 'o': ('A:', ['ɑː']),
    'p': ('p@', ['p']), 'qu': ('kw@', ['k', 'w']),
    'r': ('r-@', ['ɹ']), 's': ('s:', ['s']), 't': ('t@', ['t']),
    'u': ('V', ['ʌ']), 'v': ('v@', ['v']), 'w': ('w@', ['w']),
    'x': ('ks@', ['k', 's']), 'y': ('j@', ['j']), 'z': ('z@', ['z']),
    'sh': ('S:', ['ʃ']), 'ch': ('tS@', ['tʃ']), 'th': ('T:', ['θ']),
    'ck': ('k@', ['k']),
}

class EventID(c.Union):
    _fields_ = [('number', c.c_int), ('name', c.c_char_p), ('string', c.c_char * 8)]

class Event(c.Structure):
    _fields_ = [('type', c.c_int), ('uid', c.c_uint), ('text_position', c.c_int),
                ('length', c.c_int), ('audio_position', c.c_int), ('sample', c.c_int),
                ('user_data', c.c_void_p), ('id', EventID)]

def prepare(public):
    manifest_path = public / 'audio-manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    assert {k[6:] for k in manifest['clips'] if k.startswith('sound-')} <= set(MODELS)
    lib = c.CDLL(ctypes.util.find_library('espeak-ng'))
    rate = lib.espeak_Initialize(2, 0, None, 3)  # synchronous, phoneme events in IPA
    assert rate > 0
    assert lib.espeak_SetVoiceByName(b'en-us') == 0
    lib.espeak_SetParameter(1, 105, 0)
    samples, events = [], []

    @c.CFUNCTYPE(c.c_int, c.POINTER(c.c_short), c.c_int, c.POINTER(Event))
    def callback(data, count, event_list):
        if count:
            samples.append(np.ctypeslib.as_array(data, shape=(count,)).copy())
        i = 0
        while event_list[i].type:
            event = event_list[i]
            if event.type == 7:
                events.append((event.id.string.decode('utf-8'), event.audio_position))
            i += 1
        return 0

    lib.espeak_SetSynthCallback(callback)
    report = []
    for name, (source, expected) in MODELS.items():
        samples.clear()
        events.clear()
        text = ('[[' + source + ']]').encode()
        assert lib.espeak_Synth(text, len(text) + 1, 0, 1, 0, 0x101, None, None) == 0
        pcm = np.concatenate(samples).astype(float)
        actual = [p for p, _ in events if p]
        assert actual == expected + (['ə'] if source.endswith('@') else []), (name, events)
        # Remove the carrier at its event boundary, with a small guard against
        # coarticulation crossing the boundary. Stops retain their release.
        end_ms = events[len(expected)][1]
        end = int((end_ms - (6 if source.endswith('@') else 0)) * rate / 1000)
        pcm = pcm[:end]
        active = np.flatnonzero(np.abs(pcm) > max(18, np.max(np.abs(pcm)) * .006))
        assert len(active) > 20, (name, 'silent phoneme')
        pcm = pcm[max(0, active[0] - int(.006 * rate)):active[-1] + 1]
        peak = np.max(np.abs(pcm))
        pcm *= (16384 if name in 'aeiou' else 12000) / peak
        fade = min(int(.004 * rate), len(pcm) // 5)
        pcm[:fade] *= np.linspace(0, 1, fade)
        pcm[-fade:] *= np.linspace(1, 0, fade)
        pcm = np.pad(pcm, (int(.025 * rate), int(.055 * rate))).astype('<i2')
        dest = public / 'audio' / ('sound-' + name + '.wav')
        with wave.open(str(dest), 'wb') as output:
            output.setnchannels(1)
            output.setsampwidth(2)
            output.setframerate(rate)
            output.writeframes(pcm.tobytes())
        clip = manifest['clips'].setdefault('sound-' + name, {'text': name, 'marks': []})
        clip.update(file='audio/' + dest.name, bytes=dest.stat().st_size,
                    source='eSpeak NG en-us, isolated by phoneme event',
                    ipa=''.join(expected), duration=round(len(pcm) / rate, 4))
        report.append({'id': name, 'source': source, 'events': list(events),
                       'keptUntilMs': round(end / rate * 1000, 2),
                       'seconds': clip['duration'], 'peak': int(abs(pcm).max())})
    lib.espeak_Terminate()
    manifest['provider'] = 'Google Cloud narration; locally prepared eSpeak NG phonemes'
    manifest['soundModelVersion'] = 2
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False), encoding='utf-8')
    report_path = public.parent / 'phoneme-preparation.json'
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'prepared': len(report), 'report': str(report_path), 'apiCost': 0}))

if __name__ == '__main__':
    prepare(Path(sys.argv[1]).resolve())
