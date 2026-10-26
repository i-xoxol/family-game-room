export type Hud = {
  phase: "title" | "play";
  skyName: string;
  filled: number;
  goal: number;
  rescues: number;
  cheer: string | null;
  sound: boolean;
  hint: boolean;
};

export type HeroApi = {
  start: () => void;
  toggleSound: () => void;
  destroy: () => void;
};

const GOAL = 6;
const STEP = 1 / 60;
const SAVE_KEY = "super-eric-v1";
const CHEERS = ["YAY!", "ZOOM!", "WOW!", "HERO!"];

const INK = "#1c2340";
const CREAM = "#fff6e4";
const GOLD = "#ffb020";
const CORAL = "#ff6d4d";
const CORAL_DEEP = "#e4543a";
const TEAL = "#2fbfa8";

type Theme = {
  name: string;
  top: string;
  mid: string;
  bottom: string;
  ground: string;
  hill: string;
  cloud: string;
  lit: number;
};

const THEMES: Theme[] = [
  {
    name: "Sunny",
    top: "#8fd4f2",
    mid: "#ffe7b0",
    bottom: "#ffc36b",
    ground: "#1f8f86",
    hill: "#18756e",
    cloud: "rgba(255,246,228,0.94)",
    lit: 0.55,
  },
  {
    name: "Sunset",
    top: "#ffb08a",
    mid: "#ff8f6e",
    bottom: "#ff6d4d",
    ground: "#6a3a4e",
    hill: "#5a3048",
    cloud: "rgba(255,246,228,0.8)",
    lit: 0.15,
  },
  {
    name: "Night",
    top: "#141a30",
    mid: "#24345e",
    bottom: "#1c2340",
    ground: "#12182c",
    hill: "#101628",
    cloud: "rgba(255,246,228,0.18)",
    lit: -0.35,
  },
  {
    name: "Rainbow",
    top: "#7ee0d2",
    mid: "#ffe08a",
    bottom: "#ffb0a0",
    ground: "#1c8f86",
    hill: "#18786f",
    cloud: "rgba(255,246,228,0.92)",
    lit: 0.2,
  },
];

type Rescue = {
  on: boolean;
  wait: number;
  x: number;
  y: number;
  vx: number;
  r: number;
  kind: number;
  bob: number;
};

type Spark = {
  on: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: number;
};

type Ring = { on: boolean; x: number; y: number; life: number; max: number };
type Floater = { on: boolean; x: number; y: number; life: number; text: string };
type Bldg = { x: number; w: number; h: number; seed: number; i: number };
type Pt = { x: number; y: number };

type Save = { v: 1; rescues: number; sound: boolean };

declare global {
  interface Window {
    __hero?: {
      phase: string;
      rescues: number;
      filled: number;
      x: number;
      y: number;
      theme: string;
      spots: () => { x: number; y: number; kind: number }[];
    };
  }
}

function loadSave(): Save {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { v: 1, rescues: 0, sound: true };
    const parsed = JSON.parse(raw) as Partial<Save>;
    return {
      v: 1,
      rescues: typeof parsed.rescues === "number" && parsed.rescues > 0 ? parsed.rescues : 0,
      sound: parsed.sound !== false,
    };
  } catch {
    return { v: 1, rescues: 0, sound: true };
  }
}

function noise(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function starPath(ctx: CanvasRenderingContext2D, r: number, inner: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function heartPath(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.36);
  ctx.bezierCurveTo(-s * 0.02, s * 0.08, -s * 0.52, s * 0.06, -s * 0.52, -s * 0.18);
  ctx.bezierCurveTo(-s * 0.52, -s * 0.5, -s * 0.16, -s * 0.56, 0, -s * 0.3);
  ctx.bezierCurveTo(s * 0.16, -s * 0.56, s * 0.52, -s * 0.5, s * 0.52, -s * 0.18);
  ctx.bezierCurveTo(s * 0.52, s * 0.06, s * 0.02, s * 0.08, 0, s * 0.36);
  ctx.closePath();
}

function makeGlow(size: number, inner: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;
  const mid = size / 2;
  const rad = g.createRadialGradient(mid, mid, size * 0.08, mid, mid, mid);
  rad.addColorStop(0, inner);
  rad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = rad;
  g.fillRect(0, 0, size, size);
  return c;
}

function makeDots(color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 14;
  c.height = 14;
  const g = c.getContext("2d");
  if (!g) return c;
  g.fillStyle = color;
  g.beginPath();
  g.arc(3, 3, 1.25, 0, Math.PI * 2);
  g.fill();
  return c;
}

function createAudio() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let sfx: GainNode | null = null;
  let music: GainNode | null = null;
  let muted = false;
  let nextNote = 0;
  let step = 0;
  const scale = [261.63, 329.63, 392, 329.63, 293.66, 392, 440, 349.23];

  function ensure() {
    if (ctx) return;
    const w = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AC = window.AudioContext ?? w.webkitAudioContext;
    if (!AC) return;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfx = ctx.createGain();
    music = ctx.createGain();
    sfx.gain.value = 0.9;
    music.gain.value = 0.55;
    master.gain.value = muted ? 0 : 1;
    sfx.connect(master);
    music.connect(master);
    master.connect(ctx.destination);
  }

  function unlock() {
    ensure();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  }

  function tone(
    freq: number,
    dur: number,
    gain: number,
    type: OscillatorType,
    when: number,
    dest: GainNode,
  ) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(when);
    osc.stop(when + dur + 0.03);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  function chime(kind: "hi" | "save" | "yay" | "hero") {
    if (!ctx || !sfx || muted) return;
    const now = ctx.currentTime + 0.01;
    const wobble = 1 + (Math.random() * 2 - 1) * 0.03;
    if (kind === "hi") {
      tone(523.25 * wobble, 0.18, 0.07, "triangle", now, sfx);
      tone(659.25, 0.22, 0.06, "triangle", now + 0.08, sfx);
      return;
    }
    if (kind === "save") {
      tone(523.25 * wobble, 0.16, 0.08, "triangle", now, sfx);
      tone(783.99, 0.22, 0.06, "sine", now + 0.06, sfx);
      return;
    }
    if (kind === "yay") {
      tone(392 * wobble, 0.14, 0.07, "triangle", now, sfx);
      tone(523.25, 0.2, 0.07, "triangle", now + 0.07, sfx);
      return;
    }
    const notes = [523.25, 659.25, 783.99, 1046.5];
    for (let i = 0; i < notes.length; i++) {
      tone(notes[i]! * wobble, 0.22, 0.07, "triangle", now + i * 0.09, sfx);
    }
  }

  function tickMusic() {
    if (!ctx || !music || muted) return;
    const t = ctx.currentTime;
    if (nextNote === 0 || nextNote < t - 0.2) nextNote = t + 0.05;
    let guard = 0;
    while (nextNote < t + 0.35 && guard < 4) {
      if (step % 8 !== 7) {
        const freq = scale[step % scale.length]!;
        tone(freq, 0.32, 0.035, "triangle", nextNote, music);
      }
      step++;
      nextNote += 0.52;
      guard++;
    }
  }

  return {
    unlock,
    resume: unlock,
    chime,
    tickMusic,
    setMuted(next: boolean) {
      muted = next;
      if (ctx && master) master.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, 0.03);
      if (!next) nextNote = 0;
    },
    close() {
      if (ctx && ctx.state !== "closed") void ctx.close();
      ctx = null;
      master = null;
      sfx = null;
      music = null;
    },
  };
}

