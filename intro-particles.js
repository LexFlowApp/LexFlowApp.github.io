// Opening sequence.
//
// 1. Particles are already drifting the moment the page paints — nothing waits
//    for fonts or images, so there is no dead pause before motion starts.
// 2. The cloud is an ellipse with a soft, slightly irregular edge, so it never
//    reads as a rectangle.
// 3. When the headline font and the beaver artwork are ready, the same
//    particles gather into the final headline + beaver mark, matching the
//    geometry of the persistent canvases so the handoff is invisible.
const INK = '#2b2721';
const WARM = '#a86e49';
const INK_TONES = ['#221d18', '#2b2721', '#3b332a'];
const WARM_TONES = ['#8f5739', '#a86e49', '#bb8460'];
const GATHER_MS = 2400;
const HOLD_MS = 500;
const FADE_MS = 500;
// The artwork only fills ~65% of its bitmap, so it must be drawn larger for the
// visible mark to span the same width the persistent canvas renders.
const ARTWORK_CONTENT_RATIO = 0.65;
const SCENE_CONTENT_SCALE = 0.85;

function toneFor(r, g, b) {
  const warm = r - g > 38;
  if (warm) return WARM_TONES[Math.min(2, Math.floor(Math.max(0, r - 100) / 60))];
  return INK_TONES[Math.min(2, Math.floor(Math.max(0, r) / 40))];
}

function groupBy(points) {
  const groups = new Map();
  for (const p of points) {
    if (!groups.has(p.color)) groups.set(p.color, []);
    groups.get(p.color).push(p);
  }
  return [...groups.values()];
}

// Sample the headline exactly where the persistent canvas draws it, so the
// handoff keeps the layout the browser produced.
function sampleHeadline(ctx, stageRect) {
  const h1 = document.querySelector('.hero h1');
  if (!h1) return [];
  const rect = h1.getBoundingClientRect();
  const styles = getComputedStyle(h1);
  const fontSize = parseFloat(styles.fontSize) || 64;
  const lineHeight = parseFloat(styles.lineHeight) || fontSize * 1.18;
  const padTop = parseFloat(styles.paddingTop) || 0;
  const spacing = styles.letterSpacing === 'normal' ? 0 : (parseFloat(styles.letterSpacing) || 0);
  ctx.font = `${styles.fontStyle} ${styles.fontWeight} ${fontSize}px ${styles.fontFamily}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`;
  ctx.textBaseline = 'alphabetic';
  const metrics = ctx.measureText('Everything');
  const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent || fontSize * 0.75;
  const descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent || fontSize * 0.22;
  const baseline = (lineHeight - (ascent + descent)) / 2 + ascent;
  const top = rect.top - stageRect.top + padTop;
  const left = rect.left - stageRect.left;
  const parts = [
    ['Everything', h1.querySelector('.headline-first'), 0, INK],
    ['is', h1.querySelector('.headline-second'), 1, INK],
    ['Workflow', h1.querySelector('.workflow-text'), 1, WARM],
    ['.', h1.querySelector('.period'), 1, WARM],
  ];
  for (const [text, element, line, color] of parts) {
    if (!element) continue;
    ctx.fillStyle = color;
    ctx.fillText(text, element.getBoundingClientRect().left - stageRect.left, top + baseline + line * lineHeight);
  }
  return left; // 供调用方确认文本确实被绘制
}

function createParticles(width, height) {
  const cx = width / 2;
  const cy = height / 2;
  // 椭圆半径留在画布内，避免粒子被边缘裁切成直边；
  // 再叠加一点随机扰动，边界就不会是规整的椭圆。
  const rx = width * 0.45;
  const ry = height * 0.42;
  // 粒子总量随首屏面积伸缩，保证大屏也够密、小屏不至于过载。
  const count = Math.max(6000, Math.min(16000, Math.round((width * height) / 55)));
  const particles = [];
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    // sqrt keeps the density even instead of crowding the middle.
    const rf = 0.18 + 0.82 * Math.sqrt(Math.random());
    const squash = 0.94 + Math.random() * 0.12;
    particles.push({
      angle,
      rf: rf * squash,
      spin: (Math.random() - 0.5) * 0.0009,
      wob: Math.random() * Math.PI * 2,
      r: 1.05 + Math.random() * 0.6,
      color: Math.random() < 0.42
        ? WARM_TONES[Math.floor(Math.random() * WARM_TONES.length)]
        : INK_TONES[Math.floor(Math.random() * INK_TONES.length)],
      tx: null,
      ty: null,
      fade: 0,
    });
  }
  return { particles, cx, cy, rx, ry };
}

function driftAt(p, cloud, now) {
  const rf = p.rf + Math.sin(now * 0.0006 + p.wob) * 0.022;
  return {
    x: cloud.cx + Math.cos(p.angle) * cloud.rx * rf + Math.sin(now * 0.0008 + p.wob) * 1.6,
    y: cloud.cy + Math.sin(p.angle) * cloud.ry * rf + Math.cos(now * 0.001 + p.wob) * 1.6,
  };
}

