import { useEffect, useRef, useState } from "react";
import { Star, Volume2, VolumeX } from "lucide-react";
import { mountHero, type HeroApi, type Hud } from "@/game/engine";

const INITIAL: Hud = {
  phase: "title",
  skyName: "Sunny",
  filled: 0,
  goal: 6,
  rescues: 0,
  cheer: null,
  sound: true,
  hint: false,
};

export function SuperEric() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<HeroApi | null>(null);
  const [hud, setHud] = useState<Hud>(INITIAL);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const api = mountHero(canvas, { onHud: setHud });
    apiRef.current = api;
    return () => {
      api.destroy();
      apiRef.current = null;
    };
  }, []);

  return (
    <div className="game-root">
      <canvas ref={canvasRef} className="game-canvas" aria-hidden="true" />
      <header className="hud">
        <div className="hud-slot">
          {hud.phase === "play" ? (
            <div
              className="meter"
              aria-label={`${hud.filled} of ${hud.goal} lights in ${hud.skyName}`}
            >
              <div className="lamps">
                {Array.from({ length: hud.goal }, (_, i) => (
                  <span key={i} className={i < hud.filled ? "lamp on" : "lamp"} />
                ))}
              </div>
              <span className="sky-name">{hud.skyName}</span>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label={hud.sound ? "Turn sound off" : "Turn sound on"}
          aria-pressed={hud.sound}
          onClick={() => apiRef.current?.toggleSound()}
        >
          {hud.sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
        </button>
      </header>

      {hud.phase === "title" ? (
        <div className="title-layer">
          <div className="title-card">
            <p className="eyebrow">
              <Star className="star-ico" aria-hidden="true" />
              For Eric
            </p>
            <h1 className="hero-title">Super Eric</h1>
            <p className="lede">Tap the sky to fly. Save stars, kites, and a grumpy cloud.</p>
            {hud.rescues > 0 ? (
              <p className="stat">{hud.rescues} saves</p>
            ) : null}
            <button type="button" className="play-btn" onClick={() => apiRef.current?.start()}>
              Play
            </button>
          </div>
        </div>
      ) : null}

      {hud.hint ? <p className="hint">Hold a finger on the sky</p> : null}
      {hud.cheer ? (
        <p className="cheer" role="status">
          {hud.cheer}
        </p>
      ) : null}
    </div>
  );
}
