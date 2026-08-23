// particle-system.js
//
// DOM-based floating particle system. No canvas, no WebGL, no external
// libraries. Built-in categories are pure CSS (gradients, box-shadow,
// clip-path, pseudo-elements) — no external images. Custom PNGs are
// supported as an additional category.
//
// USAGE
//   import { FloatingParticleSystem } from './particle-system.js';
//   const arena = document.getElementById('my-arena'); // position:relative, overflow:hidden
//   const system = new FloatingParticleSystem(arena, { count: 10, radius: 15 });
//   system.setWheelBounds({ cx: 160, cy: 160, r: 104 }); // keep-out circle, arena-local coords
//   system.setCategory('planets');       // or 'golf' | 'soccer' | 'leaves' | 'coffee' | 'emoji3d' | 'custom' | 'none'
//   system.setUploadedIcons([url1, url2]); // switches to 'custom' automatically
//   system.setCount(14);
//   system.applySpinForce(6);            // call when the wheel starts spinning
//   system.start();
//   system.stop();

const STYLE_ID = 'fps-injected-styles';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS_TEXT;
  document.head.appendChild(el);
}

const CSS_TEXT = `
.fps-particle { position:absolute; top:0; left:0; will-change:transform; }
.fps-particle-inner { width:100%; height:100%; position:relative; }

/* ---------- Golf ball ---------- */
.fps-golf {
  width:100%; height:100%; border-radius:50%;
  background:
    radial-gradient(circle at 35% 30%, rgba(0,0,0,0.16) 1px, transparent 1.4px) 0 0 / 7px 7px,
    radial-gradient(circle at 35% 30%, #ffffff 0%, #f2f2f2 25%, #d6d6d6 65%, #a9a9a9 100%);
  box-shadow: 0 2px 4px rgba(0,0,0,0.35);
  animation: fps-roll 3.5s linear infinite;
}
@keyframes fps-roll { from { background-position: 0 0, 0 0; } to { background-position: 42px 0, 0 0; } }

/* ---------- Soccer ball ---------- */
.fps-soccer {
  width:100%; height:100%; border-radius:50%; position:relative; overflow:hidden;
  background: radial-gradient(circle at 35% 30%, #ffffff 0%, #f0f0f0 40%, #cfcfcf 100%);
  box-shadow: 0 2px 4px rgba(0,0,0,0.35);
}
.fps-soccer::before, .fps-soccer::after {
  content:''; position:absolute; width:36%; height:36%; background:#1a1a1a;
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
}
.fps-soccer::before { top:10%; left:30%; transform:rotate(8deg); }
.fps-soccer::after  { bottom:8%; left:6%; transform:rotate(-18deg) scale(0.8); }

/* ---------- Autumn leaves ---------- */
.fps-leaf { width:100%; height:100%; box-shadow: 1px 2px 3px rgba(0,0,0,0.25); }
.fps-leaf-maple { clip-path: polygon(50% 0%, 61% 20%, 80% 15%, 72% 35%, 95% 40%, 76% 52%, 88% 72%, 65% 66%, 60% 90%, 50% 72%, 40% 90%, 35% 66%, 12% 72%, 24% 52%, 5% 40%, 28% 35%, 20% 15%, 39% 20%); }
.fps-leaf-oak   { border-radius: 40% 60% 40% 60% / 60% 40% 60% 40%; }
.fps-leaf-birch { border-radius: 0% 100% 0% 100%; }

/* ---------- Planets ---------- */
.fps-planet { width:100%; height:100%; border-radius:50%; position:relative; }
.fps-planet-mercury { background: radial-gradient(circle at 35% 30%, #cfc7bd 0%, #9c948a 55%, #6b6259 100%); }
.fps-planet-earth   { background: radial-gradient(circle at 35% 30%, #7fd0ff 0%, #2e86de 45%, #1b4d8f 100%); box-shadow: 0 0 6px 2px rgba(46,134,222,0.55); }
.fps-planet-earth::after { content:''; position:absolute; inset:15% 10% 40% 45%; border-radius:50% 60% 40% 50%; background:rgba(255,255,255,0.45); }
.fps-planet-mars    { background: radial-gradient(circle at 35% 30%, #f2a679 0%, #c1552f 50%, #7d2f16 100%); box-shadow: 0 0 5px 1px rgba(193,85,47,0.5); }
.fps-planet-jupiter { background: repeating-linear-gradient(0deg, #d9b48f 0 12%, #c99a68 12% 22%, #b9713e 22% 32%, #d9b48f 32% 44%); }
.fps-planet-neptune  { background: radial-gradient(circle at 35% 30%, #7ea8ff 0%, #3556c9 50%, #1c2f7a 100%); box-shadow: 0 0 6px 2px rgba(53,86,201,0.55); }
.fps-planet-saturn   { background: radial-gradient(circle at 35% 30%, #f3e1b3 0%, #d9bf82 55%, #a9895a 100%); }
.fps-planet-saturn::before {
  content:''; position:absolute; left:-45%; top:50%; width:190%; height:34%;
  border: 2px solid rgba(210,180,120,0.85); border-radius:50%;
  transform: translateY(-50%) rotate(-8deg); z-index:-1;
}

/* ---------- Coffee beans ---------- */
.fps-bean { width:100%; height:100%; border-radius: 50% 50% 50% 50% / 62% 62% 38% 38%; position:relative; box-shadow: 1px 2px 3px rgba(0,0,0,0.3); }
.fps-bean::before { content:''; position:absolute; top:10%; bottom:10%; left:46%; width:8%; background: rgba(0,0,0,0.35); border-radius:50%; }
.fps-bean-light  { background: radial-gradient(circle at 35% 30%, #e0b587 0%, #c68b59 55%, #9c6a3d 100%); }
.fps-bean-medium { background: radial-gradient(circle at 35% 30%, #a9744a 0%, #8b5a2b 55%, #5e3a1a 100%); }
.fps-bean-dark   { background: radial-gradient(circle at 35% 30%, #5c4632 0%, #3e2418 55%, #221209 100%); }

/* ---------- 3D emoji ---------- */
.fps-emoji-face { width:100%; height:100%; border-radius:50%; position:relative; box-shadow: inset -3px -3px 6px rgba(0,0,0,0.25), inset 2px 2px 4px rgba(255,255,255,0.5); }
.fps-emoji-yellow { background: radial-gradient(circle at 35% 30%, #ffe27a 0%, #ffcc33 55%, #e0a616 100%); }
.fps-eye { position:absolute; width:12%; height:16%; background:#2b2b2b; border-radius:50%; top:38%; }
.fps-eye-l { left:30%; } .fps-eye-r { right:30%; }
.fps-mouth-smile { position:absolute; left:30%; right:30%; top:56%; height:26%; overflow:hidden; }
.fps-mouth-smile::after { content:''; position:absolute; inset:-60% 0 0 0; border-radius:50%; background:#2b2b2b; }
.fps-mouth-laugh { position:absolute; left:28%; right:28%; top:54%; height:30%; background:#5a1f14; border-radius: 0 0 50% 50% / 0 0 70% 70%; }
.fps-mouth-laugh::before { content:''; position:absolute; left:15%; right:15%; top:8%; height:35%; background:#fff; border-radius:50%; }
.fps-eye-squint { position:absolute; width:16%; height:4%; background:#2b2b2b; border-radius:2px; top:42%; transform: rotate(-8deg); }
.fps-eye-squint.fps-eye-r { transform: rotate(8deg); }
.fps-heart-shape { position:absolute; inset:15%; transform: rotate(45deg); background: radial-gradient(circle at 35% 30%, #ff8f9e 0%, #e8455f 60%, #b8203a 100%); }
.fps-heart-shape::before, .fps-heart-shape::after { content:''; position:absolute; width:100%; height:100%; border-radius:50%; background:inherit; }
.fps-heart-shape::before { left:-50%; top:0; }
.fps-heart-shape::after  { left:0; top:-50%; }
.fps-star-shape { width:100%; height:100%; background: radial-gradient(circle at 35% 30%, #fff3b0 0%, #ffd23f 55%, #d99e00 100%); clip-path: polygon(50% 0%, 63% 35%, 100% 38%, 72% 60%, 82% 96%, 50% 76%, 18% 96%, 28% 60%, 0% 38%, 37% 35%); }
.fps-sparkle-shape { width:100%; height:100%; background: radial-gradient(circle at 40% 35%, #ffffff 0%, #cfe8ff 45%, #7fb8ff 100%); clip-path: polygon(50% 0%, 61% 40%, 100% 50%, 61% 60%, 50% 100%, 39% 60%, 0% 50%, 39% 40%); animation: fps-twinkle 1.6s ease-in-out infinite; }
@keyframes fps-twinkle { 0%,100% { opacity:0.7; transform:scale(0.85); } 50% { opacity:1; transform:scale(1.05); } }
.fps-eye-heart { position:absolute; width:16%; height:16%; top:34%; }
.fps-eye-heart .fps-heart-shape { position:absolute; inset:0; transform:rotate(45deg) scale(0.7); }

/* ---------- Custom PNG ---------- */
.fps-custom-img { width:100%; height:100%; object-fit:contain; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3)); }
`;

