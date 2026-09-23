// The heading keeps its layout and semantics; a canvas samples the rendered
// glyphs so the same letters can be scattered and re-gathered by the pointer.
import { advanceParticle } from './particles.js';

const INK = '#2b2721';
const WARM = '#a86e49';
const INK_HIGHLIGHT = '#96714f';
const WARM_HIGHLIGHT = '#d9a279';
const INK_TONES = ['#221d18', '#2b2721', '#3b332a'];
const WARM_TONES = ['#8f5739', '#a86e49', '#bb8460'];
const MAX_POINTS = 6200;

export function sampleGlyphs(data, width, height, step = 2, maxPoints = MAX_POINTS) {
  let samples = [];
  for (let current = Math.max(1, Math.round(step)); current <= 10; current += 1) {
    samples = [];
    for (let y = 0; y < height; y += current) {
      for (let x = 0; x < width; x += current) {
        const offset = (y * width + x) * 4;
        if (data[offset + 3] < 140) continue;
        samples.push({ x, y, color: toneFor(data[offset], data[offset + 1], data[offset + 2]) });
      }
    }
    if (samples.length <= maxPoints) return samples;
  }
  return samples;
}

// Antialiased glyph pixels vary slightly; folding them into a few tones keeps
// the canvas to a handful of fill calls instead of thousands.
export function toneFor(r, g, b) {
  const warm = r - g > 38;
  if (warm) return r < 150 ? WARM_TONES[0] : r < 186 ? WARM_TONES[1] : WARM_TONES[2];
  return r < 40 ? INK_TONES[0] : r < 58 ? INK_TONES[1] : INK_TONES[2];
}

export function titlePointerRadius(fontSize) {
  return Math.round(Math.min(78, Math.max(30, fontSize * 0.58)));
}

function groupByColor(points) {
  const groups = new Map();
  for (const point of points) {
    if (!groups.has(point.color)) groups.set(point.color, []);
    groups.get(point.color).push(point);
  }
  const warmTones = new Set(WARM_TONES);
  return [...groups].map(([color, list]) => {
    const warm = warmTones.has(color);
    return { color, highlight: warm ? WARM_HIGHLIGHT : INK_HIGHLIGHT, points: list };
  });
}

