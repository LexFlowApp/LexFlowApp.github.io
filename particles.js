// The approved artwork is sampled directly; the silhouette is never redrawn.
export function advanceParticle(p, pointer, step, radius) {
  let tx = p.homeX;
  let ty = p.homeY;
  if (pointer.active) {
    const dx = p.homeX - pointer.x;
    const dy = p.homeY - pointer.y;
    const distance = Math.hypot(dx, dy);
    if (distance < radius) {
      const falloff = (1 - distance / radius) ** 2;
      const angle = distance > 0.001 ? Math.atan2(dy, dx) : p.phase;
      const force = radius * 0.85 * falloff;
      // A tangential component lets the dots flow around the pointer.
      tx += Math.cos(angle) * force - Math.sin(angle) * force * 0.36;
      ty += Math.sin(angle) * force + Math.cos(angle) * force * 0.36;
    }
  }
  p.vx = (p.vx + (tx - p.x) * 0.048 * step) * (0.77 ** step);
  p.vy = (p.vy + (ty - p.y) * 0.048 * step) * (0.77 ** step);
  p.x += p.vx * step;
  p.y += p.vy * step;
}

export function sampleArtwork(data, width, height) {
  const samples = [];
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const offset = (y * width + x) * 4;
      const [r, g, b, a] = data.subarray(offset, offset + 4);
      if (a < 180 || Math.min(r, g, b) > 205) continue;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      samples.push({ x, y, r, g, b });
    }
  }
  if (!samples.length) return [];
  const span = Math.max(maxX - minX, maxY - minY, 1);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return samples.map((point, index) => {
    const rawNoise = Math.sin(index * 12.9898 + 7.23) * 43758.5453;
    const noise = rawNoise - Math.floor(rawNoise);
    const hash = value => { const n = Math.sin(value) * 43758.5453; return n - Math.floor(n); };
    const phase = hash(index * 78.233 + 1.23) * Math.PI * 2;
    // Slight irregular spacing avoids the appearance of a square dot matrix.
    const u = (point.x - cx + (hash(index * 39.346 + 3.11) - 0.5) * 1.65) / span;
    const v = (point.y - cy + (hash(index * 11.135 + 9.19) - 0.5) * 1.65) / span;
    const dark = point.r < 60 && point.g < 60;
    const warm = point.r - point.g > 65;
    const tone = Math.min(4, Math.floor(point.r / 52));
    const palette = dark ? '#231c17' : warm
      ? ['#713a25', '#85442b', '#985135', '#ad6543', '#b87550'][tone]
      : ['#39251b', '#4b2e20', '#603b28', '#724a32', '#8b5c3c'][tone];
    return { u, v, phase, radius: 1.04 + noise * 0.38, color: palette, x: 0, y: 0, vx: 0, vy: 0, homeX: 0, homeY: 0 };
  });
}

