/* Three.js r160. A GPU-animated landscape with native, scroll-linked camera motion. */
(() => {
  'use strict';
  const canvas = document.querySelector('#three-background');
  const THREE = window.THREE;
  if (!THREE || !canvas) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 680px)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch { return; }
  renderer.setClearColor(0x090f16, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, .1, 90);
  const uniforms = {
    uTime: { value: 0 }, uScroll: { value: 0 },
    uPixelRatio: { value: 1 }, uStrength: { value: 1 },
    uPointer: { value: new THREE.Vector2() }
  };
  const vertex = `
    uniform float uTime;
    uniform float uScroll;
    uniform float uPixelRatio;
    uniform vec2 uPointer;
    varying float vDepth;
    varying float vWave;
    varying float vEdge;
    void main() {
      vec3 p = position;
      float t = uTime * .24;
      float wave = sin(p.x * .42 + p.z * .22 + t) * .85;
      wave += cos(p.z * .34 - t * .7) * .65;
      wave += sin(p.x * .8 - p.z * .17 + t * .6) * .22;
      p.y += wave;
      p.y += sin(p.x * .16 + uScroll * 2.5) * .65;
      p.x += uPointer.x * .22;
      p.y += uPointer.y * .12;
      vWave = wave;
      vEdge = (1.0 - smoothstep(9.0, 16.0, abs(position.x))) *
              (1.0 - smoothstep(9.0, 18.0, abs(position.z)));
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vDepth = -mv.z;
      gl_Position = projectionMatrix * mv;
      gl_PointSize = clamp(27.0 / -mv.z, .8, 3.2) * uPixelRatio;
    }
  `;
  const color = `
    vec3 color = mix(vec3(.12,.31,.42), vec3(.40,.80,.73), smoothstep(-1.2,1.4,vWave));
    float fade = (1.0 - smoothstep(10.0,37.0,vDepth)) * vEdge * uStrength;
  `;
  const pointMaterial = new THREE.ShaderMaterial({
    uniforms, vertexShader: vertex,
    fragmentShader: `
      uniform float uStrength;
      varying float vDepth; varying float vWave; varying float vEdge;
      void main() {
        float d = length(gl_PointCoord - .5);
        if (d > .5) discard;
        ${color}
        gl_FragColor = vec4(color, (1.0 - smoothstep(.1,.5,d)) * fade * .8);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const lineMaterial = new THREE.ShaderMaterial({
    uniforms, vertexShader: vertex,
    fragmentShader: `
      uniform float uStrength;
      varying float vDepth; varying float vWave; varying float vEdge;
      void main() { ${color} gl_FragColor = vec4(color, fade * .13); }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const group = new THREE.Group();
  const geometries = [];
  const columns = compact.matches ? 100 : 180;
  const rows = compact.matches ? 70 : 100;
  const points = [], lines = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = -16 + col / (columns - 1) * 32;
      const z = -18 + row / (rows - 1) * 36;
      points.push(x, 0, z);
      if (row % 5 === 0 && col < columns - 1) lines.push(x,0,z,x + 32 / (columns - 1),0,z);
    }
  }
  function geometry(values) {
    const result = new THREE.BufferGeometry();
    result.setAttribute('position', new THREE.Float32BufferAttribute(values, 3));
    geometries.push(result);
    return result;
  }
  const field = new THREE.Points(geometry(points), pointMaterial);
  const threads = new THREE.LineSegments(geometry(lines), lineMaterial);
  // Shader displacement extends beyond the original flat geometry bounds.
  field.frustumCulled = threads.frustumCulled = false;
  group.add(field, threads);
  scene.add(group);
  let scroll = 0, targetScroll = 0, frame = 0, last = 0, elapsed = 0;
  let paused = false, lost = false;
  const pointer = new THREE.Vector2();
  const target = new THREE.Vector3();
  function readScroll() {
    const total = document.documentElement.scrollHeight - innerHeight;
    targetScroll = total > 0 ? Math.min(1, scrollY / total) : 0;
    if (reduced.matches) { scroll = targetScroll; render(0); }
  }
  function resize() {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact.matches ? 1.25 : 1.5));
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    uniforms.uPixelRatio.value = renderer.getPixelRatio();
    readScroll();
    render(0);
  }
  function render(delta) {
    const ease = reduced.matches ? 1 : 1 - Math.exp(-delta * 4);
    scroll += (targetScroll - scroll) * ease;
    uniforms.uScroll.value = scroll;
    uniforms.uTime.value = reduced.matches ? 0 : elapsed;
    uniforms.uPointer.value.lerp(pointer, Math.max(ease, .02));
    // Start below the hero text, then travel gradually through the landscape.
    camera.position.set(1.8 + scroll * 2.8, 5.2 + Math.sin(scroll * Math.PI) * 2, 13 - scroll * 4);
    target.set(0, -.1 + scroll * .8, -4 - scroll * 4);
    camera.lookAt(target);
    group.position.set(3.2 - scroll * 4, -2.5, -1);
    group.rotation.y = -.22 + scroll * .55;
    group.rotation.z = -.12 + scroll * .2;
    uniforms.uStrength.value = compact.matches ? .7 : 1;
    renderer.render(scene, camera);
  }
  function tick(now) {
    frame = requestAnimationFrame(tick);
    const dt = (now - last) / 1000;
    if (dt < 1 / 30) return;
    last = now;
    const delta = Math.min(dt, .08);
    elapsed += delta;
    render(delta);
  }
  function sync() {
    cancelAnimationFrame(frame);
    if (paused || lost || document.hidden || reduced.matches) {
      if (!lost && !paused) render(0);
      return;
    }
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', resize, { passive: true });
  addEventListener('pointermove', event => {
    if (!reduced.matches && finePointer.matches) pointer.set(event.clientX / innerWidth - .5, .5 - event.clientY / innerHeight);
  }, { passive: true });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => { scroll = targetScroll; sync(); });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true; canvas.style.opacity = '0'; sync();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false; canvas.style.opacity = ''; resize(); sync();
  });
  addEventListener('pagehide', event => {
    paused = true; sync();
    if (!event.persisted) {
      geometries.forEach(item => item.dispose());
      pointMaterial.dispose(); lineMaterial.dispose(); renderer.dispose();
    }
  });
  addEventListener('pageshow', event => { if (event.persisted) { paused = false; sync(); } });
  resize(); sync();
})();
