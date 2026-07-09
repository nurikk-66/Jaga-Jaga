// ════════════════════════════════════════════════════════════
// JAGA-JAGA! — 3D sky diorama (Three.js)
// A low-poly KL-ish skyline under a living sky that mirrors
// the real MET Malaysia forecast: clear / cloudy / rain / storm / haze.
// ════════════════════════════════════════════════════════════
import * as THREE from "three";

const PALETTES = {
  clear_day:   { sky: 0x2b6cb8, fog: 0x6fa8dc, sun: 0xffd23d, ambient: 0.9 },
  clear_night: { sky: 0x0e1b2c, fog: 0x14243c, sun: 0xf5efe0, ambient: 0.45 },
  cloudy_day:  { sky: 0x5f7ea0, fog: 0x8ca3bd, sun: 0xf0e6c8, ambient: 0.75 },
  cloudy_night:{ sky: 0x101d30, fog: 0x1a2c46, sun: 0xd8d2be, ambient: 0.4 },
  rain_day:    { sky: 0x3d5470, fog: 0x5b7390, sun: 0xdcd6c2, ambient: 0.6 },
  rain_night:  { sky: 0x0b1524, fog: 0x14243a, sun: 0xc9c3b0, ambient: 0.35 },
  storm_day:   { sky: 0x2a3648, fog: 0x455468, sun: 0xcac4b1, ambient: 0.5 },
  storm_night: { sky: 0x080f1a, fog: 0x101c2c, sun: 0xb8b2a0, ambient: 0.3 },
  haze_day:    { sky: 0xb08a5a, fog: 0xc7a06a, sun: 0xffb347, ambient: 0.8 },
  haze_night:  { sky: 0x2a2118, fog: 0x3d2f20, sun: 0xd89a55, ambient: 0.4 },
};

