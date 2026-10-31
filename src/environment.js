/**
 * Hyper-Realistic Photorealistic Cosmic Environment & PBR Image-Based Lighting
 * Features IBL environment reflection map, high-resolution multi-tiered starfields,
 * volumetric glowing nebulae, cinematic gas giant planet with atmospheric rim scattering,
 * realistic solar lens flare, and deep-space dust particles.
 */
export class CosmicEnvironment {
  constructor(scene, renderer, THREE) {
    this.scene = scene;
    this.renderer = renderer;
    this.THREE = THREE;

    this.group = new THREE.Group();
    this.dustParticles = null;
    this.dustPositions = null;
    this.dustCount = 1000;
    this.dustRadius = 280;

    this._createPBREnvironmentMap();
    this._createDeepStarfield();
    this._createVolumetricNebulae();
    this._createCinematicPlanet();
    this._createCosmicSunAndLensflare();
    this._createSpaceDust();

    this.scene.add(this.group);
  }

  _createPBREnvironmentMap() {
    const THREE = this.THREE;
    if (!this.renderer) return;

    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();

      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Deep cosmic gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
      bgGrad.addColorStop(0, '#02050e');
      bgGrad.addColorStop(0.5, '#060f1c');
      bgGrad.addColorStop(1, '#010307');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 512);

      // Cosmic nebula streaks in reflection map
      const nebGrad1 = ctx.createRadialGradient(250, 200, 10, 250, 200, 240);
      nebGrad1.addColorStop(0, 'rgba(62, 240, 255, 0.45)');
      nebGrad1.addColorStop(0.5, 'rgba(30, 80, 180, 0.2)');
      nebGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebGrad1;
      ctx.fillRect(0, 0, 1024, 512);

      const nebGrad2 = ctx.createRadialGradient(780, 280, 20, 780, 280, 300);
      nebGrad2.addColorStop(0, 'rgba(255, 60, 140, 0.35)');
      nebGrad2.addColorStop(0.6, 'rgba(110, 20, 160, 0.15)');
      nebGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebGrad2;
      ctx.fillRect(0, 0, 1024, 512);