function mountIntro() {
  const hero = document.querySelector('.hero');
  const stage = document.querySelector('.hero-stage');
  let finish = () => {};
  window.__lexflowIntroDone = new Promise(resolve => { finish = resolve; });
  if (!hero || !stage) { document.documentElement.classList.remove('intro-pending'); finish(); return; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) { document.documentElement.classList.remove('intro-pending'); hero.classList.add('intro-done'); finish(); return; }

  const canvas = document.createElement('canvas');
  canvas.className = 'intro-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  stage.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const stageRect = stage.getBoundingClientRect();
  const width = Math.max(1, Math.round(stageRect.width));
  const height = Math.max(1, Math.round(stageRect.height));
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  canvas.dataset.phase = 'drift';

  const cloud = createParticles(width, height);
  const driftGroups = groupBy(cloud.particles);
  let groups = driftGroups;
  let targetsReady = false;
  let gatherStart = 0;
  let phase = 'drift';

  function drawDrift(now) {
    ctx.clearRect(0, 0, width, height);
    for (const list of groups) {
      ctx.fillStyle = list[0].color;
      ctx.beginPath();
      for (const p of list) {
        p.angle += p.spin * 16.67;
        const pos = driftAt(p, cloud, now);
        ctx.moveTo(pos.x + p.r, pos.y);
        ctx.arc(pos.x, pos.y, p.r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  function drawGather(now) {
    const raw = Math.min(1, (now - gatherStart) / GATHER_MS);
    const ease = 1 - Math.pow(1 - raw, 3);
    const keep = 1 - ease;
    ctx.clearRect(0, 0, width, height);
    for (const list of groups) {
      ctx.fillStyle = list[0].color;
      // 已就位的粒子先画，透明度保持 1，避免被淡出粒子的 alpha 影响。
      ctx.beginPath();
      for (const p of list) {
        if (p.tx === null) continue;
        const drift = driftAt(p, cloud, now);
        const jitter = (1 - ease) * 2.2;
        const x = drift.x + (p.tx - drift.x) * ease + Math.sin(now * 0.002 + p.wob) * jitter;
        const y = drift.y + (p.ty - drift.y) * ease + Math.cos(now * 0.0024 + p.wob) * jitter;
        ctx.moveTo(x + p.r, y);
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
      }
      ctx.fill();
      // 多余的粒子整组淡出，不会在结束时突然消失。
      if (keep > 0.02) {
        ctx.globalAlpha = keep;
        ctx.beginPath();
        for (const p of list) {
          if (p.tx !== null) continue;
          const drift = driftAt(p, cloud, now);
          ctx.moveTo(drift.x + p.r, drift.y);
          ctx.arc(drift.x, drift.y, p.r, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  function frame(now) {
    if (phase === 'drift') drawDrift(now);
    else drawGather(now);
    if (phase === 'gather' && now - gatherStart > GATHER_MS + HOLD_MS) {
      phase = 'fade';
      canvas.dataset.phase = 'fade';
      canvas.style.transition = `opacity ${FADE_MS}ms ease`;
      canvas.style.opacity = '0';
      // 淡出期间就让常驻画布接管，两者位置与尺寸一致，不会出现第二次成形。
      document.documentElement.classList.remove('intro-pending');
      hero.classList.add('intro-done');
      // 标题粒子与河狸粒子必须同时接管，否则标题会晚半拍出现。
      finish();
      setTimeout(() => { canvas.remove(); }, FADE_MS + 40);
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  async function prepareTargets() {
    try {
      await Promise.race([
        document.fonts?.load('400 100px "LexFlow Web Serif"', 'Everything is Workflow.'),
        new Promise(resolve => setTimeout(resolve, 3000)),
      ]);
    } catch { /* 用当前可用字体取样 */ }
    const sample = document.createElement('canvas');
    sample.width = width;
    sample.height = height;
    const sctx = sample.getContext('2d', { willReadFrequently: true });
    sampleHeadline(sctx, stageRect);

    const scene = document.querySelector('#beaver-scene');
    const artwork = document.querySelector('.particle-fallback');
    if (scene && artwork) {
      try { await Promise.race([artwork.decode(), new Promise(r => setTimeout(r, 4000))]); } catch {}
      if (artwork.naturalWidth) {
        const box = scene.getBoundingClientRect();
        const markSize = Math.min(box.width, box.height) * SCENE_CONTENT_SCALE;
        const drawSize = markSize / ARTWORK_CONTENT_RATIO;
        const cx = box.left - stageRect.left + box.width / 2;
        const cy = box.top - stageRect.top + box.height / 2;
        sctx.drawImage(artwork, cx - drawSize / 2, cy - drawSize / 2, drawSize, drawSize);
      }
    }

    const data = sctx.getImageData(0, 0, width, height).data;
    const targets = [];
    // 河狸区域用更疏的采样，避免开场的粒子过于拥挤。
    for (let y = 0; y < height; y += 3) {
      for (let x = 0; x < width; x += 3) {
        const o = (y * width + x) * 4;
        if (data[o + 3] < 140) continue;
        const r = data[o], g = data[o + 1], b = data[o + 2];
        if (Math.min(r, g, b) > 205 && !(r - g > 20)) continue;
        targets.push({ x, y, color: toneFor(r, g, b) });
      }
    }
    if (!targets.length) { document.documentElement.classList.remove('intro-pending'); return; }
    canvas.dataset.targetCount = String(targets.length);
    // Shuffle so the assignments are not spatially biased.
    for (let i = targets.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [targets[i], targets[j]] = [targets[j], targets[i]];
    }
    cloud.particles.forEach((p, index) => {
      const t = targets[index];
      if (!t) { p.tx = null; return; }
      p.tx = t.x;
      p.ty = t.y;
      p.color = t.color;
    });
    groups = groupBy(cloud.particles);
    targetsReady = true;
    gatherStart = performance.now();
    phase = 'gather';
    canvas.dataset.phase = 'gather';
  }

  prepareTargets();
}

if (typeof document !== 'undefined') mountIntro();