export function createSkyDiorama(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);
  camera.position.set(0, 7, 34);
  camera.lookAt(0, 6, 0);

  // ── lights ──
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xfff3d6, 1.1);
  keyLight.position.set(-14, 24, 18);
  scene.add(keyLight);
  const flash = new THREE.PointLight(0xbfd8ff, 0, 300); // lightning
  flash.position.set(0, 40, -10);
  scene.add(flash);

  // ── ground ──
  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(60, 60, 2, 32),
    new THREE.MeshLambertMaterial({ color: 0x14273f })
  );
  ground.position.y = -1;
  scene.add(ground);

  // ── skyline (low-poly city, twin towers nod) ──
  const city = new THREE.Group();
  const buildingMat = new THREE.MeshLambertMaterial({ color: 0x1f3a5e });
  const buildingMat2 = new THREE.MeshLambertMaterial({ color: 0x27476f });
  const windowMat = new THREE.MeshBasicMaterial({ color: 0xffc53d });
  const layout = [
    { x: -20, w: 4, h: 7 },  { x: -15, w: 3.2, h: 10 }, { x: -10.5, w: 3.6, h: 6 },
    { x: 12, w: 3.4, h: 9 }, { x: 16.5, w: 4, h: 6.5 }, { x: 21, w: 3, h: 11 },
    { x: -25, w: 3, h: 5 },  { x: 25.5, w: 3.4, h: 7.5 },
  ];
  layout.forEach((b, i) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(b.w, b.h, b.w),
      i % 2 ? buildingMat : buildingMat2
    );
    mesh.position.set(b.x, b.h / 2, -6 - (i % 3) * 3);
    city.add(mesh);
    // lit windows
    for (let wY = 1.2; wY < b.h - 0.6; wY += 1.6) {
      if (Math.random() < 0.55) continue;
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), windowMat);
      win.position.set(
        b.x + (Math.random() - 0.5) * (b.w - 0.9),
        wY,
        mesh.position.z + b.w / 2 + 0.02
      );
      city.add(win);
    }
  });
  // twin towers
  [-2.8, 2.8].forEach((x) => {
    const tower = new THREE.Group();
    let r = 1.7;
    for (let s = 0; s < 5; s++) {
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.82, r, 3.4, 8),
        new THREE.MeshLambertMaterial({ color: 0x9db4cf, emissive: 0x16283f })
      );
      seg.position.y = 1.7 + s * 3.4;
      tower.add(seg);
      r *= 0.82;
    }
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 4, 8),
      new THREE.MeshLambertMaterial({ color: 0xc9d8e8 })
    );
    spire.position.y = 19;
    tower.add(spire);
    tower.position.set(x, 0, -10);
    city.add(tower);
  });
  // sky bridge
  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.5, 0.9),
    new THREE.MeshLambertMaterial({ color: 0xc9d8e8 })
  );
  bridge.position.set(0, 8.8, -10);
  city.add(bridge);
  scene.add(city);

  // ── sun / moon ──
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd23d })
  );
  orb.position.set(-16, 22, -40);
  scene.add(orb);
  const orbGlow = new THREE.PointLight(0xffd23d, 1.4, 200);
  orb.add(orbGlow);

  // ── stars (night only) ──
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(150 * 3);
  for (let i = 0; i < 150; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 160;
    starPos[i * 3 + 1] = 18 + Math.random() * 45;
    starPos[i * 3 + 2] = -60 - Math.random() * 30;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xf5efe0, size: 0.5, transparent: true, opacity: 0 })
  );
  scene.add(stars);

  // ── clouds ──
  const clouds = new THREE.Group();
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xf0f3f7, transparent: true, opacity: 0.92 });
  for (let c = 0; c < 7; c++) {
    const puffGroup = new THREE.Group();
    const puffs = 3 + Math.floor(Math.random() * 3);
    for (let p = 0; p < puffs; p++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 + Math.random() * 1.4, 1), cloudMat);
      puff.position.set(p * 2.1 - puffs, Math.random() * 0.9, Math.random() * 1.5);
      puffGroup.add(puff);
    }
    puffGroup.position.set((Math.random() - 0.5) * 70, 15 + Math.random() * 9, -24 - Math.random() * 22);
    puffGroup.userData.speed = 0.008 + Math.random() * 0.014;
    clouds.add(puffGroup);
  }
  scene.add(clouds);

  // ── rain ──
  const RAIN_COUNT = 900;
  const rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(RAIN_COUNT * 3);
  for (let i = 0; i < RAIN_COUNT; i++) {
    rainPos[i * 3] = (Math.random() - 0.5) * 70;
    rainPos[i * 3 + 1] = Math.random() * 40;
    rainPos[i * 3 + 2] = -4 - Math.random() * 30;
  }
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.Points(
    rainGeo,
    new THREE.PointsMaterial({ color: 0x9ec3ee, size: 0.22, transparent: true, opacity: 0 })
  );
  scene.add(rain);

  // ── state ──
  let mode = "cloudy";
  let isNight = false;
  let lightningTimer = 0;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function applyPalette() {
    const key = `${mode}_${isNight ? "night" : "day"}`;
    const p = PALETTES[key] || PALETTES.cloudy_day;
    scene.background = new THREE.Color(p.sky);
    scene.fog = new THREE.Fog(p.fog, mode === "haze" ? 18 : 40, mode === "haze" ? 70 : 140);
    ambient.intensity = p.ambient;
    orb.material.color.setHex(isNight ? 0xf5efe0 : p.sun);
    orbGlow.color.setHex(isNight ? 0xdfe6f5 : p.sun);
    orbGlow.intensity = isNight ? 0.7 : 1.4;
    stars.material.opacity = isNight && mode === "clear" ? 0.9 : 0;
    rain.material.opacity = mode === "rain" ? 0.75 : mode === "storm" ? 0.9 : 0;
    clouds.visible = mode !== "clear";
    cloudMat.color.setHex(mode === "storm" ? 0x6a7686 : mode === "haze" ? 0xd8b98a : 0xf0f3f7);
  }

  function setWeather(newMode, night) {
    mode = newMode;
    isNight = night;
    applyPalette();
    if (reduceMotion) renderOnce();
  }

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  let t = 0;
  function tick() {
    t += 0.005;
    camera.position.x = Math.sin(t * 0.4) * 2.2;
    camera.position.y = 7 + Math.sin(t * 0.7) * 0.5;
    camera.lookAt(0, 7, -8);

    clouds.children.forEach((cl) => {
      cl.position.x += cl.userData.speed;
      if (cl.position.x > 42) cl.position.x = -42;
    });

    if (rain.material.opacity > 0) {
      const pos = rain.geometry.attributes.position;
      for (let i = 0; i < RAIN_COUNT; i++) {
        let y = pos.getY(i) - (mode === "storm" ? 0.85 : 0.55);
        if (y < 0) y = 38 + Math.random() * 4;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    if (mode === "storm") {
      lightningTimer -= 1;
      if (lightningTimer <= 0 && Math.random() < 0.012) {
        flash.intensity = 22;
        lightningTimer = 90 + Math.random() * 180;
      }
      flash.intensity *= 0.86;
    } else {
      flash.intensity = 0;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  function renderOnce() {
    resize();
    renderer.render(scene, camera);
  }

  window.addEventListener("resize", () => (reduceMotion ? renderOnce() : resize()));
  resize();
  applyPalette();
  if (reduceMotion) {
    renderOnce(); // static frame — respect the user's setting
  } else {
    tick();
  }

  return { setWeather };
}
