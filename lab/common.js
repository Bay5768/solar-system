/* 小朋友的3D科学教室 - 共享框架:页面骨架 / 知识卡片 / 测验 / 朗读 / 贴图工具 */
(function () {
  const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const IS_MOBILE = IS_TOUCH && Math.min(innerWidth, innerHeight) < 820;

  // 页面错误可见化(便于发现兼容性问题)
  window.addEventListener('error', e => {
    let d = document.getElementById('errbadge');
    if (!d) {
      d = document.createElement('div');
      d.id = 'errbadge';
      d.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99;background:#a00;color:#fff;font-size:10px;padding:4px 8px;border-radius:6px;max-width:70vw;font-family:monospace;';
      document.body.appendChild(d);
    }
    d.textContent = '错误: ' + (e.message || '').slice(0, 120);
  });

  function init(opts) {
    document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="common.css">');
    const tagColor = {
      '数学': 'rgba(120,180,255,0.2)|rgba(150,200,255,0.5)|#a9d2ff',
      '科学': 'rgba(255,170,60,0.2)|rgba(255,190,90,0.45)|#ffd68a'
    };
    const parts = (tagColor[opts.tag] || tagColor['科学']).split('|');
    const bar = document.createElement('div');
    bar.id = 'topbar';
    bar.innerHTML =
      `<a class="backbtn" href="index.html">← 目录</a>` +
      `<span id="pageTitle" class="panel">${opts.title}</span>` +
      `<span class="tag" style="background:${parts[0]};border-color:${parts[1]};color:${parts[2]}">${opts.tag}</span>` +
      `<span class="spacer"></span>`;
    document.body.appendChild(bar);
    if (opts.hint && IS_TOUCH) opts.hint = opts.hint.replace(/拖拽|点击/g, m => m === '拖拽' ? '滑动' : '点按');
    if (opts.hint) {
      const h = document.createElement('div');
      h.style.cssText = 'position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:19;font-size:11px;color:rgba(220,230,255,0.6);letter-spacing:1px;white-space:nowrap;';
      h.textContent = opts.hint;
      document.body.appendChild(h);
    }
  }

  function speak(text) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN'; u.rate = 0.95;
      speechSynthesis.speak(u);
    } catch (e) { /* 朗读不可用时静默 */ }
  }

  function fact(items) { // items: [{t:标题, d:描述}]
    const btn = document.createElement('button');
    btn.className = 'iconbtn'; btn.textContent = '💡'; btn.title = '知识卡片';
    document.querySelector('#topbar .spacer').after(btn);
    const ov = document.createElement('div');
    ov.className = 'overlay hidden';
    ov.innerHTML = `<div class="sheet"><button class="closex">✕</button><h2>💡 知识卡片</h2>` +
      items.map(it => `<div class="fact-item"><b>${it.t}</b><p>${it.d}</p>` +
        `<button class="speakbtn" data-say="${it.d.replace(/"/g, '&quot;')}">🔊 听一听</button></div>`).join('') + `</div>`;
    document.body.appendChild(ov);
    btn.onclick = () => ov.classList.remove('hidden');
    ov.querySelector('.closex').onclick = () => { ov.classList.add('hidden'); speak(''); };
    ov.addEventListener('click', e => { if (e.target === ov) { ov.classList.add('hidden'); speak(''); } });
    ov.querySelectorAll('.speakbtn').forEach(b => b.onclick = () => speak(b.dataset.say));
  }

  function quiz(questions) { // [{q, opt:[], a:正确下标, why:解释}]
    const btn = document.createElement('button');
    btn.className = 'iconbtn'; btn.textContent = '🎯'; btn.title = '小测验';
    document.querySelector('#topbar .spacer').after(btn);
    const ov = document.createElement('div');
    ov.className = 'overlay hidden';
    document.body.appendChild(ov);
    let qi = 0, score = 0, answered = false, qTimer = null;
    function render() {
      if (qTimer) { clearTimeout(qTimer); qTimer = null; }
      answered = false;
      if (qi >= questions.length) {
        const stars = '⭐'.repeat(Math.max(1, Math.round(score / questions.length * 3)));
        ov.innerHTML = `<div class="sheet"><button class="closex">✕</button>
          <h2>🎯 测验完成</h2><div class="q-score">${score} / ${questions.length}</div>
          <p style="text-align:center;font-size:14px;margin-bottom:12px">${score === questions.length ? '太棒了,全对! ' + stars : '继续加油! ' + stars}</p>
          <button class="btn" style="width:100%" id="qAgain">再来一次</button></div>`;
        ov.querySelector('#qAgain').onclick = () => { qi = 0; score = 0; render(); };
        return;
      }
      const q = questions[qi];
      ov.innerHTML = `<div class="sheet"><button class="closex">✕</button>
        <h2>🎯 第 ${qi + 1} / ${questions.length} 题</h2><div class="q-title">${q.q}</div>` +
        q.opt.map((o, i) => `<button class="q-opt" data-i="${i}">${'ABCD'[i]}. ${o}</button>`).join('') +
        `<div class="q-explain" id="qWhy" style="display:none"></div></div>`;
      ov.querySelectorAll('.q-opt').forEach(b => b.onclick = () => {
        if (answered) return;
        answered = true;
        const i = +b.dataset.i;
        if (i === q.a) { b.classList.add('right'); score++; speak('答对了!' + (q.why || '')); }
        else {
          b.classList.add('wrong');
          ov.querySelector(`.q-opt[data-i="${q.a}"]`).classList.add('right');
          speak('正确答案是' + 'ABCD'[q.a] + '。' + (q.why || ''));
        }
        const why = ov.querySelector('#qWhy');
        why.style.display = 'block';
        why.textContent = (i === q.a ? '✅ 答对了! ' : '❌ 正确答案是 ' + 'ABCD'[q.a] + '. ') + (q.why || '');
        qTimer = setTimeout(() => { qi++; render(); }, 2200);
      });
    }
    btn.onclick = () => { qi = 0; score = 0; render(); ov.classList.remove('hidden'); };
    ov.addEventListener('click', e => {
      if (e.target === ov) { ov.classList.add('hidden'); speak(''); }
    });
  }

  // ------- Three.js 常用工具(供实验页调用) -------
  function makeFbm(seed, G) {
    let a = seed >>> 0;
    const rand = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const grid = new Float32Array(G * G);
    for (let i = 0; i < G * G; i++) grid[i] = rand();
    const sm = t => t * t * (3 - 2 * t);
    function noise(x, y) {
      x = ((x % G) + G) % G; y = ((y % G) + G) % G;
      const xi = x | 0, yi = y | 0, xf = x - xi, yf = y - yi;
      const x1 = (xi + 1) % G, y1 = (yi + 1) % G;
      const u = sm(xf), v = sm(yf);
      return grid[yi * G + xi] * (1 - u) * (1 - v) + grid[yi * G + x1] * u * (1 - v) + grid[y1 * G + xi] * (1 - u) * v + grid[y1 * G + x1] * u * v;
    }
    return (x, y, oct = 4) => { let v = 0, amp = 0.5, f = 1, tot = 0; for (let o = 0; o < oct; o++) { v += amp * noise(x * f, y * f); tot += amp; amp *= 0.5; f *= 2; } return v / tot; };
  }
  function toTexture(canvas) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = THREE.RepeatWrapping;
    return t;
  }
  function craterTexture(seed, base, dark, craters = 80) {
    const fbm = makeFbm(seed, 16);
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(512, 256), d = img.data;
    const cb = [(base >> 16) & 255, (base >> 8) & 255, base & 255], cd = [(dark >> 16) & 255, (dark >> 8) & 255, dark & 255];
    let i = 0;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 512; x++) {
      const n = fbm(x / 512 * 16, y / 256 * 8, 4);
      d[i++] = cb[0] + (cd[0] - cb[0]) * n; d[i++] = cb[1] + (cd[1] - cb[1]) * n; d[i++] = cb[2] + (cd[2] - cb[2]) * n; d[i++] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const rand = makeFbm(seed + 7, 64);
    for (let k = 0; k < craters; k++) {
      const cx = rand() * 512, cy = 16 + rand() * 224, r = 2 + rand() * rand() * 10;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.65, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
    }
    return toTexture(c);
  }
  function earthTexture() {
    const cont = makeFbm(42, 6), det = makeFbm(77, 32);
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(1024, 512), d = img.data;
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const cl = x => Math.min(1, Math.max(0, x));
    let i = 0;
    for (let y = 0; y < 512; y++) {
      const v = y / 512, lat = Math.abs(v - 0.5) * 2;
      for (let x = 0; x < 1024; x++) {
        const u = x / 1024;
        const cc = cont(u * 6, v * 3, 5), d2 = det(u * 32, v * 16, 3);
        const ice = (s => s * s * (3 - 2 * s))(cl((lat + (d2 - 0.5) * 0.12 - 0.82) / 0.11));
        let col;
        if (cc > 0.52 - (d2 - 0.5) * 0.15) {
          col = mix([63, 122, 55], [138, 125, 74], cl(lat * 0.9 + d2 * 0.4));
          col = mix(col, [240, 246, 250], ice);
          const g = 0.82 + d2 * 0.36; col = [col[0] * g, col[1] * g, col[2] * g];
        } else {
          col = mix([13, 59, 115], [30, 99, 168], cl((0.52 - cc) * 3 + d2 * 0.3));
          col = mix(col, [228, 240, 248], ice);
        }
        d[i++] = col[0]; d[i++] = col[1]; d[i++] = col[2]; d[i++] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return toTexture(c);
  }
  function softDot() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  // 标准三维场景初始化:返回 {renderer, scene, camera, controls, onResize}
  // opts.orbit 传入 OrbitControls 类(模块内引入,页面负责传递)
  function scene3d(opts = {}) {
    const container = document.getElementById('app');
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, IS_MOBILE ? 1.5 : 2));
    renderer.setSize(innerWidth, innerHeight);
    if (opts.toneMapping !== false) renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(opts.fov || 55, innerWidth / innerHeight, 0.1, opts.far || 3000);
    camera.position.set(...(opts.cam || [0, 30, 60]));
    const controls = new opts.orbit(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.07;
    if (opts.minDist) controls.minDistance = opts.minDist;
    if (opts.maxDist) controls.maxDistance = opts.maxDist;
    const onResize = [];
    addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      onResize.forEach(f => f());
    });
    return { renderer, scene, camera, controls, onResize };
  }
  function stars(scene, N = 1200) {
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    let a = 1234;
    const rand = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize().multiplyScalar(900 + rand() * 900);
      pos.set([v.x, v.y, v.z], i * 3);
      const b = 0.6 + rand() * 0.4;
      col.set([b, b * 0.92, b * (0.9 + rand() * 0.2)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({
      size: 2, map: softDot(), transparent: true, depthWrite: false, sizeAttenuation: false, vertexColors: true
    })));
  }
  // 状态提示条
  function status(text, ms = 0) {
    let d = document.getElementById('status');
    if (!d) { d = document.createElement('div'); d.id = 'status'; document.body.appendChild(d); }
    if (!text) { d.classList.add('hidden'); return; }
    d.textContent = text; d.classList.remove('hidden');
    if (ms) setTimeout(() => d.classList.add('hidden'), ms);
  }

  window.Lab = { init, fact, quiz, speak, status, scene3d, stars, makeFbm, toTexture, craterTexture, earthTexture, softDot, IS_TOUCH, IS_MOBILE };
})();
