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
  const fallback = scene ? scene.querySelector('.particle-fallback') : null;
  const control = scene ? scene.querySelector('.motion-toggle') : null;
  const context = canvas ? canvas.getContext('2d') : null;
  if (!context || !fallback || !control) { if (canvas) canvas.hidden = true; return; }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: 0, y: 0, active: false };
  let particles = [], groups = [], width = 0, height = 0, size = 0, pixelRatio = 0;
  let frame = 0, lastTime = 0, visible = true, ready = false, painted = false, revealed = false;
  let paused = reducedMotion.matches;
  var heroEl = document.querySelector('.hero'); if (heroEl) heroEl.classList.toggle('motion-paused', paused);
  let releaseTimer;

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
    painted = true;
    revealWhenPainted();
  }

  // 画布真正画上内容之后才切换显示: 避免"静态图已淡出、粒子还空着"的空白窗口。
  function revealWhenPainted() {
    if (revealed || !ready || !painted) return;
    revealed = true;
    scene.classList.add('particles-ready');
    fallback.setAttribute('aria-hidden', 'true');
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
    var heroEl = document.querySelector('.hero'); if (heroEl) heroEl.classList.toggle('motion-paused', paused);
    if (paused) {
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

  // 部分移动端内核会在视口尚未稳定时给出临时尺寸（表现为图形被压扁）。
  // 连续两帧读到同一尺寸才应用，避免用不稳定的中间值绘制。
  let pendingW = 0, pendingH = 0, pendingFrames = 0, resizeAttempts = 0;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (width === rect.width && height === rect.height && pixelRatio === dpr) { resizeAttempts = 0; return; }
    if (Math.abs(rect.width - pendingW) < 0.5 && Math.abs(rect.height - pendingH) < 0.5) {
      pendingFrames += 1;
    } else {
      pendingW = rect.width; pendingH = rect.height; pendingFrames = 0;
    }
    resizeAttempts += 1;
    // 始终量不到"连续两次一致"时也采用最新读数, 避免一直画不出来。
    if (pendingFrames < 1 && resizeAttempts < 8) { setTimeout(resize, 50); return; }
    resizeAttempts = 0;
    width = rect.width; height = rect.height; pixelRatio = dpr;
    size = Math.min(width, height) * 0.85;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles.forEach(p => {
      p.homeX = width / 2 + p.u * size;
      p.homeY = height / 2 + p.v * size;
      p.x = p.homeX;
      p.y = p.homeY;
      p.vx = p.vy = 0;
    });
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

  // 图形已随页面内嵌，不再有单独的图片请求。手机上图片是分块解码的，
  // "加载完成"不等于像素可用，因此等 decode() 完成后再取样。
  function loadArtwork() {
    function decoded() {
      if (!fallback.naturalWidth || !fallback.decode) return Promise.resolve(fallback.naturalWidth ? fallback : null);
      const wait = fallback.decode().then(function () { return fallback; }, function () {
        // 部分实现会对"已解码图片"的二次 decode 抛错，此时图片本身是可用的。
        return fallback.naturalWidth ? fallback : null;
      });
      // 若某个内核的 decode() 迟迟不结束，超时后按现有图片继续（取样自检仍会兜底）。
      const guard = new Promise(function (resolve) { setTimeout(function () { resolve(fallback.naturalWidth ? fallback : null); }, 3000); });
      return Promise.race([wait, guard]);
    }
    if (fallback.complete) return decoded();
    return new Promise(resolve => {
      fallback.addEventListener('load', () => { decoded().then(resolve); }, { once: true });
      fallback.addEventListener('error', () => resolve(null), { once: true });
    });
  }

  // 图片在解码途中取样会得到残缺轮廓（表现为图形压扁或缺块）。这里对取样结果做自检：
  // 粒子数或图形跨度明显偏离基准时延后重取，直到取得完整图形或超时。
  const SAMPLE_MIN_POINTS = 4200, SAMPLE_MAX_POINTS = 14000, SAMPLE_MIN_SPAN = 0.55;
  function sampleArtworkChecked(attempt) {
    const source = document.createElement('canvas');
    source.width = source.height = 384;
    const sourceContext = source.getContext('2d', { willReadFrequently: true });
    sourceContext.drawImage(fallback, 0, 0, 384, 384);
    let points = [];
    try {
      points = sampleArtwork(sourceContext.getImageData(0, 0, 384, 384).data, 384, 384);
    } catch (error) { points = []; }
    let span = 0;
    if (points.length) {
      let minU = 1, maxU = -1, minV = 1, maxV = -1;
      for (let i = 0; i < points.length; i += 1) {
        const pt = points[i];
        if (pt.u < minU) minU = pt.u;
        if (pt.u > maxU) maxU = pt.u;
        if (pt.v < minV) minV = pt.v;
        if (pt.v > maxV) maxV = pt.v;
      }
      span = Math.max(maxU - minU, maxV - minV);
    }
    const good = points.length >= SAMPLE_MIN_POINTS && points.length <= SAMPLE_MAX_POINTS && span >= SAMPLE_MIN_SPAN;
    if (good) return Promise.resolve(points);
    // 始终取不到完整图形（图片未解码完/内核异常）时，宁可保留完整的静态图，
    // 也不采用残缺取样——后者正是"图形缺块、被压扁"的成因。
    if (attempt >= 30) return Promise.resolve([]);
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(sampleArtworkChecked(attempt + 1)); }, 120 + attempt * 40);
    });
  }

  async function initialize() {
    try {
      const artwork = await loadArtwork();
      if (!artwork || !artwork.naturalWidth) { canvas.hidden = true; return; }
      // 自检重试最多 30 轮（约 20 秒）；若始终取不到完整图形，则放弃粒子效果、
      // 保留完整的静态图，避免出现残缺或压扁的图形。
      particles = await sampleArtworkChecked(0);
      if (!particles.length) { canvas.hidden = true; return; }
      const colors = new Map();
      particles.forEach(p => {
        if (!colors.has(p.color)) colors.set(p.color, []);
        colors.get(p.color).push(p);
      });
      groups = [...colors].map(([color, points]) => ({ color, points }));
      ready = true;
      resize();
      revealWhenPainted();
      canvas.setAttribute('data-particle-count', String(particles.length));
      control.hidden = false;
      if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(scene);
      else window.addEventListener('resize', resize);
      window.addEventListener('orientationchange', resize);
      [120, 500, 1500].forEach(delay => setTimeout(resize, delay));
      syncAnimation();
    } catch (error) {
      // Keep the original illustration visible if canvas or image loading fails.
      console.warn('LexFlow: 河狸粒子初始化失败，保留静态图标。', error);
      ready = false;
      revealed = false;
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