function mountParticles() {
  const scene = document.querySelector('#beaver-scene');
  const canvas = document.querySelector('#beaver-canvas');
  const fallback = scene?.querySelector('.particle-fallback');
  const control = scene?.querySelector('.motion-toggle');
  const context = canvas?.getContext('2d');
  if (!context || !fallback || !control) { if (canvas) canvas.hidden = true; return; }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: 0, y: 0, active: false };
  let particles = [], groups = [], width = 0, height = 0, size = 0, pixelRatio = 0;
  let frame = 0, lastTime = 0, visible = true, ready = false;
  let paused = reducedMotion.matches;
  document.querySelector('.hero')?.classList.toggle('motion-paused', paused);
  let releaseTimer;
  let intro = 0;

  function draw(time, step = 0) {
    context.clearRect(0, 0, width, height);
    const radius = Math.min(100, Math.max(48, size * 0.23));
    for (const group of groups) {
      context.fillStyle = group.color;
      context.beginPath();
      for (const p of group.points) {
        if (step) advanceParticle(p, pointer, step, radius);
        const breathe = paused ? 0 : Math.sin(time * 0.00065 + p.phase) * 0.36;
        const r = p.radius * Math.max(0.85, size / 350);
        const x = p.x + breathe;
        const y = p.y + (paused ? 0 : Math.cos(time * 0.0008 + p.phase) * 0.36);
        context.moveTo(x + r, y);
        context.arc(x, y, r, 0, Math.PI * 2);
      }
      context.fill();
    }
  }

  function tick(time) {
    frame = 0;
    if (!ready || paused || !visible || document.hidden) return;
    const step = Math.min((time - (lastTime || time - 16.67)) / 16.67, 2);
    lastTime = time;
    draw(time, step);
    frame = requestAnimationFrame(tick);
  }

  function syncAnimation() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    if (!ready) return;
    document.querySelector('.hero')?.classList.toggle('motion-paused', paused);
    if (paused) {
      document.querySelector('.hero')?.classList.add('has-paused-motion');
      particles.forEach(p => { p.x = p.homeX; p.y = p.homeY; p.vx = p.vy = 0; });
      draw(0);
    } else if (visible && !document.hidden) {
      frame = requestAnimationFrame(tick);
    }
    control.setAttribute('aria-label', paused ? '播放首页动效' : '暂停首页动效');
    control.setAttribute('aria-pressed', String(paused));
    control.innerHTML = paused
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 10 7-10 7Z"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>';
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (width === rect.width && height === rect.height && pixelRatio === dpr) return;
    width = rect.width; height = rect.height; pixelRatio = dpr;
    size = Math.min(width, height) * 0.85;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles.forEach(p => {
      p.homeX = width / 2 + p.u * size;
      p.homeY = height / 2 + p.v * size;
      p.x = p.homeX + (intro ? Math.cos(p.phase) * size * 0.07 : 0);
      p.y = p.homeY + (intro ? Math.sin(p.phase) * size * 0.07 : 0);
      p.vx = p.vy = 0;
    });
    intro = 0;
    pointer.active = false;
    draw(0);
  }

  function updatePointer(event) {
    if (paused) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  }
  canvas.addEventListener('pointermove', updatePointer);
  canvas.addEventListener('pointerdown', updatePointer);
  canvas.addEventListener('pointerleave', () => { pointer.active = false; });
  canvas.addEventListener('pointercancel', () => { pointer.active = false; });
  canvas.addEventListener('pointerup', event => {
    if (event.pointerType !== 'mouse') pointer.active = false;
  });
  canvas.addEventListener('blur', () => { pointer.active = false; });
  canvas.addEventListener('keydown', event => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (paused) return;
    clearTimeout(releaseTimer);
    pointer.x = width / 2;
    pointer.y = height / 2;
    pointer.active = true;
    releaseTimer = setTimeout(() => { pointer.active = false; }, 600);
  });
  control.addEventListener('click', () => {
    paused = !paused;
    pointer.active = false;
    syncAnimation();
  });
  reducedMotion.addEventListener('change', event => {
    paused = event.matches;
    pointer.active = false;
    syncAnimation();
  });
  document.addEventListener('visibilitychange', () => {
    pointer.active = false;
    syncAnimation();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) pointer.active = false;
      syncAnimation();
    }).observe(scene);
  }

  async function initialize() {
    try {
      // decode() 会一直等到图片加载完成；网络较慢时不能让粒子无限期空白，
      // 因此加一个超时兜底，超时后按图片当时的可用状态继续取样。
      await Promise.race([
        fallback.decode().catch(() => {}),
        new Promise(resolve => setTimeout(resolve, 6000)),
      ]);
      if (!fallback.naturalWidth) {
        await new Promise(resolve => {
          if (fallback.complete && fallback.naturalWidth) { resolve(); return; }
          fallback.addEventListener('load', resolve, { once: true });
          fallback.addEventListener('error', resolve, { once: true });
          setTimeout(resolve, 15000);
        });
      }
      const source = document.createElement('canvas');
      source.width = source.height = 384;
      const sourceContext = source.getContext('2d', { willReadFrequently: true });
      sourceContext.drawImage(fallback, 0, 0, 384, 384);
      particles = sampleArtwork(sourceContext.getImageData(0, 0, 384, 384).data, 384, 384);
      if (!particles.length) { canvas.hidden = true; return; }
      const colors = new Map();
      particles.forEach(p => {
        if (!colors.has(p.color)) colors.set(p.color, []);
        colors.get(p.color).push(p);
      });
      groups = [...colors].map(([color, points]) => ({ color, points }));
      intro = reducedMotion.matches ? 0 : 1;
      ready = true;
      resize();
      scene.classList.add('particles-ready');
      fallback.setAttribute('aria-hidden', 'true');
      canvas.setAttribute('data-particle-count', String(particles.length));
      control.hidden = false;
      if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(scene);
      else window.addEventListener('resize', resize);
      syncAnimation();
    } catch (error) {
      // Keep the original illustration visible if canvas or image loading fails.
      console.warn('LexFlow: 河狸粒子初始化失败，保留静态图标。', error);
      ready = false;
      cancelAnimationFrame(frame);
      scene.classList.remove('particles-ready');
      fallback.removeAttribute('aria-hidden');
      control.hidden = true;
      canvas.hidden = true;
    }
  }
  initialize();
}

if (typeof document !== 'undefined') mountParticles();