function faceBase(el, extra) { el.className = 'fps-emoji-face fps-emoji-yellow ' + extra; }
function leafColor() {
  const palette = ['#EAB308', '#F59E0B', '#EA580C', '#C2410C', '#B91C1C'];
  return palette[Math.floor(Math.random() * palette.length)];
}

// ---------- Category registry ----------
// Add a category by adding a key here with a `variants` array. Each
// variant's build(el) mutates the wrapper div into that shape. See the
// guide at the bottom of this file for a worked example.
export const CATEGORY_DEFS = {
  golf:    { label: 'Golf Balls',    variants: [{ build(el) { el.className = 'fps-golf'; } }] },
  soccer:  { label: 'Soccer Balls',  variants: [{ build(el) { el.className = 'fps-soccer'; } }] },
  leaves:  {
    label: 'Autumn Leaves',
    variants: [
      { build(el) { el.className = 'fps-leaf fps-leaf-maple'; el.style.background = leafColor(); } },
      { build(el) { el.className = 'fps-leaf fps-leaf-oak';   el.style.background = leafColor(); } },
      { build(el) { el.className = 'fps-leaf fps-leaf-birch'; el.style.background = leafColor(); } },
    ],
  },
  planets: {
    label: 'Planets',
    variants: [
      { build(el) { el.className = 'fps-planet fps-planet-mercury'; } },
      { build(el) { el.className = 'fps-planet fps-planet-earth'; } },
      { build(el) { el.className = 'fps-planet fps-planet-mars'; } },
      { build(el) { el.className = 'fps-planet fps-planet-jupiter'; } },
      { build(el) { el.className = 'fps-planet fps-planet-saturn'; } },
      { build(el) { el.className = 'fps-planet fps-planet-neptune'; } },
    ],
  },
  coffee: {
    label: 'Coffee Beans',
    variants: [
      { build(el) { el.className = 'fps-bean fps-bean-light'; } },
      { build(el) { el.className = 'fps-bean fps-bean-medium'; } },
      { build(el) { el.className = 'fps-bean fps-bean-dark'; } },
    ],
  },
  emoji3d: {
    label: '3D Emoji',
    variants: [
      { build(el) { faceBase(el, ''); el.innerHTML = `<span class="fps-eye fps-eye-l"></span><span class="fps-eye fps-eye-r"></span><span class="fps-mouth-smile"></span>`; } },
      { build(el) { faceBase(el, ''); el.innerHTML = `<span class="fps-eye-squint fps-eye-l"></span><span class="fps-eye-squint fps-eye-r"></span><span class="fps-mouth-laugh"></span>`; } },
      { build(el) { el.className = 'fps-sparkle-shape'; } },
      { build(el) { el.className = ''; el.innerHTML = `<span class="fps-heart-shape"></span>`; } },
      { build(el) { faceBase(el, ''); el.innerHTML = `<span class="fps-eye-heart" style="left:22%"><span class="fps-heart-shape"></span></span><span class="fps-eye-heart" style="right:22%"><span class="fps-heart-shape"></span></span><span class="fps-mouth-smile"></span>`; } },
      { build(el) { el.className = 'fps-star-shape'; } },
    ],
  },
};

