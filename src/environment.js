/**
 * Hyper-Realistic Photorealistic Cosmic Environment & Dynamic Level Atmosphere
 * Features:
 * - 5 Level Atmosphere Presets (Deep-Space Planet, Asteroid Belt, Orbital Station, Nebula Frontier, Capital Fleet)
 * - Massive 3D Orbital Space Station ("Valiance Station") with rotating habitat ring, solar arrays & beacons
 * - Volumetric Glowing Nebulae (Inspired by Reference Image 2 deep cosmic scale)
 * - Atmospheric rim scattering planets & moons
 * - 4,800 Multi-Tiered Stars (O, B, A, F, G, M stellar spectrum)
 * - Drifting space wreckage chunks and cosmic dust particles
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

    this.nebulaSprites = [];
    this.spaceStation = null;
    this.spaceStationRing = null;
    this.wreckageChunks = [];
    this.distantCruisers = [];
    this.planetGroup = null;
    this.planetMesh = null;
    this.sunGroup = null;
    this.sunLight = null;

    this._createPBREnvironmentMap();
    this._createDeepStarfield();
    this._createVolumetricNebulae();
    this._createCinematicPlanet();
    this._createOrbitalSpaceStation();
    this._createSpaceWreckage();
    this._createDistantFleet();
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
      new THREE.Color(0xffffff),
      new THREE.Color(0xaad8ff),
      new THREE.Color(0x66c0ff),
      new THREE.Color(0xffeedd),
      new THREE.Color(0xffd27d),
      new THREE.Color(0xff7055)
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
      { color: 0x4822cf, size: 1400, x: -1100, y: 220, z: -1400, opacity: 0.38 },
      { color: 0x0088ff, size: 1600, x: 1400, y: -120, z: -1600, opacity: 0.35 },
      { color: 0x1d4ed8, size: 1800, x: 500, y: 180, z: -1800, opacity: 0.36 },
      { color: 0x00e5ff, size: 1200, x: -1300, y: -200, z: 950, opacity: 0.34 },
      { color: 0x7e22ce, size: 1500, x: 1800, y: 150, z: 500, opacity: 0.32 },
      { color: 0x00ffcc, size: 950, x: -800, y: -250, z: -850, opacity: 0.28 },
      { color: 0x3b82f6, size: 1300, x: 300, y: -380, z: 1500, opacity: 0.32 },
      { color: 0x3a0ca3, size: 1700, x: -1600, y: 50, z: -400, opacity: 0.34 }
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
      this.nebulaSprites.push({ sprite, baseOpacity: data.opacity });
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
    this.planetMesh = planet;

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

  /**
   * Massive 3D Orbital Space Station ("Valiance Station") for Level 3
   */
  _createOrbitalSpaceStation() {
    const THREE = this.THREE;
    const stationGroup = new THREE.Group();
    stationGroup.position.set(240, 25, 300);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x2b3442,
      metalness: 0.88,
      roughness: 0.30
    });
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x092347,
      emissive: 0x041833,
      metalness: 0.95,
      roughness: 0.12
    });
    const lightGlowMat = new THREE.MeshBasicMaterial({
      color: 0x3ef0ff
    });
    const beaconRed = new THREE.MeshBasicMaterial({
      color: 0xff1744
    });

    // 1. Central Rotating Habitat Ring
    const ringGeom = new THREE.TorusGeometry(40, 3.8, 16, 48);
    const ringMesh = new THREE.Mesh(ringGeom, metalMat);
    ringMesh.rotation.x = Math.PI / 2;
    stationGroup.add(ringMesh);

    // Habitat Window strips
    const windowRing = new THREE.Mesh(new THREE.TorusGeometry(40.2, 0.45, 8, 48), lightGlowMat);
    windowRing.rotation.x = Math.PI / 2;
    stationGroup.add(windowRing);

    // 4 Structural Radial Spokes
    for (let s = 0; s < 4; s++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 80, 8), metalMat);
      spoke.rotation.z = (s / 4) * Math.PI;
      stationGroup.add(spoke);
    }

    // 2. Central Spindle Hub & Docking Tower
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 9.5, 68, 16), metalMat);
    stationGroup.add(hub);

    // Docking clamps
    [-26, 26].forEach(yPos => {
      const dockRing = new THREE.Mesh(new THREE.TorusGeometry(11.2, 1.4, 8, 24), metalMat);
      dockRing.rotation.x = Math.PI / 2;
      dockRing.position.y = yPos;
      stationGroup.add(dockRing);
    });

    // 3. Four Massive Photovoltaic Solar Array Wings
    [-1, 1].forEach(side => {
      const solarArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 22), metalMat);
      solarArm.position.set(side * 28, 0, 0);
      stationGroup.add(solarArm);

      const panel = new THREE.Mesh(new THREE.BoxGeometry(36, 0.4, 16), solarMat);
      panel.position.set(side * 48, 0, 0);
      stationGroup.add(panel);
    });

    // 4. Communication Antennas & Flashing Aviation Beacons
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, 32, 8), metalMat);
    antenna.position.set(0, 48, 0);
    stationGroup.add(antenna);

    const redBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8), beaconRed);
    redBeacon.position.set(0, 64, 0);
    stationGroup.add(redBeacon);

    stationGroup.visible = false; // Enabled in Level 3
    this.spaceStation = stationGroup;
    this.spaceStationRing = ringMesh;
    this.group.add(stationGroup);
  }

  /**
   * Drifting Space Wreckage Chunks for Levels 3 & 4
   */
  _createSpaceWreckage() {
    const THREE = this.THREE;
    const wreckageGroup = new THREE.Group();

    const wreckMat = new THREE.MeshStandardMaterial({
      color: 0x1f2633,
      metalness: 0.90,
      roughness: 0.45
    });

    for (let i = 0; i < 8; i++) {
      const chunk = new THREE.Mesh(new THREE.BoxGeometry(4 + Math.random() * 6, 1.5, 8 + Math.random() * 8), wreckMat);
      const angle = (i / 8) * Math.PI * 2;
      const dist = 180 + Math.random() * 120;
      chunk.position.set(Math.sin(angle) * dist, (Math.random() - 0.5) * 35, Math.cos(angle) * dist);
      chunk.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      wreckageGroup.add(chunk);
      this.wreckageChunks.push(chunk);
    }

    wreckageGroup.visible = false;
    this.wreckageGroup = wreckageGroup;
    this.group.add(wreckageGroup);
  }

  /**
   * Distant Capital Cruisers & Fighter Patrols in deep space (Reference Image 2 scale)
   * Drifting at 1400m - 2400m with glowing blue plasma engine wakes and blinking beacons
   */
  _createDistantFleet() {
    const THREE = this.THREE;
    const fleetGroup = new THREE.Group();

    const cruiserHullMat = new THREE.MeshStandardMaterial({
      color: 0x2e3c50,
      metalness: 0.92,
      roughness: 0.28
    });
    const cruiserGlowMat = new THREE.MeshBasicMaterial({ color: 0x3ef0ff });
    const cruiserTrailMat = new THREE.MeshBasicMaterial({
      color: 0x00c8ff,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const strobeMat = new THREE.MeshBasicMaterial({ color: 0xff2244 });

    const configs = [
      { x: -1400, y: 160, z: -1600, scale: 1.2, speed: 5.5, heading: 0.4 },
      { x: 1800, y: -200, z: -1200, scale: 1.5, speed: 4.2, heading: -0.6 },
      { x: 300, y: 340, z: -2200, scale: 2.2, speed: 3.5, heading: 0.15 }
    ];

    configs.forEach(cfg => {
      const ship = new THREE.Group();
      ship.position.set(cfg.x, cfg.y, cfg.z);
      ship.rotation.y = cfg.heading;

      // Fuselage & Wing structure
      const hull = new THREE.Mesh(new THREE.BoxGeometry(16 * cfg.scale, 5 * cfg.scale, 54 * cfg.scale), cruiserHullMat);
      ship.add(hull);

      const wings = new THREE.Mesh(new THREE.BoxGeometry(52 * cfg.scale, 1.8 * cfg.scale, 24 * cfg.scale), cruiserHullMat);
      wings.position.set(0, 0, -6 * cfg.scale);
      ship.add(wings);

      // Bridge command tower
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(6 * cfg.scale, 4.5 * cfg.scale, 12 * cfg.scale), cruiserGlowMat);
      bridge.position.set(0, 4.5 * cfg.scale, -12 * cfg.scale);
      ship.add(bridge);

      // Twin Long Blue Engine Plasma Plumes
      [-8 * cfg.scale, 8 * cfg.scale].forEach(ox => {
        const trailGeom = new THREE.ConeGeometry(2.4 * cfg.scale, 42 * cfg.scale, 8);
        trailGeom.rotateX(-Math.PI / 2);
        const trail = new THREE.Mesh(trailGeom, cruiserTrailMat);
        trail.position.set(ox, 0, -48 * cfg.scale);
        ship.add(trail);
      });

      // Flashing Wingtip Navigation Strobes
      const beaconL = new THREE.Mesh(new THREE.SphereGeometry(1.2 * cfg.scale, 6, 6), strobeMat);
      beaconL.position.set(-26 * cfg.scale, 0, -6 * cfg.scale);
      ship.add(beaconL);

      const beaconR = beaconL.clone();
      beaconR.position.x = 26 * cfg.scale;
      ship.add(beaconR);

      fleetGroup.add(ship);
      this.distantCruisers.push({ ship, speed: cfg.speed, heading: cfg.heading, beacons: [beaconL, beaconR] });
    });

    this.group.add(fleetGroup);
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

    // Primary Sun Light (Warm Crisp Sunlight)
    const sunLight = new THREE.DirectionalLight(0xfff7ea, 2.8);
    sunLight.position.copy(sunGroup.position);
    this.scene.add(sunLight);
    this.sunLight = sunLight;

    // Cosmic Nebula Blue Fill Light (Ensures hostile hulls stay clearly visible in shadow)
    const fillLight = new THREE.DirectionalLight(0x5a88ba, 1.4);
    fillLight.position.set(2200, 400, 2600);
    this.scene.add(fillLight);

    // Ambient Deep-Space Illumination (Prevents pure black silhouettes)
    const ambientLight = new THREE.AmbientLight(0x364a64, 1.35);
    this.scene.add(ambientLight);

    // Upper/Lower Cosmic Bounce Light
    const hemiLight = new THREE.HemisphereLight(0x466892, 0x141e2c, 1.25);
    this.scene.add(hemiLight);

    this.sunGroup = sunGroup;
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

    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#102e52');
    grad.addColorStop(0.3, '#2a6496');
    grad.addColorStop(0.5, '#5b9bd5');
    grad.addColorStop(0.7, '#24527a');
    grad.addColorStop(1, '#0c1e33');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    for (let i = 0; i < 16; i++) {
      const y = Math.random() * 256;
      const h = 4 + Math.random() * 12;
      ctx.fillRect(0, y, 512, h);
    }
    return new this.THREE.CanvasTexture(canvas);
  }

  /**
   * Sets the cosmic environment theme for each of the 5 Levels
   */
  setLevelEnvironment(levelNumber) {
    if (levelNumber === 1) {
      // Level 1: Deep-Space Planet
      if (this.planetGroup) {
        this.planetGroup.visible = true;
        this.planetGroup.position.set(1600, -320, 2100);
      }
      if (this.spaceStation) this.spaceStation.visible = false;
      if (this.wreckageGroup) this.wreckageGroup.visible = false;
      if (this.sunLight) this.sunLight.color.setHex(0xfff7ea);
    } else if (levelNumber === 2) {
      // Level 2: Asteroid Field
      if (this.planetGroup) this.planetGroup.visible = false;
      if (this.spaceStation) this.spaceStation.visible = false;
      if (this.wreckageGroup) this.wreckageGroup.visible = false;
      if (this.sunLight) this.sunLight.color.setHex(0xffeedd);
    } else if (levelNumber === 3) {
      // Level 3: Orbital Space Station Battle
      if (this.planetGroup) {
        this.planetGroup.visible = true;
        this.planetGroup.position.set(600, -450, 900);
      }
      if (this.spaceStation) this.spaceStation.visible = true;
      if (this.wreckageGroup) this.wreckageGroup.visible = true;
      if (this.sunLight) this.sunLight.color.setHex(0xffffff);
    } else if (levelNumber === 4) {
      // Level 4: Nebula Frontier (Ref 2 Style Cobalt/Violet Majesty)
      if (this.planetGroup) this.planetGroup.visible = false;
      if (this.spaceStation) this.spaceStation.visible = false;
      if (this.wreckageGroup) this.wreckageGroup.visible = true;
      if (this.sunLight) this.sunLight.color.setHex(0xcce5ff);
    } else {
      // Level 5: Capital Fleet Warzone
      if (this.planetGroup) {
        this.planetGroup.visible = true;
        this.planetGroup.position.set(-1200, -280, 1800);
      }
      if (this.spaceStation) this.spaceStation.visible = false;
      if (this.wreckageGroup) this.wreckageGroup.visible = true;
      if (this.sunLight) this.sunLight.color.setHex(0xffaa77);
    }
  }

  update(playerPos, dt) {
    if (!this.dustParticles) return;

    // Follow player smoothly
    this.group.position.x = playerPos.x * 0.98;
    this.group.position.z = playerPos.z * 0.98;

    // Rotate space station habitat ring
    if (this.spaceStation && this.spaceStationRing) {
      this.spaceStationRing.rotation.z += 0.25 * dt;
    }

    // Tumble space wreckage
    this.wreckageChunks.forEach(chunk => {
      chunk.rotation.x += 0.05 * dt;
      chunk.rotation.y += 0.08 * dt;
    });

    // Animate distant capital fleet cruising in background
    const sec = performance.now() * 0.001;
    this.distantCruisers.forEach(c => {
      c.ship.position.x += Math.sin(c.heading) * c.speed * dt;
      c.ship.position.z += Math.cos(c.heading) * c.speed * dt;
      const strobeOn = (sec % 1.6) < 0.18;
      c.beacons.forEach(b => { b.visible = strobeOn; });
    });

    // Space dust loop around player (only update GPU buffer if wrapping occurred)
    const positions = this.dustPositions;
    const r = this.dustRadius;
    const count = this.dustCount;
    let wrapped = false;

    for (let i = 0; i < count; i++) {
      let x = positions[i * 3];
      let z = positions[i * 3 + 2];

      const dx = x - playerPos.x;
      const dz = z - playerPos.z;

      if (dx > r) { positions[i * 3] -= r * 2; wrapped = true; }
      else if (dx < -r) { positions[i * 3] += r * 2; wrapped = true; }

      if (dz > r) { positions[i * 3 + 2] -= r * 2; wrapped = true; }
      else if (dz < -r) { positions[i * 3 + 2] += r * 2; wrapped = true; }
    }
    if (wrapped) {
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.planetMesh) {
      this.planetMesh.rotation.y += 0.015 * dt;
    }
  }
}