      // Directional Sun highlight for sharp specular reflection
      const sunGrad = ctx.createRadialGradient(180, 140, 0, 180, 140, 60);
      sunGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      sunGrad.addColorStop(0.2, 'rgba(255, 230, 180, 0.8)');
      sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, 1024, 512);

      // Distant stars reflection specks
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 400; i++) {
        ctx.fillRect(Math.random() * 1024, Math.random() * 512, Math.random() > 0.8 ? 2 : 1, 1);
      }

      const envTexture = new THREE.CanvasTexture(canvas);
      envTexture.mapping = THREE.EquirectangularReflectionMapping;

      const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
      this.scene.environment = envMap;
      pmremGenerator.dispose();
      envTexture.dispose();
    } catch (e) {
      console.warn('PBR Environment Map initialization skipped:', e);
    }
  }

  _createDeepStarfield() {
    const THREE = this.THREE;
    const count = 4800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const starPalette = [
      new THREE.Color(0xffffff), // White A-class
      new THREE.Color(0xaad8ff), // Brilliant Blue B-class
      new THREE.Color(0x66c0ff), // Deep Blue O-class
      new THREE.Color(0xffeedd), // Soft Yellow-White F-class
      new THREE.Color(0xffd27d), // Warm Amber G-class
      new THREE.Color(0xff7055)  // Red Supergiant M-class
    ];

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2600 + Math.random() * 700;

      const sinPhi = Math.sin(phi);
      positions[i * 3] = r * sinPhi * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.7;
      positions[i * 3 + 2] = r * sinPhi * Math.sin(theta);

      const col = starPalette[Math.floor(Math.random() * starPalette.length)];
      const brightness = 0.45 + Math.random() * 0.55;
      colors[i * 3] = col.r * brightness;
      colors[i * 3 + 1] = col.g * brightness;
      colors[i * 3 + 2] = col.b * brightness;

      sizes[i] = (Math.random() > 0.94) ? 4.8 : (1.8 + Math.random() * 2.4);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starTexture = this._generateStarTexture();
    const material = new THREE.PointsMaterial({
      size: 3.4,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.starPoints = new THREE.Points(geometry, material);
    this.group.add(this.starPoints);
  }

  _createVolumetricNebulae() {
    const THREE = this.THREE;
    const nebulaTexture = this._generateNebulaTexture();

    const nebulae = [
      { color: 0x4822cf, size: 1300, x: -1100, y: 220, z: -1400, opacity: 0.38 },
      { color: 0x0088ff, size: 1500, x: 1400, y: -120, z: -1600, opacity: 0.35 },
      { color: 0xff1493, size: 1000, x: 900, y: 320, z: 1100, opacity: 0.32 },
      { color: 0x00e5ff, size: 1200, x: -1300, y: -200, z: 950, opacity: 0.34 },
      { color: 0xff8800, size: 900, x: -500, y: 400, z: -1800, opacity: 0.28 },
      { color: 0x9400d3, size: 1400, x: 1800, y: 150, z: 500, opacity: 0.28 },
      { color: 0x00ffcc, size: 850, x: -800, y: -250, z: -850, opacity: 0.26 },
      { color: 0x7b2cbf, size: 1100, x: 300, y: -380, z: 1500, opacity: 0.30 },
      { color: 0x3a0ca3, size: 1600, x: -1600, y: 50, z: -400, opacity: 0.34 },
      { color: 0xf72585, size: 950, x: 1100, y: -280, z: -900, opacity: 0.26 }
    ];

    this.nebulaSprites = [];
    nebulae.forEach(data => {
      const mat = new THREE.SpriteMaterial({
        map: nebulaTexture,
        color: data.color,
        transparent: true,
        opacity: data.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const sprite = new THREE.Sprite(mat);
      sprite.position.set(data.x, data.y, data.z);
      sprite.scale.set(data.size, data.size * 0.8, 1);
      this.group.add(sprite);
      this.nebulaSprites.push({ sprite, rotSpeed: (Math.random() - 0.5) * 0.02 });
    });
  }

  _createCinematicPlanet() {
    const THREE = this.THREE;
    const planetGroup = new THREE.Group();
    planetGroup.position.set(1600, -320, 2100);

    const planetGeom = new THREE.SphereGeometry(380, 48, 48);
    const planetTexture = this._generatePlanetTexture();
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTexture,
      roughness: 0.75,
      metalness: 0.15,
      color: 0x6bb5e6
    });
    const planet = new THREE.Mesh(planetGeom, planetMat);
    planetGroup.add(planet);

    const atmoGeom = new THREE.SphereGeometry(395, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x4cc9f0,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const atmo = new THREE.Mesh(atmoGeom, atmoMat);
    planetGroup.add(atmo);

    const ringGeom = new THREE.RingGeometry(460, 720, 64);
    ringGeom.rotateX(Math.PI / 2.3);
    ringGeom.rotateY(0.4);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending
    });
    const rings = new THREE.Mesh(ringGeom, ringMat);
    planetGroup.add(rings);

    this.planetGroup = planetGroup;
    this.group.add(planetGroup);
  }

  _createCosmicSunAndLensflare() {
    const THREE = this.THREE;
    const sunGroup = new THREE.Group();
    sunGroup.position.set(-2200, 520, -2600);

    const sunCore = new THREE.Mesh(
      new THREE.SphereGeometry(180, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.99 })
    );
    sunGroup.add(sunCore);

    const flareTex = this._generateNebulaTexture();

    const innerCorona = new THREE.Sprite(new THREE.SpriteMaterial({
      map: flareTex,
      color: 0xffe099,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    innerCorona.scale.set(950, 950, 1);
    sunGroup.add(innerCorona);

    const outerHalo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: flareTex,
      color: 0x44aaff,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    outerHalo.scale.set(1800, 1800, 1);
    sunGroup.add(outerHalo);

    const streak = new THREE.Sprite(new THREE.SpriteMaterial({
      map: flareTex,
      color: 0x77d4ff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    streak.scale.set(4500, 220, 1);
    sunGroup.add(streak);

    const sunLight = new THREE.DirectionalLight(0xfff7ea, 2.0);
    sunLight.position.copy(sunGroup.position);
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x1a3048, 0.95);
    fillLight.position.set(2200, -400, 2600);
    this.scene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0x141f2e, 0.9);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x284262, 0x070b14, 0.95);
    this.scene.add(hemiLight);

    this.group.add(sunGroup);
  }

  _createSpaceDust() {
    const THREE = this.THREE;
    const count = this.dustCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * this.dustRadius * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.dustRadius * 2;

      const isCyan = Math.random() > 0.4;
      colors[i * 3] = isCyan ? 0.35 : 0.95;
      colors[i * 3 + 1] = isCyan ? 0.85 : 0.75;
      colors[i * 3 + 2] = isCyan ? 1.0 : 0.3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.dustPositions = positions;
    this.scene.add(this.dustParticles);
  }

  _generateStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.18, 'rgba(220, 245, 255, 0.85)');
    grad.addColorStop(0.45, 'rgba(100, 180, 255, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new this.THREE.CanvasTexture(canvas);
  }

  _generateNebulaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.25, 'rgba(210, 230, 255, 0.65)');
    grad.addColorStop(0.6, 'rgba(120, 90, 240, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return new this.THREE.CanvasTexture(canvas);
  }

  _generatePlanetTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f3152';
    ctx.fillRect(0, 0, 512, 256);

    for (let y = 0; y < 256; y += 4) {
      const alpha = 0.15 + Math.sin(y * 0.08) * 0.12;
      ctx.fillStyle = `rgba(180, 225, 255, ${alpha})`;
      ctx.fillRect(0, y, 512, 4);
    }

    for (let i = 0; i < 18; i++) {
      const cx = Math.random() * 512;
      const cy = 40 + Math.random() * 176;
      const rad = 25 + Math.random() * 50;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(1, 'rgba(100, 180, 240, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    return new this.THREE.CanvasTexture(canvas);
  }

  update(playerPos, dt = 0.016) {
    if (this.starPoints) {
      this.starPoints.position.set(playerPos.x * 0.94, 0, playerPos.z * 0.94);
    }

    if (this.planetGroup) {
      this.planetGroup.rotation.y += 0.008 * dt;
    }

    if (this.dustParticles && this.dustPositions) {
      const posAttr = this.dustParticles.geometry.attributes.position;
      const r = this.dustRadius;
      for (let i = 0; i < this.dustCount; i++) {
        let x = this.dustPositions[i * 3];
        let z = this.dustPositions[i * 3 + 2];

        while (x - playerPos.x > r) x -= r * 2;
        while (x - playerPos.x < -r) x += r * 2;
        while (z - playerPos.z > r) z -= r * 2;
        while (z - playerPos.z < -r) z += r * 2;

        this.dustPositions[i * 3] = x;
        this.dustPositions[i * 3 + 2] = z;
      }
      posAttr.needsUpdate = true;
    }
  }
}