export function mountHero(
  canvas: HTMLCanvasElement,
  hooks: { onHud: (hud: Hud) => void },
): HeroApi {
  const ctxMaybe = canvas.getContext("2d", { alpha: false });
  if (!ctxMaybe) {
    return { start() {}, toggleSound() {}, destroy() {} };
  }
  const ctx = ctxMaybe;

  const saved = loadSave();
  const audio = createAudio();
  audio.setMuted(!saved.sound);

  let mounted = true;
  let raf = 0;
  let w = 0;
  let h = 0;
  let s = 1;
  let dpr = 1;
  let time = 0;
  let acc = 0;
  let last = performance.now();
  let laidW = -1;
  let scroll = 0;
  let phase: "title" | "play" = "title";
  let themeIndex = 0;
  let filled = 0;
  let total = saved.rescues;
  let soundOn = saved.sound;
  let cheer: string | null = null;
  let cheerT = 0;
  let cheerI = 0;
  let freeze = 0;
  let trauma = 0;
  let touched = false;
  let hintTime = 0;
  let idleTime = 0;
  let hudKey = "";
  let grad: CanvasGradient | null = null;
  let gradKey = "";
  let font = "700 20px Fredoka, sans-serif";
  let fontS = -1;
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = reducedQuery.matches;

  const eric = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    tilt: 0,
    sx: 1,
    sy: 1,
    punch: 0,
  };
  const target = { x: 0, y: 0 };
  const cape: Pt[] = Array.from({ length: 5 }, () => ({ x: 0, y: 0 }));
  const keys = new Set<string>();
  const ptrs = new Map<number, Pt>();
  const bldgs: Bldg[] = [];
  const rescues: Rescue[] = Array.from({ length: 4 }, () => ({
    on: false,
    wait: 0,
    x: 0,
    y: 0,
    vx: 24,
    r: 40,
    kind: 0,
    bob: 0,
  }));
  const sparks: Spark[] = Array.from({ length: 72 }, () => ({
    on: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    max: 1,
    size: 8,
    color: 0,
  }));
  const rings: Ring[] = Array.from({ length: 6 }, () => ({
    on: false,
    x: 0,
    y: 0,
    life: 0,
    max: 0.4,
  }));
  const floats: Floater[] = Array.from({ length: 8 }, () => ({
    on: false,
    x: 0,
    y: 0,
    life: 0,
    text: "",
  }));
  const birds = [
    { x: 30, y: 50, v: 26, flap: 0 },
    { x: 140, y: 80, v: 34, flap: 1.7 },
    { x: 240, y: 40, v: 22, flap: 3.1 },
  ];
  const puffs = [
    { x: 20, y: 40, r: 26, v: 7 },
    { x: 180, y: 78, r: 34, v: 5 },
    { x: 340, y: 36, r: 22, v: 9 },
  ];
  const cloud = { x: 0, y: 0, vx: 16, ready: true, happy: 0 };
  const motes = Array.from({ length: 16 }, (_, i) => ({
    x: i * 40,
    y: 20 + ((i * 37) % 80),
    v: 10 + (i % 5) * 3,
    p: i,
  }));

  const sunGlow = makeGlow(180, "rgba(255,176,32,0.85)");
  const sparkGlows = [
    makeGlow(48, "rgba(255,176,32,0.95)"),
    makeGlow(48, "rgba(255,109,77,0.95)"),
    makeGlow(48, "rgba(255,246,228,0.95)"),
    makeGlow(48, "rgba(47,191,168,0.95)"),
  ];
  const inkDots = makeDots("rgba(28,35,64,0.45)");
  const creamDots = makeDots("rgba(255,246,228,0.7)");
  let inkPattern: CanvasPattern | null = null;
  let creamPattern: CanvasPattern | null = null;

  function theme(): Theme {
    return THEMES[themeIndex] ?? THEMES[0]!;
  }

  function heroHomeY(): number {
    return Math.max(72, Math.min(h * 0.2, 200));
  }

  function activeCount(): number {
    return w < 560 ? 3 : 4;
  }

  function visualRescue(r: Rescue): Pt {
    return {
      x: r.x,
      y: r.y + Math.sin(time * 1.5 + r.bob) * 8 * s,
    };
  }

  function bobAmount(): number {
    const sp = Math.hypot(eric.vx, eric.vy);
    const calm = phase === "title" ? 1 : 1 - Math.min(1, sp / 90);
    return Math.sin(time * 2.3) * 5 * s * calm;
  }

  function emit() {
    if (!mounted) return;
    const hint = phase === "play" && !touched && hintTime < 8;
    const key = `${phase}|${themeIndex}|${filled}|${total}|${cheer ?? ""}|${soundOn ? 1 : 0}|${hint ? 1 : 0}`;
    if (key === hudKey) return;
    hudKey = key;
    hooks.onHud({
      phase,
      skyName: theme().name,
      filled,
      goal: GOAL,
      rescues: total,
      cheer,
      sound: soundOn,
      hint,
    });
  }

  function persist() {
    try {
      const data: Save = { v: 1, rescues: total, sound: soundOn };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      /* private mode */
    }
  }

  function burst(x: number, y: number, n: number, speed: number) {
    let left = reduced ? Math.min(8, n) : n;
    for (const p of sparks) {
      if (left <= 0) break;
      if (p.on) continue;
      const a = Math.random() * Math.PI * 2;
      const sp = speed * (0.45 + Math.random() * 0.7);
      p.on = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.max = 0.4 + Math.random() * 0.35;
      p.life = p.max;
      p.size = (8 + Math.random() * 10) * s;
      p.color = Math.floor(Math.random() * 4);
      left--;
    }
  }

  function boom(x: number, y: number) {
    for (const rg of rings) {
      if (rg.on) continue;
      rg.on = true;
      rg.x = x;
      rg.y = y;
      rg.max = 0.42;
      rg.life = rg.max;
      return;
    }
  }

  function popup(x: number, y: number, text: string) {
    for (const f of floats) {
      if (f.on) continue;
      f.on = true;
      f.x = x;
      f.y = y;
      f.life = 0.9;
      f.text = text;
      return;
    }
  }

  function onSave(x: number, y: number, word: string, kind: "save" | "yay") {
    total += 1;
    filled += 1;
    eric.punch = 0.2;
    if (!reduced) trauma = Math.min(1, trauma + 0.25);
    freeze = 0.045;
    burst(x, y, 14, 150);
    boom(x, y);
    popup(x, y - 16 * s, word);
    audio.chime(kind);
    persist();
    if (filled >= GOAL) {
      filled = 0;
      themeIndex = (themeIndex + 1) % THEMES.length;
      gradKey = "";
      cheer = CHEERS[cheerI % CHEERS.length] ?? "YAY!";
      cheerI += 1;
      cheerT = 1.45;
      if (!reduced) trauma = Math.min(1, trauma + 0.4);
      burst(eric.x, eric.y, 30, 230);
      audio.chime("hero");
    }
    emit();
  }

  function spawnRescue(r: Rescue, i: number, onScreen: boolean) {
    r.on = true;
    r.wait = 0;
    r.kind = (i + themeIndex) % 4;
    r.r = Math.max(36, 40 * s);
    r.bob = (i * 1.3) % (Math.PI * 2);
    const dir = i % 2 === 0 ? 1 : -1;
    r.vx = dir * (26 + (i % 3) * 8) * (0.9 + Math.min(s, 1.4) * 0.15);
    if (onScreen) {
      r.x = w * (0.12 + (i % 4) * 0.22);
      const home = heroHomeY();
      r.y = Math.max(40, Math.min(h * 0.32, home + (i % 2 === 0 ? -26 : 30) * s));
      return;
    }
    r.x = dir > 0 ? -r.r - 30 - i * 24 : w + r.r + 30 + i * 18;
    r.y = Math.max(r.r, Math.min(h * 0.55, h * (0.12 + ((i * 17) % 40) / 100)));
  }

  function collectRescue(r: Rescue) {
    if (!r.on || phase !== "play") return;
    const p = visualRescue(r);
    r.on = false;
    r.wait = 0.95;
    onSave(p.x, p.y, "Thanks!", "save");
  }

  function saveCloud() {
    if (!cloud.ready || phase !== "play") return;
    cloud.ready = false;
    cloud.happy = 2.1;
    onSave(cloud.x, cloud.y, "Yay!", "yay");
  }

  function tapCollect(x: number, y: number) {
    if (phase !== "play") return;
    let best: Rescue | null = null;
    let bestD = Infinity;
    const n = activeCount();
    for (let i = 0; i < n; i++) {
      const r = rescues[i]!;
      if (!r.on) continue;
      const p = visualRescue(r);
      const d = Math.hypot(p.x - x, p.y - y);
      if (d <= r.r * 1.5 && d < bestD) {
        bestD = d;
        best = r;
      }
    }
    if (cloud.ready) {
      const d = Math.hypot(cloud.x - x, cloud.y - y);
      const hit = Math.max(52, 56 * s);
      if (d <= hit && d < bestD) {
        saveCloud();
        return;
      }
    }
    if (best) collectRescue(best);
  }

  function collectNearest() {
    let best: Rescue | null = null;
    let bestD = Infinity;
    const n = activeCount();
    for (let i = 0; i < n; i++) {
      const r = rescues[i]!;
      if (!r.on) continue;
      const p = visualRescue(r);
      const d = Math.hypot(p.x - eric.x, p.y - eric.y);
      if (d < bestD) {
        bestD = d;
        best = r;
      }
    }
    if (cloud.ready) {
      const d = Math.hypot(cloud.x - eric.x, cloud.y - eric.y);
      if (d < bestD) {
        saveCloud();
        return;
      }
    }
    if (best) collectRescue(best);
  }

  function layoutCity() {
    bldgs.length = 0;
    let x = 0;
    const targetW = Math.max(w, 420) + 40;
    let i = 0;
    while (x < targetW && i < 40) {
      const bw = 50 + ((i * 37) % 54);
      const bh = Math.min(h * 0.36, 90 + ((i * 53) % Math.max(50, Math.floor(h * 0.22))));
      bldgs.push({ x, w: bw, h: bh, seed: i * 1.7, i });
      x += bw + 12 + ((i * 19) % 16);
      i += 1;
    }
    laidW = w;
  }

  function placeWorld() {
    eric.x = w * 0.5;
    eric.y = heroHomeY();
    target.x = eric.x;
    target.y = eric.y;
    eric.vx = 0;
    eric.vy = 0;
    for (const p of cape) {
      p.x = eric.x;
      p.y = eric.y + 12;
    }
    for (let i = 0; i < rescues.length; i++) spawnRescue(rescues[i]!, i, true);
    cloud.x = w * 0.78;
    cloud.y = Math.max(56, heroHomeY() - 10);
    cloud.vx = 16 * Math.max(1, s * 0.8);
    cloud.ready = true;
    cloud.happy = 0;
    birds[0]!.x = w * 0.15;
    birds[1]!.x = w * 0.48;
    birds[2]!.x = w * 0.82;
    puffs[0]!.x = w * 0.1;
    puffs[1]!.x = w * 0.45;
    puffs[2]!.x = w * 0.75;
  }

  function readSize() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    if (w < 2 || h < 2) {
      w = window.innerWidth;
      h = window.innerHeight;
    }
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const bw = Math.max(1, Math.round(w * dpr));
    const bh = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      gradKey = "";
      inkPattern = null;
      creamPattern = null;
    }
    s = Math.max(0.82, Math.min(1.6, Math.min(w, h) / 500));
    for (const r of rescues) r.r = Math.max(36, 40 * s);
  }

  function fitShell() {
    const shell = canvas.parentElement;
    if (!shell) return;
    const vv = window.visualViewport;
    if (!vv) {
      shell.style.height = `${window.innerHeight}px`;
      shell.style.top = "0px";
      shell.style.bottom = "auto";
      return;
    }
    shell.style.top = `${vv.offsetTop}px`;
    shell.style.height = `${vv.height}px`;
    shell.style.bottom = "auto";
  }

  function resize() {
    fitShell();
    readSize();
    if (w < 2 || h < 2) return;
    if (Math.abs(w - laidW) > 48 || bldgs.length === 0) layoutCity();
    if (eric.x === 0 && eric.y === 0) placeWorld();
    eric.y = Math.max(30, Math.min(h - 30, eric.y));
    target.x = Math.max(20, Math.min(w - 20, target.x));
    target.y = Math.max(20, Math.min(h - 20, target.y));
  }

  function beginPlay(fromSky: boolean) {
    audio.unlock();
    if (phase === "play") return;
    phase = "play";
    touched = fromSky;
    hintTime = 0;
    idleTime = fromSky ? 0 : 1.2;
    target.x = eric.x;
    target.y = eric.y;
    audio.chime("hi");
    emit();
  }

  function canvasPos(e: PointerEvent): Pt {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function markTouched() {
    if (!touched) {
      touched = true;
      emit();
    }
    idleTime = 0;
  }

  const ac = new AbortController();
  const signal = ac.signal;
  const GAME_KEYS = new Set([
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "KeyA",
    "KeyD",
    "KeyW",
    "KeyS",
    "Space",
    "Enter",
  ]);

  function onPointerDown(e: PointerEvent) {
    if (e.cancelable) e.preventDefault();
    const pos = canvasPos(e);
    if (phase === "title") beginPlay(true);
    markTouched();
    ptrs.set(e.pointerId, pos);
    target.x = pos.x;
    target.y = pos.y;
    tapCollect(pos.x, pos.y);
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!ptrs.has(e.pointerId)) return;
    const pos = canvasPos(e);
    ptrs.set(e.pointerId, pos);
    target.x = pos.x;
    target.y = pos.y;
  }

  function onPointerUp(e: PointerEvent) {
    ptrs.delete(e.pointerId);
  }

  canvas.addEventListener("pointerdown", onPointerDown, { signal, passive: false });
  canvas.addEventListener("pointermove", onPointerMove, { signal });
  canvas.addEventListener("pointerup", onPointerUp, { signal });
  canvas.addEventListener("pointercancel", onPointerUp, { signal });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault(), { signal });

  window.addEventListener(
    "keydown",
    (e) => {
      if (!GAME_KEYS.has(e.code)) return;
      e.preventDefault();
      if (e.repeat) {
        keys.add(e.code);
        return;
      }
      keys.add(e.code);
      if ((e.code === "Space" || e.code === "Enter") && phase === "title") beginPlay(false);
      else if (e.code === "Space" && phase === "play") {
        markTouched();
        collectNearest();
      }
    },
    { signal },
  );
  window.addEventListener("keyup", (e) => keys.delete(e.code), { signal });
  window.addEventListener("blur", () => keys.clear(), { signal });
  const onResize = () => resize();
  window.addEventListener("resize", onResize, { signal });
  window.addEventListener("orientationchange", onResize, { signal });
  window.visualViewport?.addEventListener("resize", onResize, { signal });
  window.visualViewport?.addEventListener("scroll", onResize, { signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      keys.clear();
      ptrs.clear();
      last = performance.now();
      acc = 0;
      if (!document.hidden) audio.resume();
    },
    { signal },
  );
  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.cancelable) e.preventDefault();
    },
    { passive: false, signal },
  );
  document.addEventListener("gesturestart", (e) => e.preventDefault(), { signal });
  reducedQuery.addEventListener("change", () => {
    reduced = reducedQuery.matches;
  }, { signal });

  function nearestRescue(): Rescue | null {
    let best: Rescue | null = null;
    let bestD = Infinity;
    const n = activeCount();
    for (let i = 0; i < n; i++) {
      const r = rescues[i]!;
      if (!r.on) continue;
      const p = visualRescue(r);
      if (p.x < 24 || p.x > w - 24 || p.y < 20 || p.y > h - 24) continue;
      const d = Math.hypot(p.x - eric.x, p.y - eric.y);
      if (d < bestD) {
        bestD = d;
        best = r;
      }
    }
    return best;
  }

  function updateCape(dt: number) {
    const py = eric.y + bobAmount();
    cape[0]!.x = eric.x;
    cape[0]!.y = py - 4 * s;
    const wind = Math.max(-36, Math.min(36, -eric.vx * 0.05));
    for (let i = 1; i < cape.length; i++) {
      const prev = cape[i - 1]!;
      const pt = cape[i]!;
      const follow = 1 - Math.exp(-(8 - i) * dt);
      pt.x += (prev.x + wind - pt.x) * follow;
      pt.y += (prev.y + i * 6 * s - pt.y) * follow;
    }
  }

  function update(dt: number) {
    time += dt;
    if (cheerT > 0) {
      cheerT -= dt;
      if (cheerT <= 0) {
        cheer = null;
        emit();
      }
    }
    if (phase === "play" && !touched) {
      const before = hintTime < 8;
      hintTime += dt;
      if (before !== hintTime < 8) emit();
    }

    trauma = Math.max(0, trauma - dt * 1.7);
    eric.punch += (0 - eric.punch) * (1 - Math.exp(-7 * dt));
    const sp = Math.hypot(eric.vx, eric.vy);
    const stretch = 1 + Math.min(0.14, sp / 900);
    eric.sy += (stretch - eric.sy) * (1 - Math.exp(-8 * dt));
    eric.sx += (1 / stretch - eric.sx) * (1 - Math.exp(-8 * dt));
    const wantTilt = Math.max(-0.48, Math.min(0.48, eric.vx / 680));
    eric.tilt += (wantTilt - eric.tilt) * (1 - Math.exp(-8 * dt));

    for (const p of sparks) {
      if (!p.on) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 28 * dt;
      p.life -= dt;
      if (p.life <= 0) p.on = false;
    }
    for (const rg of rings) {
      if (!rg.on) continue;
      rg.life -= dt;
      if (rg.life <= 0) rg.on = false;
    }
    for (const f of floats) {
      if (!f.on) continue;
      f.y -= 32 * dt;
      f.life -= dt;
      if (f.life <= 0) f.on = false;
    }
    for (const m of motes) {
      m.y -= m.v * dt;
      m.x += Math.sin(time + m.p) * 8 * dt;
      if (m.y < -10) {
        m.y = h * 0.7;
        m.x = Math.random() * Math.max(w, 1);
      }
    }

    updateCape(dt);

    if (freeze > 0) {
      freeze -= dt;
    } else {
      let mx = 0;
      let my = 0;
      if (keys.has("ArrowLeft") || keys.has("KeyA")) mx -= 1;
      if (keys.has("ArrowRight") || keys.has("KeyD")) mx += 1;
      if (keys.has("ArrowUp") || keys.has("KeyW")) my -= 1;
      if (keys.has("ArrowDown") || keys.has("KeyS")) my += 1;
      const mag = Math.hypot(mx, my);
      const keyFly = mag > 0 && phase === "play" && ptrs.size === 0;

      if (phase === "title") {
        target.x = w * 0.5 + Math.cos(time * 0.7) * Math.min(64, w * 0.14);
        target.y = heroHomeY() + Math.sin(time * 1.05) * 12 * s;
      } else if (ptrs.size > 0) {
        idleTime = 0;
      } else if (keyFly) {
        if (!touched) {
          touched = true;
          emit();
        }
        idleTime = 0;
        const spd = 340 * Math.max(1, s);
        target.x = Math.max(28, Math.min(w - 28, target.x + (mx / mag) * spd * dt));
        target.y = Math.max(28, Math.min(h - 28, target.y + (my / mag) * spd * dt));
      } else if (phase === "play") {
        idleTime += dt;
        if (idleTime > 1.15) {
          const near = nearestRescue();
          if (near) {
            const p = visualRescue(near);
            const dx = p.x - target.x;
            const dy = p.y - target.y;
            const d = Math.hypot(dx, dy) || 1;
            const spd = 76 * Math.max(1, s * 0.85);
            target.x += (dx / d) * spd * dt;
            target.y += (dy / d) * spd * dt;
          }
        }
      }

      const prevX = eric.x;
      const prevY = eric.y;
      const follow = 1 - Math.exp(-6.2 * dt);
      eric.x += (target.x - eric.x) * follow;
      eric.y += (target.y - eric.y) * follow;
      const minX = 34;
      const maxX = Math.max(minX + 10, w - 34);
      const minY = 42;
      const maxY = Math.max(minY + 10, h - 40);
      target.x = Math.min(maxX, Math.max(minX, target.x));
      target.y = Math.min(maxY, Math.max(minY, target.y));
      eric.x = Math.min(maxX, Math.max(minX, eric.x));
      eric.y = Math.min(maxY, Math.max(minY, eric.y));
      eric.vx = (eric.x - prevX) / Math.max(dt, 0.001);
      eric.vy = (eric.y - prevY) / Math.max(dt, 0.001);

      scroll += dt * (22 + eric.vx * 0.12);
      const n = activeCount();
      for (let i = 0; i < rescues.length; i++) {
        const r = rescues[i]!;
        if (i >= n) {
          r.on = false;
          continue;
        }
        if (!r.on) {
          r.wait -= dt;
          if (r.wait <= 0) spawnRescue(r, i, false);
          continue;
        }
        r.x += r.vx * dt;
        if (r.x < -r.r - 40) r.x = w + r.r + 10;
        else if (r.x > w + r.r + 40) r.x = -r.r - 10;
        if (phase === "play") {
          const p = visualRescue(r);
          if (p.x > -10 && p.x < w + 10) {
            const hit = 26 * s + r.r * 0.62;
            if (Math.hypot(p.x - eric.x, p.y - (eric.y + bobAmount())) < hit) collectRescue(r);
          }
        }
      }

      if (!cloud.ready) {
        cloud.happy -= dt;
        cloud.x += 80 * dt;
        if (cloud.happy <= 0) {
          cloud.ready = true;
          cloud.x = -120;
          cloud.y = Math.max(50, Math.min(h * 0.4, heroHomeY() + 20));
        }
      } else {
        cloud.x += cloud.vx * dt;
        cloud.y = Math.max(48, heroHomeY() - 8) + Math.sin(time * 0.8) * 10;
        if (cloud.x > w + 140) cloud.x = -120;
        if (phase === "play") {
          const hit = Math.max(46, 48 * s);
          if (Math.hypot(cloud.x - eric.x, cloud.y - eric.y) < hit) saveCloud();
        }
      }

      for (const b of birds) {
        b.x += b.v * dt;
        if (b.x > w + 30) b.x = -30;
      }
      for (const p of puffs) {
        p.x += p.v * dt;
        if (p.x > w + 80) p.x = -80;
      }
    }

    if (phase === "play") audio.tickMusic();
  }

  function drawCloudPuff(x: number, y: number, r: number, fill: string) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.ellipse(x - r * 0.7, y + r * 0.15, r * 0.55, r * 0.42, 0, 0, Math.PI * 2);
    ctx.ellipse(x + r * 0.72, y + r * 0.12, r * 0.6, r * 0.45, 0, 0, Math.PI * 2);
    ctx.ellipse(x - r * 0.15, y - r * 0.28, r * 0.48, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBuildings(ground: number) {
    const last = bldgs[bldgs.length - 1];
    if (!last) return;
    const total = last.x + last.w + 18;
    const off = ((scroll % total) + total) % total;
    const th = theme();
    for (const shift of [0, total]) {
      for (const b of bldgs) {
        const x = Math.round(b.x - off + shift);
        if (x > w + 8 || x + b.w < -8) continue;
        const top = ground - b.h;
        ctx.fillStyle = INK;
        ctx.fillRect(x, top, b.w, b.h);
        ctx.fillStyle = "#14182e";
        ctx.fillRect(x + b.w - Math.max(6, b.w * 0.16), top, Math.max(6, b.w * 0.16), b.h);
        if (b.i % 4 === 0) {
          ctx.fillStyle = GOLD;
          ctx.fillRect(x + 8, top - 7, b.w - 16, 6);
        }
        const cols = Math.max(1, Math.floor((b.w - 12) / 16));
        const rows = Math.max(1, Math.floor((b.h - 16) / 20));
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const lit =
              Math.sin(b.seed + row * 2.2 + col * 1.7 + time * (themeIndex === 2 ? 1.4 : 0.35)) > th.lit;
            ctx.fillStyle = lit ? GOLD : "#1a2038";
            ctx.fillRect(x + 6 + col * 16, top + 8 + row * 20, 8, 11);
          }
        }
        if (b.i % 3 === 0) {
          ctx.strokeStyle = CREAM;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + b.w * 0.5, top);
          ctx.lineTo(x + b.w * 0.5, top - 16);
          ctx.stroke();
          ctx.fillStyle = CORAL;
          ctx.beginPath();
          ctx.arc(x + b.w * 0.5, top - 18, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function drawRescue(kind: number, r: number) {
    ctx.save();
    if (kind === 0) {
      starPath(ctx, r, r * 0.46);
      ctx.fillStyle = GOLD;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(-r * 0.16, 0, Math.max(1.5, r * 0.07), 0, Math.PI * 2);
      ctx.arc(r * 0.16, 0, Math.max(1.5, r * 0.07), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, r * 0.08, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else if (kind === 1) {
      ctx.translate(0, r * 0.08);
      heartPath(ctx, r * 1.15);
      ctx.fillStyle = CORAL;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,246,228,0.75)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.18, -r * 0.12, r * 0.1, r * 0.16, -0.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 2) {
      ctx.rotate(Math.sin(time * 1.4 + r) * 0.18);
      ctx.fillStyle = TEAL;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.72, 0);
      ctx.lineTo(0, r * 0.85);
      ctx.lineTo(-r * 0.72, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = CREAM;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r * 0.85);
      ctx.moveTo(-r * 0.72, 0);
      ctx.lineTo(r * 0.72, 0);
      ctx.stroke();
      ctx.strokeStyle = CORAL;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.85);
      ctx.quadraticCurveTo(r * 0.25, r * 1.15, 0, r * 1.45);
      ctx.stroke();
    } else {
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = CREAM;
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.save();
      ctx.scale(0.42, 0.42);
      starPath(ctx, r, r * 0.48);
      ctx.fillStyle = CREAM;
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawGrumpy() {
    const rad = Math.max(40, 46 * s);
    ctx.save();
    ctx.translate(cloud.x, cloud.y);
    if (cloud.happy > 0) ctx.scale(1.06, 1.06);
    drawCloudPuff(0, 0, rad * 0.72, CREAM);
    ctx.fillStyle = INK;
    const eye = cloud.happy > 0 ? 2.4 * s : 3 * s;
    ctx.beginPath();
    ctx.arc(-10 * s, -2 * s, eye, 0, Math.PI * 2);
    ctx.arc(10 * s, -2 * s, eye, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (cloud.happy > 0) ctx.arc(0, 4 * s, 8 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    else ctx.arc(0, 14 * s, 7 * s, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
    if (cloud.happy <= 0) {
      ctx.beginPath();
      ctx.moveTo(-16 * s, -12 * s);
      ctx.lineTo(-6 * s, -8 * s);
      ctx.moveTo(16 * s, -12 * s);
      ctx.lineTo(6 * s, -8 * s);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(255,109,77,0.45)";
      ctx.beginPath();
      ctx.ellipse(-16 * s, 4 * s, 4 * s, 2.4 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(16 * s, 4 * s, 4 * s, 2.4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEric() {
    const py = eric.y + bobAmount();
    const pop = 1 + eric.punch;
    ctx.save();
    ctx.translate(eric.x, py);
    ctx.rotate(eric.tilt);
    ctx.scale(eric.sx * pop, eric.sy * pop);

    ctx.fillStyle = "rgba(28,35,64,0.16)";
    ctx.beginPath();
    ctx.ellipse(0, 40 * s, 18 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    const limb = (x1: number, y1: number, x2: number, y2: number, width: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    limb(-7 * s, 16 * s, -14 * s, 34 * s, 9 * s, CREAM);
    limb(7 * s, 16 * s, 15 * s, 33 * s, 9 * s, CREAM);
    ctx.fillStyle = TEAL;
    ctx.beginPath();
    ctx.arc(-14 * s, 36 * s, 7 * s, 0, Math.PI * 2);
    ctx.arc(15 * s, 35 * s, 7 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.ellipse(0, 6 * s, 16 * s, 18 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.fillRect(-10 * s, 10 * s, 20 * s, 5 * s);

    limb(-8 * s, 0, -30 * s, -16 * s, 8 * s, CREAM);
    limb(8 * s, 0, 30 * s, -14 * s, 8 * s, CREAM);
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(-30 * s, -16 * s, 5.5 * s, 0, Math.PI * 2);
    ctx.arc(30 * s, -14 * s, 5.5 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(-4 * s, -38 * s, 5 * s, 8 * s, -0.4, 0, Math.PI * 2);
    ctx.ellipse(5 * s, -36 * s, 4 * s, 7 * s, 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(0, -22 * s, 16 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = CORAL;
    ctx.beginPath();
    ctx.ellipse(0, -22 * s, 14 * s, 6.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    const look = Math.max(-1, Math.min(1, eric.vx / 220));
    const blink = Math.sin(time * 1.7) > 0.97;
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.ellipse(-6.2 * s, -22 * s, 4 * s, blink ? 0.8 * s : 4.4 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(6.2 * s, -22 * s, 4 * s, blink ? 0.8 * s : 4.4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!blink) {
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(-6.2 * s + look * 1.5 * s, -22 * s, 2 * s, 0, Math.PI * 2);
      ctx.arc(6.2 * s + look * 1.5 * s, -22 * s, 2 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255,109,77,0.5)";
    ctx.beginPath();
    ctx.ellipse(-11 * s, -14 * s, 3.2 * s, 2 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(11 * s, -14 * s, 3.2 * s, 2 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, -14 * s, 5 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    ctx.save();
    ctx.translate(0, 2 * s);
    ctx.scale(0.34 * s, 0.34 * s);
    starPath(ctx, 22, 10);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function drawCape() {
    const n = cape.length;
    const tail = cape[n - 1];
    const mid = cape[2];
    if (!tail || !mid) return;
    const py = eric.y + bobAmount();
    const leftX = eric.x - 12 * s;
    const leftY = py - 2 * s;
    const rightX = eric.x + 6 * s;
    const rightY = py - 6 * s;
    ctx.beginPath();
    ctx.moveTo(leftX, leftY);
    ctx.quadraticCurveTo(mid.x - 18 * s, mid.y, tail.x - 6 * s, tail.y);
    ctx.quadraticCurveTo(mid.x + 10 * s, mid.y + 8 * s, rightX, rightY);
    ctx.closePath();
    ctx.fillStyle = CORAL;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(eric.x - 2 * s, py - 4 * s);
    ctx.quadraticCurveTo(mid.x, mid.y + 4 * s, tail.x, tail.y - 2 * s);
    ctx.strokeStyle = CORAL_DEEP;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sh = reduced ? 0 : trauma * trauma;
    const ox = (noise(time * 30) * 2 - 1) * 7 * sh;
    const oy = (noise(time * 30 + 5) * 2 - 1) * 5 * sh;
    ctx.translate(ox, oy);

    const th = theme();
    const key = `${themeIndex}:${Math.round(h)}`;
    if (key !== gradKey) {
      gradKey = key;
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, th.top);
      grad.addColorStop(0.55, th.mid);
      grad.addColorStop(1, th.bottom);
    }
    ctx.fillStyle = grad ?? th.top;
    ctx.fillRect(-30, -30, w + 60, h + 60);

    const skyX = w * 0.8;
    const skyY = Math.max(36, h * 0.14);
    if (themeIndex < 2) {
      ctx.drawImage(sunGlow, skyX - 90 * s, skyY - 90 * s, 180 * s, 180 * s);
      ctx.fillStyle = themeIndex === 0 ? "#ffe7a8" : GOLD;
      ctx.beginPath();
      ctx.arc(skyX, skyY, 26 * s, 0, Math.PI * 2);
      ctx.fill();
    } else if (themeIndex === 2) {
      ctx.fillStyle = CREAM;
      ctx.beginPath();
      ctx.arc(skyX, skyY, 22 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#24345e";
      ctx.beginPath();
      ctx.arc(skyX - 6 * s, skyY - 4 * s, 3 * s, 0, Math.PI * 2);
      ctx.arc(skyX + 7 * s, skyY + 2 * s, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(skyX, skyY + 4 * s, 6 * s, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ctx.lineCap = "round";
      const bands = [CORAL, GOLD, TEAL];
      for (let i = 0; i < bands.length; i++) {
        ctx.strokeStyle = bands[i]!;
        ctx.globalAlpha = 0.33;
        ctx.lineWidth = 16 * s;
        ctx.beginPath();
        const y0 = h * (0.16 + i * 0.055);
        for (let x = -10; x <= w + 10; x += 14) {
          const y = y0 + Math.sin(x * 0.012 + time * 0.45 + i) * 12;
          if (x === -10) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    if (!inkPattern) inkPattern = ctx.createPattern(inkDots, "repeat");
    if (!creamPattern) creamPattern = ctx.createPattern(creamDots, "repeat");
    const dots = themeIndex === 2 ? creamPattern : inkPattern;
    if (dots) {
      ctx.save();
      ctx.globalAlpha = themeIndex === 2 ? 0.05 : 0.07;
      ctx.fillStyle = dots;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    for (const p of puffs) {
      drawCloudPuff(p.x, Math.max(30, h * 0.12) + (p.r % 17), p.r * s, th.cloud);
    }

    const ground = h * 0.8;
    ctx.fillStyle = th.hill;
    ctx.beginPath();
    ctx.moveTo(-20, ground - 10);
    for (let x = -20; x <= w + 20; x += 16) {
      const y = ground - 18 + Math.sin(x * 0.01 + scroll * 0.01) * 14;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w + 20, h + 20);
    ctx.lineTo(-20, h + 20);
    ctx.fill();

    drawBuildings(ground);
    ctx.fillStyle = th.ground;
    ctx.fillRect(-20, ground, w + 40, h - ground + 30);

    ctx.strokeStyle = themeIndex === 2 ? CREAM : INK;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    for (const b of birds) {
      const wing = Math.sin(time * 8 + b.flap) * 5 * s;
      const by = Math.max(28, h * 0.1) + b.y * 0.15;
      ctx.beginPath();
      ctx.moveTo(b.x - 8 * s, by + wing);
      ctx.lineTo(b.x, by);
      ctx.lineTo(b.x + 8 * s, by + wing);
      ctx.stroke();
    }

    for (const m of motes) {
      ctx.globalAlpha = 0.35 + (m.p % 4) * 0.1;
      ctx.fillStyle = themeIndex === 2 ? GOLD : CREAM;
      ctx.beginPath();
      ctx.arc(m.x, m.y, themeIndex === 2 ? 2.2 : 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const n = activeCount();
    for (let i = 0; i < n; i++) {
      const r = rescues[i]!;
      if (!r.on) continue;
      const p = visualRescue(r);
      ctx.save();
      ctx.translate(p.x, p.y);
      drawRescue(r.kind, r.r);
      ctx.restore();
    }

    if (cloud.x > -160 && cloud.x < w + 160) drawGrumpy();

    if (ptrs.size > 0 && phase === "play") {
      const g = 34 * s;
      ctx.globalAlpha = 0.8;
      ctx.drawImage(sunGlow, target.x - g, target.y - g, g * 2, g * 2);
      ctx.globalAlpha = 1;
    }

    const speed = Math.hypot(eric.vx, eric.vy);
    if (!reduced && speed > 120 && phase === "play") {
      const ang = Math.atan2(eric.vy, eric.vx) + Math.PI;
      ctx.strokeStyle = CREAM;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.globalAlpha = Math.min(0.65, (speed - 120) / 500);
      for (let i = 0; i < 6; i++) {
        const a = ang + (i - 2.5) * 0.16;
        const dist = 40 * s + (i % 3) * 7;
        const len = 16 * s + Math.min(36 * s, speed * 0.04);
        const x1 = eric.x + Math.cos(a) * dist;
        const y1 = eric.y + Math.sin(a) * dist;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + Math.cos(a) * len, y1 + Math.sin(a) * len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    drawCape();
    drawEric();

    for (const p of sparks) {
      if (!p.on) continue;
      const glow = sparkGlows[p.color];
      if (!glow) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.drawImage(glow, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
    }
    ctx.globalAlpha = 1;

    ctx.lineWidth = 3;
    for (const rg of rings) {
      if (!rg.on) continue;
      const k = 1 - rg.life / rg.max;
      ctx.globalAlpha = Math.max(0, rg.life / rg.max);
      ctx.strokeStyle = CREAM;
      ctx.beginPath();
      ctx.arc(rg.x, rg.y, 8 + k * 48 * s, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (phase === "play" && !touched && hintTime < 8) {
      const near = nearestRescue();
      if (near) {
        const p = visualRescue(near);
        const pulse = 1 + Math.sin(time * 5) * 0.06;
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, near.r * pulse + 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (fontS !== s) {
      fontS = s;
      font = `700 ${Math.round(20 * Math.max(1, s))}px Fredoka, ui-rounded, sans-serif`;
    }
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    for (const f of floats) {
      if (!f.on) continue;
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.4));
      ctx.strokeStyle = CREAM;
      ctx.fillStyle = INK;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function frame(now: number) {
    if (!mounted) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden) {
      last = now;
      return;
    }
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1;
    if (w < 2 || h < 2) {
      resize();
      return;
    }
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 3) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (steps === 3) acc = 0;
    draw();
  }

  window.__hero = {
    get phase() {
      return phase;
    },
    get rescues() {
      return total;
    },
    get filled() {
      return filled;
    },
    get x() {
      return eric.x;
    },
    get y() {
      return eric.y;
    },
    get theme() {
      return theme().name;
    },
    spots() {
      const n = activeCount();
      const list: { x: number; y: number; kind: number }[] = [];
      for (let i = 0; i < n; i++) {
        const r = rescues[i]!;
        if (!r.on) continue;
        const p = visualRescue(r);
        list.push({ x: p.x, y: p.y, kind: r.kind });
      }
      return list;
    },
  };

  resize();
  emit();
  raf = requestAnimationFrame(frame);

  return {
    start() {
      beginPlay(false);
    },
    toggleSound() {
      audio.unlock();
      soundOn = !soundOn;
      audio.setMuted(!soundOn);
      persist();
      emit();
    },
    destroy() {
      mounted = false;
      cancelAnimationFrame(raf);
      ac.abort();
      audio.close();
      if (window.__hero) delete window.__hero;
    },
  };
}
