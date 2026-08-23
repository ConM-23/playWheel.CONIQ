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
//   const system = new FloatingParticleSystem(arena, { count: 10, minRadius: 12, maxRadius: 26 });
//   system.setWheelBounds({ cx: 160, cy: 160, r: 104 }); // wheel circle, arena-local coords
//   system.setCategory('planets');       // or 'ice' | 'golf' | 'soccer' | 'leaves' | 'coffee' | 'emoji3d' | 'custom' | 'none'
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

/* ---------- Ice block ---------- */
.fps-ice {
  width:100%; height:100%; border-radius:18%;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(191,229,255,0.6) 45%, rgba(110,170,215,0.5) 100%);
  box-shadow: inset 0 0 6px rgba(255,255,255,0.7), inset -4px -4px 6px rgba(70,130,180,0.35), 0 2px 4px rgba(0,0,0,0.18);
  border: 1px solid rgba(255,255,255,0.55);
  position:relative;
}
.fps-ice::before {
  content:''; position:absolute; top:18%; left:20%; width:28%; height:28%; border-radius:50%;
  background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.15) 70%, transparent 100%);
}

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
  background: radial-gradient(circle at 32% 28%, #ffffff 0%, #f2f2f2 35%, #d8d8d8 68%, #b0b0b0 100%);
  box-shadow: inset -5px -5px 9px rgba(0,0,0,0.28), inset 3px 3px 5px rgba(255,255,255,0.55), 0 2px 4px rgba(0,0,0,0.35);
}
.fps-soccer-patch {
  position:absolute; background:#1a1a1a;
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
  box-shadow: inset 0 0 2px rgba(255,255,255,0.12);
}

/* ---------- Autumn leaves ---------- */
.fps-leaf { width:100%; height:100%; position:relative; box-shadow: 1px 2px 3px rgba(0,0,0,0.3); }
.fps-leaf-maple { clip-path: polygon(50% 0%, 61% 20%, 80% 15%, 72% 35%, 95% 40%, 76% 52%, 88% 72%, 65% 66%, 60% 90%, 50% 72%, 40% 90%, 35% 66%, 12% 72%, 24% 52%, 5% 40%, 28% 35%, 20% 15%, 39% 20%); }
.fps-leaf-oak   { clip-path: polygon(50% 0%, 65% 8%, 60% 20%, 78% 22%, 68% 34%, 85% 38%, 72% 48%, 88% 54%, 70% 62%, 82% 72%, 62% 74%, 65% 92%, 50% 78%, 35% 92%, 38% 74%, 18% 72%, 30% 62%, 12% 54%, 28% 48%, 15% 38%, 32% 34%, 22% 22%, 40% 20%, 35% 8%); }
.fps-leaf-birch { clip-path: polygon(50% 0%, 66% 10%, 76% 30%, 78% 55%, 68% 78%, 50% 100%, 32% 78%, 22% 55%, 24% 30%, 34% 10%); }
.fps-leaf-vein { position:absolute; background: rgba(0,0,0,0.22); border-radius:2px; }

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
function shade(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  let r = Math.max(0, Math.min(255, (num >> 16) + percent));
  let g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + percent));
  let b = Math.max(0, Math.min(255, (num & 0x0000ff) + percent));
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}
function leafGradient(hex) {
  return `linear-gradient(160deg, ${shade(hex, 55)} 0%, ${hex} 55%, ${shade(hex, -45)} 100%)`;
}
function leafVeins() {
  return `
    <span class="fps-leaf-vein" style="left:48%; top:4%; width:4%; height:88%; transform-origin:top center; transform:rotate(1deg);"></span>
    <span class="fps-leaf-vein" style="left:50%; top:26%; width:22%; height:3%; transform-origin:left center; transform:rotate(35deg);"></span>
    <span class="fps-leaf-vein" style="left:50%; top:46%; width:20%; height:3%; transform-origin:left center; transform:rotate(32deg);"></span>
    <span class="fps-leaf-vein" style="left:28%; top:26%; width:22%; height:3%; transform-origin:right center; transform:rotate(-35deg);"></span>
    <span class="fps-leaf-vein" style="left:28%; top:46%; width:20%; height:3%; transform-origin:right center; transform:rotate(-32deg);"></span>
  `;
}
function soccerPatches() {
  return `
    <span class="fps-soccer-patch" style="width:30%;height:28%;top:36%;left:35%;transform:rotate(10deg);"></span>
    <span class="fps-soccer-patch" style="width:24%;height:22%;top:6%;left:38%;transform:rotate(0deg) scale(0.85);opacity:0.95;"></span>
    <span class="fps-soccer-patch" style="width:24%;height:22%;top:20%;left:68%;transform:rotate(70deg) scale(0.85);opacity:0.95;"></span>
    <span class="fps-soccer-patch" style="width:24%;height:22%;top:56%;left:60%;transform:rotate(140deg) scale(0.85);opacity:0.9;"></span>
    <span class="fps-soccer-patch" style="width:24%;height:22%;top:56%;left:12%;transform:rotate(-140deg) scale(0.85);opacity:0.9;"></span>
    <span class="fps-soccer-patch" style="width:24%;height:22%;top:20%;left:6%;transform:rotate(-70deg) scale(0.85);opacity:0.95;"></span>
  `;
}

