import { useMemo, useEffect, useRef } from 'react';

/**
 * Renders the theme's background.kind as a fixed full-bleed layer behind the scene.
 * All variants are deterministic from the theme bgProps.
 */
export default function SceneBackground({ theme }) {
  if (!theme?.bgProps) return null;
  const { bgProps } = theme;
  if (bgProps.kind === 'gradient')   return <Gradient {...bgProps} />;
  if (bgProps.kind === 'particles')  return <Particles {...bgProps} />;
  if (bgProps.kind === 'code_rain')  return <CodeRain {...bgProps} />;
  if (bgProps.kind === 'pattern')    return <Pattern {...bgProps} />;
  return <Noise {...bgProps} />;
}

const baseLayer = {
  position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
};

function Gradient({ angle, stops }) {
  const css = useMemo(() => {
    const s = stops.map((st) => `${st.color} ${(st.at * 100).toFixed(0)}%`).join(', ');
    return `linear-gradient(${angle}deg, ${s})`;
  }, [angle, stops]);
  return <div style={{ ...baseLayer, background: css }} />;
}

function Pattern({ pattern, opacity, scale, color }) {
  const dataUri = useMemo(() => {
    if (pattern === 'dots') {
      return `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='${scale}' height='${scale}'><circle cx='${scale/2}' cy='${scale/2}' r='1' fill='${color}'/></svg>`
      )}`;
    }
    if (pattern === 'grid') {
      return `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='${scale}' height='${scale}'><path d='M${scale} 0H0V${scale}' fill='none' stroke='${color}' stroke-width='0.5'/></svg>`
      )}`;
    }
    // herringbone
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='${scale*2}' height='${scale*2}'><path d='M0 ${scale}L${scale} 0M${scale} ${scale*2}L${scale*2} ${scale}' stroke='${color}' stroke-width='0.6' fill='none'/></svg>`
    )}`;
  }, [pattern, scale, color]);
  return <div style={{ ...baseLayer, backgroundImage: `url("${dataUri}")`, opacity }} />;
}

function Noise({ opacity, seed }) {
  const id = `noise-${seed}`;
  return (
    <svg style={{ ...baseLayer }} aria-hidden="true">
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.7 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} opacity={opacity} />
    </svg>
  );
}

function Particles({ count, speed, size, color }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener('resize', resize);
    const ps = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      r: (size + Math.random() * size) * devicePixelRatio,
    }));
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      ps.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [count, speed, size, color]);
  return <canvas ref={ref} style={{ ...baseLayer, width: '100%', height: '100%' }} aria-hidden="true" />;
}

function CodeRain({ density, speed, glyphs, color }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const colSize = 18;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    let cols = Math.ceil(canvas.width / colSize);
    let drops = Array(cols).fill(0).map(() => Math.random() * canvas.height);
    const tick = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      ctx.font = '14px ui-monospace, monospace';
      drops.forEach((y, i) => {
        if (Math.random() < density * 0.05) {
          const ch = glyphs[Math.floor(Math.random() * glyphs.length)];
          ctx.fillText(ch, i * colSize, y);
        }
        drops[i] = y > canvas.height ? 0 : y + speed * 14;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [density, speed, glyphs, color]);
  return <canvas ref={ref} style={{ ...baseLayer, width: '100%', height: '100%', opacity: 0.5 }} aria-hidden="true" />;
}
