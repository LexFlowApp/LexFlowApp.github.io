// Opening sequence: a calm drift of particles across the whole hero,
// which then gathers into the headline glyphs and the beaver mark.
const INK = '#2b2721';
const WARM = '#a86e49';
const INK_TONES = ['#221d18', '#2b2721', '#3b332a'];
const WARM_TONES = ['#8f5739', '#a86e49', '#bb8460'];
const DRIFT_MS = 900;
const GATHER_MS = 2300;
const HOLD_MS = 350;
const FADE_MS = 450;

function toneFor(r, g, b) {
  const warm = r - g > 38;
  if (warm) return WARM_TONES[Math.min(2, Math.floor((r - 100) / 60))];
  return INK_TONES[Math.min(2, Math.floor(r / 40))];
}

function sampleHeadline(ctx, width, height) {
  const h1 = document.querySelector('.hero h1');
  if (!h1) return [];
  const styles = getComputedStyle(h1);
  const fontSize = parseFloat(styles.fontSize) || 64;
  ctx.fillStyle = INK;
  ctx.textBaseline = 'top';
  const rect = h1.getBoundingClientRect();
  const stage = document.querySelector('.hero-stage').getBoundingClientRect();
  const x = rect.left - stage.left;
  const y = rect.top - stage.top + 8;
  ctx.font = `${styles.fontWeight} ${fontSize}px ${styles.fontFamily}`;
  const lineH = fontSize * 1.18;
  ctx.fillText('Everything', x, y);
  ctx.fillText('is', x, y + lineH);
  const warm = WARM;
  ctx.fillStyle = warm;
  const isW = ctx.measureText('is ').width;
  ctx.fillText('Workflow.', x + isW, y + lineH);
  const data = ctx.getImageData(0, 0, width, height).data;
  const points = [];
  for (let py = 0; py < height; py += 3) {
    for (let px = 0; px < width; px += 3) {
      const o = (py * width + px) * 4;
      if (data[o + 3] < 140) continue;
      points.push({ x: px, y: py, color: toneFor(data[o], data[o + 1], data[o + 2]) });
    }
  }
  return points;
}

async function sampleBeaver(ctx, width, height) {
  const img = document.querySelector('.particle-fallback');
  if (!img) return [];
  try { await img.decode(); } catch { /* 使用当前可用状态 */ }
  if (!img.naturalWidth) return [];
  const rect = document.querySelector('#beaver-scene').getBoundingClientRect();
  const stage = document.querySelector('.hero-stage').getBoundingClientRect();
  const size = Math.min(rect.width, rect.height) * 0.86;
  const cx = rect.left - stage.left + rect.width / 2;
  const cy = rect.top - stage.top + rect.height / 2;
  ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
  const data = ctx.getImageData(0, 0, width, height).data;
  const points = [];
  for (let py = 0; py < height; py += 3) {
    for (let px = 0; px < width; px += 3) {
      const o = (py * width + px) * 4;
      const [r, g, b, a] = [data[o], data[o + 1], data[o + 2], data[o + 3]];
      if (a < 180 || Math.min(r, g, b) > 205) continue;
      points.push({ x: px, y: py, color: toneFor(r, g, b) });
    }
  }
  return points;
}

function mountIntro() {
  const stage = document.querySelector('.hero-stage');
  const hero = document.querySelector('.hero');
  if (!stage || !hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) { hero.classList.add('intro-done'); return; }

  const canvas = document.createElement('canvas');
  canvas.className = 'intro-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  stage.appendChild(canvas);
  hero.classList.add('intro-active');
  const context = canvas.getContext('2d');

  async function start() {
    try { await Promise.race([document.fonts?.ready, new Promise(r => setTimeout(r, 2500))]); } catch {}
    const rect = stage.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const sample = document.createElement('canvas');
    sample.width = width; sample.height = height;
    const sctx = sample.getContext('2d', { willReadFrequently: true });
    const targets = [...sampleHeadline(sctx, width, height), ...(await sampleBeaver(sctx, width, height))];
    if (!targets.length) { hero.classList.add('intro-done'); hero.classList.remove('intro-active'); canvas.remove(); return; }

    const particles = targets.map(t => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * (Math.max(width, height) * 0.42);
      return {
        tx: t.x, ty: t.y, color: t.color,
        x: t.x + Math.cos(angle) * dist,
        y: t.y + Math.sin(angle) * dist,
        dx: (Math.random() - 0.5) * 0.35,
        dy: (Math.random() - 0.5) * 0.35,
        wobble: Math.random() * Math.PI * 2,
        r: 1.0 + Math.random() * 0.5,
      };
    });

    const groups = new Map();
    for (const p of particles) {
      if (!groups.has(p.color)) groups.set(p.color, []);
      groups.get(p.color).push(p);
    }

    const start = performance.now();
    let fading = false;
    function frame(now) {
      const t = now - start;
      context.clearRect(0, 0, width, height);
      // 阶段：0–900ms 漂浮；900–3200ms 汇聚；随后停留并淡出
      const gather = t < DRIFT_MS ? 0 : Math.min(1, (t - DRIFT_MS) / GATHER_MS);
      const ease = 1 - Math.pow(1 - gather, 3);
      if (!fading && t > DRIFT_MS + GATHER_MS + HOLD_MS) {
        fading = true;
        canvas.style.transition = `opacity ${FADE_MS}ms ease`;
        canvas.style.opacity = '0';
        hero.classList.add('intro-done');
        setTimeout(() => { hero.classList.remove('intro-active'); canvas.remove(); }, FADE_MS + 60);
      }
      for (const [color, list] of groups) {
        context.fillStyle = color;
        context.beginPath();
        for (const p of list) {
          const still = 1 - ease;
          const x = p.tx + (p.x - p.tx) * still + (1 - ease) * p.dx * 8 + Math.sin(now * 0.001 + p.wobble) * still * 1.4;
          const y = p.ty + (p.y - p.ty) * still + (1 - ease) * p.dy * 8 + Math.cos(now * 0.0012 + p.wobble) * still * 1.4;
          context.moveTo(x + p.r, y);
          context.arc(x, y, p.r, 0, Math.PI * 2);
        }
        context.fill();
      }
      if (!fading) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  start();
}

if (typeof document !== 'undefined') mountIntro();