// ---------- Engine ----------
export class FloatingParticleSystem {
  constructor(container, options = {}) {
    injectStyles();
    this.container = container;
    this.wheel = options.wheel || { cx: 0, cy: 0, r: 0 };
    this.friction = options.friction ?? 0.996;
    this.driftForce = options.driftForce ?? 0.01;
    this.restitution = options.restitution ?? 1;
    this.count = options.count ?? 10;
    this.radius = options.radius ?? 15;
    this.category = null;
    this.uploadedIcons = [];
    this.particles = [];
    this._frame = null;
    this._running = false;
  }

  setWheelBounds({ cx, cy, r }) { this.wheel = { cx, cy, r }; }
  setCount(n) { this.count = n; this._respawn(); }

  setCategory(name) {
    this.category = name;
    if (name !== 'custom') this.uploadedIcons = [];
    this._respawn();
  }

  setUploadedIcons(urls) {
    this.uploadedIcons = urls.slice(0, 8);
    this.category = 'custom';
    this._respawn();
  }

  // Call when the wheel starts spinning. Pushes nearby particles outward
  // + tangentially, with falloff by distance — like air displaced by a
  // spinning disc. strength is arbitrary units, tune to taste.
  applySpinForce(strength = 4) {
    const { cx, cy, r } = this.wheel;
    this.particles.forEach(p => {
      const dx = p.x - cx, dy = p.y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist, ny = dy / dist;
      const tx = -ny, ty = nx;
      const falloff = Math.max(0, 1 - dist / (r * 3));
      p.vx += (nx * 0.6 + tx * 0.8) * strength * falloff;
      p.vy += (ny * 0.6 + ty * 0.8) * strength * falloff;
    });
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._respawn();
    this._loop();
  }