// ---------- Category registry ----------
// Add a category by adding a key here with a `variants` array. Each
// variant's build(el) mutates the wrapper div into that shape. See the
// guide at the bottom of this file for a worked example.
export const CATEGORY_DEFS = {
  ice:     { label: 'Ice Blocks',    variants: [{ build(el) { el.className = 'fps-ice'; } }] },
  golf:    { label: 'Golf Balls',    variants: [{ build(el) { el.className = 'fps-golf'; } }] },
  soccer:  { label: 'Soccer Balls',  variants: [{ build(el) { el.className = 'fps-soccer'; el.innerHTML = soccerPatches(); } }] },
  leaves:  {
    label: 'Autumn Leaves',
    variants: [
      { build(el) { const c = leafColor(); el.className = 'fps-leaf fps-leaf-maple'; el.style.background = leafGradient(c); el.innerHTML = leafVeins(); } },
      { build(el) { const c = leafColor(); el.className = 'fps-leaf fps-leaf-oak';   el.style.background = leafGradient(c); el.innerHTML = leafVeins(); } },
      { build(el) { const c = leafColor(); el.className = 'fps-leaf fps-leaf-birch'; el.style.background = leafGradient(c); el.innerHTML = leafVeins(); } },
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
    this.minRadius = options.minRadius ?? 12;
    this.maxRadius = options.maxRadius ?? 26;
    this.category = null;
    this.uploadedIcons = [];
    this.particles = [];
    this._frame = null;
    this._running = false;
    this._applyWheelMask();
  }

  setWheelBounds({ cx, cy, r }) {
    this.wheel = { cx, cy, r };
    this._applyWheelMask();
  }
  setCount(n) { this.count = n; this._respawn(); }

  // Cuts a hole in the particle container exactly matching the wheel's
  // circle, so anything drawn in the container (any particle, wherever it
  // currently is) is naturally, continuously clipped as it crosses that
  // boundary — no per-frame front/behind toggling, no popping.
  _applyWheelMask() {
    const { cx, cy, r } = this.wheel;
    if (!r) {
      this.container.style.maskImage = '';
      this.container.style.webkitMaskImage = '';
      return;
    }
    const mask = `radial-gradient(circle at ${cx}px ${cy}px, rgba(0,0,0,0) ${r}px, rgba(0,0,0,1) ${r + 1}px)`;
    this.container.style.maskImage = mask;
    this.container.style.webkitMaskImage = mask;
  }

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
    const r = this.minRadius + Math.random() * (this.maxRadius - this.minRadius);
    let x, y, tries = 0;
    do {
      x = r + Math.random() * (w - r * 2);
      y = r + Math.random() * (h - r * 2);
      tries++;
    } while (Math.hypot(x - this.wheel.cx, y - this.wheel.cy) < this.wheel.r + r && tries < 40);

    const wrapper = document.createElement('div');
    wrapper.className = 'fps-particle';
    wrapper.style.width = wrapper.sty