function mountTitleParticles() {
  const heading = document.querySelector('.hero h1');
  const hero = document.querySelector('.hero');
  if (!heading || !hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  let canvas, context, groups = [], particles = [];
  let width = 0, height = 0, ratio = 1, fontSize = 48;
  let frame = 0, last = 0, ready = false, revealed = false, visible = true, resizeTimer;
  let paused = hero.classList.contains('motion-paused');
  const pointer = { x: 0, y: 0, active: false, radius: 46 };

  function draw(time, step) {
    if (!context || !ready) return;
    context.clearRect(0, 0, width, height);
    const band = (paused || !revealed) ? -1 : ((time * 0.00012) % 1) * 1.7 - 0.35;
    for (const group of groups) {
      context.fillStyle = group.color;
      context.beginPath();
      for (const p of group.points) {
        if (step) advanceParticle(p, pointer, step, pointer.radius);
        const wobble = paused ? 0 : Math.sin(time * 0.0007 + p.phase) * 0.34;
        const drift = paused ? 0 : Math.cos(time * 0.0009 + p.phase) * 0.34;
        const x = p.x + wobble;
        const y = p.y + drift;
        context.moveTo(x + p.r, y);
        context.arc(x, y, p.r, 0, Math.PI * 2);
      }
      context.fill();
      if (band < 0) continue;
      // A slow highlight sweeps across the glyphs, echoing the ink's sheen.
      context.globalAlpha = 0.72;
      context.fillStyle = group.highlight;
      context.beginPath();
      for (const p of group.points) {
        if (Math.abs(p.homeX / width - band) > 0.045) continue;
        const x = p.x + (paused ? 0 : Math.sin(time * 0.0007 + p.phase) * 0.34);
        const y = p.y + (paused ? 0 : Math.cos(time * 0.0009 + p.phase) * 0.34);
        context.moveTo(x + p.r * 1.15, y);
        context.arc(x, y, p.r * 1.15, 0, Math.PI * 2);
      }
      context.fill();
      context.globalAlpha = 1;
    }
  }

  function tick(time) {
    frame = 0;
    if (!ready || paused || !visible || document.hidden) return;
    const step = Math.min((time - (last || time - 16.67)) / 16.67, 2);
    last = time;
    draw(time, step);
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (!ready || !revealed) return;
    if (paused) {
      particles.forEach(p => { p.x = p.homeX; p.y = p.homeY; p.vx = p.vy = 0; });
      draw(0, 0);
    } else if (visible && !document.hidden) {
      frame = requestAnimationFrame(tick);
    }
  }

  function build() {
    const rect = heading.getBoundingClientRect();
    if (rect.width < 60 || rect.height < 24) return false;
    const styles = getComputedStyle(heading);
    fontSize = parseFloat(styles.fontSize) || 48;
    const lineHeight = parseFloat(styles.lineHeight) || fontSize * 1.18;
    const spacing = styles.letterSpacing === 'normal' ? 0 : (parseFloat(styles.letterSpacing) || 0);
    const padTop = parseFloat(styles.paddingTop) || 0;
    const padBottom = parseFloat(styles.paddingBottom) || 0;
    const sourceWidth = Math.max(1, Math.round(rect.width));
    const sourceHeight = Math.max(1, Math.round(rect.height - padTop - padBottom));
    const source = document.createElement('canvas');
    source.width = sourceWidth;
    source.height = sourceHeight;
    const sourceContext = source.getContext('2d', { willReadFrequently: true });
    if (!sourceContext) return false;
    sourceContext.font = `${styles.fontStyle} ${styles.fontWeight} ${fontSize}px ${styles.fontFamily}`;
    if ('letterSpacing' in sourceContext) sourceContext.letterSpacing = `${spacing}px`;
    sourceContext.textBaseline = 'alphabetic';
    const metrics = sourceContext.measureText('Everything');
    const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent || fontSize * 0.75;
    const descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent || fontSize * 0.22;
    const baseline = (lineHeight - (ascent + descent)) / 2 + ascent;
    sourceContext.fillStyle = INK;
    // Draw every word at the exact spot the browser laid it out, so the paper
    // layout and the particle field never drift apart.
    const parts = [
      ['Everything', heading.querySelector('.headline-first'), 0],
      ['is', heading.querySelector('.headline-second'), 1],
      ['Workflow', heading.querySelector('.workflow-text'), 1, WARM],
      ['.', heading.querySelector('.period'), 1, WARM],
    ];
    for (const [text, element, line, color] of parts) {
      if (!element) continue;
      const box = element.getBoundingClientRect();
      sourceContext.fillStyle = color || INK;
      sourceContext.fillText(text, box.left - rect.left, baseline + line * lineHeight);
    }
    const samples = sampleGlyphs(sourceContext.getImageData(0, 0, sourceWidth, sourceHeight).data, sourceWidth, sourceHeight);
    if (samples.length < 40) return false;

    width = sourceWidth;
    height = sourceHeight;
    ratio = Math.min(devicePixelRatio || 1, 2);
    if (!canvas) return false;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.top = `${padTop}px`;
    context = canvas.getContext('2d');
    if (!context) return false;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const scale = width / sourceWidth;
    particles = samples.map(sample => {
      const homeX = sample.x * scale;
      const homeY = sample.y * scale;
      const phase = Math.random() * Math.PI * 2;
      const tones = WARM_TONES.includes(sample.color) ? WARM_TONES : INK_TONES;
      return {
        homeX, homeY, phase,
        x: homeX,
        y: homeY,
        vx: 0, vy: 0,
        r: Math.max(0.72, fontSize / 112) * (0.86 + Math.random() * 0.3),
        color: tones[Math.floor(Math.random() * tones.length)],
      };
    });
    groups = groupByColor(particles);
    pointer.radius = titlePointerRadius(fontSize);
    pointer.active = false;
    return true;
  }

  function release() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    clearTimeout(resizeTimer);
    revealed = false;
    heading.classList.remove('title-particles-ready');
    canvas?.remove();
    canvas = null;
    context = null;
    ready = false;
    groups = [];
    particles = [];
    pointer.active = false;
  }

  async function initialize() {
    if (reduced.matches) { release(); return; }
    // 标题全部是拉丁字符，只等所需的那一份字体即可，
    // 避免被体积更大的中文字体拖慢；超时后先用当前可用字体取样。
    try {
      await Promise.race([
        document.fonts?.load('400 100px "LexFlow Web Serif"', 'Everything is Workflow.'),
        new Promise(resolve => setTimeout(resolve, 4000)),
      ]);
    } catch { /* sampling still works with the fallback face */ }
    if (reduced.matches) return;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'title-particles';
      canvas.setAttribute('aria-hidden', 'true');
      heading.appendChild(canvas);
    }
    ready = build();
    if (!ready) { release(); return; }
    canvas.dataset.particleCount = String(particles.length);
    // 开场粒子层负责"从散点到成形"，这里只等它结束后接管，
    // 因此不再有第二次汇聚动画。
    const introDone = window.__lexflowIntroDone ?? Promise.resolve();
    Promise.race([introDone, new Promise(resolve => setTimeout(resolve, 9000))]).then(() => {
      if (!ready || !canvas) return;
      revealed = true;
      heading.classList.add('title-particles-ready');
      sync();
    });
  }

  function scheduleResize() {
    if (!ready) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!ready || !canvas) return;
      cancelAnimationFrame(frame);
      frame = 0;
      ready = build();
      if (ready) {
        canvas.dataset.particleCount = String(particles.length);
        sync();
      }
    }, 140);
  }

  function updatePointer(event) {
    if (!ready || paused || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  }

  heading.addEventListener('pointermove', updatePointer);
  heading.addEventListener('pointerdown', updatePointer);
  heading.addEventListener('pointerleave', () => { pointer.active = false; });
  heading.addEventListener('pointercancel', () => { pointer.active = false; });
  if (typeof ResizeObserver === 'function') new ResizeObserver(scheduleResize).observe(heading);
  else window.addEventListener('resize', scheduleResize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) pointer.active = false;
      sync();
    }).observe(heading);
  }
  new MutationObserver(() => {
    const next = hero.classList.contains('motion-paused');
    if (next === paused) return;
    paused = next;
    pointer.active = false;
    sync();
  }).observe(hero, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => {
    pointer.active = false;
    sync();
  });
  reduced.addEventListener('change', event => {
    pointer.active = false;
    if (event.matches) release();
    else initialize();
  });
  initialize();
}

if (typeof document !== 'undefined') mountTitleParticles();
