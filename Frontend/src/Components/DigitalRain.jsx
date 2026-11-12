import { useEffect, useRef } from "react";

const DEFAULTS = {
  headColor: "#FFFFFF",
  trailColor: "#00FF2F",
  glyphSize: 10,
  speed: 6,
  angle: 0,
  density: 43,
  trail: 18,
  glyphs: "ｱｲｳｴｵｶｷｸ0123456789ABCDEFｸｿﾝ",
  shuffle: true,
  shuffleGlyphs: "ｱｲｳｴｵｶｷｸ0123456789ABCDEFｸｿﾝ",
};

const MIN_BURNOUT = 0.75;
const CROSSING_SHARE = 0.35;
const MIN_RELEASE = 0.3;
const MAX_RELEASE = 0.8;

function DigitalRain({
  headColor = DEFAULTS.headColor,
  trailColor = DEFAULTS.trailColor,
  glyphSize = DEFAULTS.glyphSize,
  speed = DEFAULTS.speed,
  angle = DEFAULTS.angle,
  density = DEFAULTS.density,
  trail = DEFAULTS.trail,
  glyphs = DEFAULTS.glyphs,
  shuffle = DEFAULTS.shuffle,
  shuffleGlyphs = DEFAULTS.shuffleGlyphs,
  style,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return undefined;

    const source = shuffle
      ? shuffleGlyphs || DEFAULTS.shuffleGlyphs
      : glyphs || DEFAULTS.glyphs;
    const availableGlyphs = [...source];
    const pick = () =>
      availableGlyphs[Math.floor(Math.random() * availableGlyphs.length)];
    const radians = (angle * Math.PI) / 180;
    const baseRate = speed * glyphSize;
    const gap = glyphSize * (1 + (50 - density) / 12);
    const tailLength = Math.max(1, Math.round(trail));

    let alive = true;
    let frameId = 0;
    let lastFrameTime = 0;
    let width = 0;
    let height = 0;
    let span = 0;
    let columnCount = 0;
    let columns = [];

    function spawn(y) {
      return {
        y,
        rate: baseRate * (0.75 + Math.random() * 0.5),
        burnout:
          Math.random() < CROSSING_SHARE
            ? Infinity
            : MIN_BURNOUT + Math.random() * (1 - MIN_BURNOUT),
        alpha: 1,
        chars: Array.from({ length: tailLength }, pick),
      };
    }

    function nextRelease() {
      return span * (MIN_RELEASE + Math.random() * (MAX_RELEASE - MIN_RELEASE));
    }

    function layout() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = wrap.clientWidth || 360;
      height = wrap.clientHeight || 320;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      span = Math.hypot(width, height);
      columnCount = Math.max(1, Math.ceil(span / gap));
      columns = Array.from({ length: columnCount }, () => ({
        streams: [spawn(Math.random() * span)],
        releaseAt: nextRelease(),
      }));
    }

    function draw(deltaTime) {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(radians);
      ctx.font = `${glyphSize}px ui-monospace, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const lead = tailLength * glyphSize;

      for (let i = 0; i < columnCount; i += 1) {
        const column = columns[i];
        const x = -span / 2 + i * gap + gap / 2;

        for (const stream of column.streams) {
          stream.y += stream.rate * deltaTime;
          if (
            stream.burnout !== Infinity &&
            stream.y / span > stream.burnout
          ) {
            stream.alpha -= deltaTime * 1.5;
          }

          if (shuffle && Math.random() < 0.25) {
            stream.chars[Math.floor(Math.random() * stream.chars.length)] =
              pick();
          }

          const headY = -span / 2 + stream.y;
          const streamAlpha = Math.max(0, Math.min(1, stream.alpha));

          for (let j = 0; j < tailLength; j += 1) {
            const y = headY - j * glyphSize;
            if (y < -span / 2 - glyphSize || y > span / 2 + glyphSize) {
              continue;
            }

            ctx.globalAlpha = streamAlpha * (j === 0 ? 1 : 1 - j / tailLength);
            ctx.fillStyle = j === 0 ? headColor : trailColor;
            ctx.fillText(stream.chars[j], x, y);
          }
        }

        column.streams = column.streams.filter(
          (stream) => stream.alpha > 0 && stream.y - lead <= span,
        );

        const newest = column.streams[column.streams.length - 1];
        if (!newest || newest.y >= column.releaseAt) {
          column.streams.push(spawn(-lead));
          column.releaseAt = nextRelease();
        }
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function loop(time) {
      if (!alive) return;
      const deltaTime = lastFrameTime
        ? Math.min((time - lastFrameTime) / 1000, 0.05)
        : 1 / 60;
      lastFrameTime = time;
      draw(deltaTime);
      frameId = requestAnimationFrame(loop);
    }

    layout();

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(layout);
      resizeObserver.observe(wrap);
    }
    frameId = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
    };
  }, [
    headColor,
    trailColor,
    glyphSize,
    speed,
    angle,
    density,
    trail,
    glyphs,
    shuffle,
    shuffleGlyphs,
  ]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        ...style,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}

export default DigitalRain;