  stop() {
    this._running = false;
    if (this._frame) cancelAnimationFrame(this._frame);
    this._frame = null;
  }

  _respawn() {
    this.container.innerHTML = '';
    this.particles = [];
    if (!this.category || this.category === 'none') return;
    if (this.category === 'custom' && !this.uploadedIcons.length) return;

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    for (let i = 0; i < this.count; i++) this.particles.push(this._spawnOne(w, h));
  }

  _spawnOne(w, h) {
    const r = this.radius;
    let x, y, tries = 0;
    do {
      x = r + Math.random() * (w - r * 2);
      y = r + Math.random() * (h - r * 2);
      tries++;
    } while (Math.hypot(x - this.wheel.cx, y - this.wheel.cy) < this.wheel.r + r && tries < 40);

    const wrapper = document.createElement('div');
    wrapper.className = 'fps-particle';
    wrapper.style.width = wrapper.style.height = r * 2 + 'px';
    const inner = document.createElement('div');
    inner.className = 'fps-particle-inner';
    wrapper.appendChild(inner);

    if (this.category === 'custom') {
      const img = document.createElement('img');
      img.className = 'fps-custom-img';
      img.src = this.uploadedIcons[Math.floor(Math.random() * this.uploadedIcons.length)];
      inner.appendChild(img);
    } else {
      const def = CATEGORY_DEFS[this.category];
      const variant = def.variants[Math.floor(Math.random() * def.variants.length)];
      variant.build(inner);
    }

    this.container.appendChild(wrapper);

    return {
      x, y, r,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      angle: Math.random() * 360,
      angularVelocity: (Math.random() - 0.5) * 1.2,
      flutterPhase: Math.random() * Math.PI * 2,
      el: wrapper,
    };
  }

  _loop() {
    if (!this._running) return;
    this._step();
    this._frame = requestAnimationFrame(() => this._loop());
  }

  _step() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const { cx, cy, r: wheelR } = this.wheel;

    this.particles.forEach(p => {
      p.vx += (Math.random() - 0.5) * this.driftForce;
      p.vy += (Math.random() - 0.5) * this.driftForce;
      p.vx *= this.friction;
      p.vy *= this.friction;
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.angularVelocity;
      p.angularVelocity *= 0.995;
    });

    this.particles.forEach(p => {
      if (p.x < p.r) { p.x = p.r; p.vx *= -this.restitution; }
      if (p.x > w - p.r) { p.x = w - p.r; p.vx *= -this.restitution; }
      if (p.y < p.r) { p.y = p.r; p.vy *= -this.restitution; }
      if (p.y > h - p.r) { p.y = h - p.r; p.vy *= -this.restitution; }
    });

    this.particles.forEach(p => {
      const dx = p.x - cx, dy = p.y - cy;
      const dist = Math.hypot(dx, dy);
      const minDist = wheelR + p.r;
      if (dist < minDist && dist > 0) {
        const nx = dx / dist, ny = dy / dist;
        p.x = cx + nx * minDist;
        p.y = cy + ny * minDist;
        const vn = p.vx * nx + p.vy * ny;
        p.vx -= (1 + this.restitution) * vn * nx;
        p.vy -= (1 + this.restitution) * vn * ny;
        p.angularVelocity += (p.vx * -ny + p.vy * nx) * 0.05;
      }
    });

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i], b = this.particles[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.r + b.r;
        if (dist < minDist && dist > 0) {
          const nx = dx / dist, ny = dy / dist;
          const overlap = (minDist - dist) / 2;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;
          const avn = a.vx * nx + a.vy * ny;
          const bvn = b.vx * nx + b.vy * ny;
          a.vx += (bvn - avn) * nx; a.vy += (bvn - avn) * ny;
          b.vx += (avn - bvn) * nx; b.vy += (avn - bvn) * ny;
          a.angularVelocity += (bvn - avn) * 0.08;
          b.angularVelocity += (avn - bvn) * 0.08;
        }
      }
    }

    this.particles.forEach(p => {
      const flutter = Math.sin(performance.now() / 500 + p.flutterPhase) * 4;
      p.el.style.transform = `translate(${p.x - p.r}px, ${p.y - p.r}px) rotate(${p.angle + flutter}deg)`;
    });
  }
}

// =====================================================================
// GUIDE
// =====================================================================
//
// ADDING A NEW CSS-RENDERED CATEGORY
// -----------------------------------
// 1. Add CSS to CSS_TEXT above (a `.fps-yourthing { width:100%; height:100%; ... }`
//    rule — always size to 100%/100% of the wrapper, the engine controls
//    actual pixel size via the wrapper).
// 2. Add an entry to CATEGORY_DEFS:
//      snowflake: { label: 'Snowflakes', variants: [{ build(el) { el.className = 'fps-snowflake'; } }] }
// 3. It now appears wherever you list Object.keys(CATEGORY_DEFS) in your UI.
//
// ADDING A NEW EMOJI-STYLE VARIANT (within emoji3d)
// -----------------------------------
// Push another { build(el) {...} } into CATEGORY_DEFS.emoji3d.variants.
// Reuse faceBase(el, '') for a glossy-sphere face base, or build a fresh
// shape from scratch — build(el) can set className and/or innerHTML freely.
//
// INTEGRATING PNG UPLOADS
// -----------------------------------
// You handle the actual upload (to Supabase Storage or anywhere else) —
// this module just needs the resulting public URLs:
//   system.setUploadedIcons(['https://.../a.png', 'https://.../b.png']);
// One icon -> every particle uses it. Several -> each spawn randomly picks
// one, so across many particles the split evens out naturally.
//
// ADJUSTING PHYSICS FOR DIFFERENT WHEEL BEHAVIOURS
// -----------------------------------
// Constructor options (or set directly on the instance, takes effect next frame):
//   friction      0–1, closer to 1 = less drag, particles coast longer (default 0.996)
//   driftForce    ambient random jitter added every frame (default 0.01)
//   restitution   collision bounciness, 1 = perfectly elastic, <1 = energy loss on impact (default 1)
//   radius        particle size in px (default 15)
//   count         particle count (default 10) — setCount(n) respawns immediately
// For a calmer wheel: lower driftForce (e.g. 0.003) and raise friction
// slightly won't help since 0.996 is already high — instead lower
// restitution to ~0.85 so collisions settle down over time.
// For a punchier spin reaction: raise the strength argument passed to
// applySpinForce(), or lower the r*3 falloff divisor in applySpinForce()
// so the push reaches further from the wheel.