/**
 * Open-World Cosmic Battlefield Environment
 * Boundless 360-degree space with procedural starfields, volumetric nebulae,
 * distant binary star, and infinite cosmic backdrop. Zero walls or rigid limits.
 */
export class CosmicEnvironment {
  constructor(scene, THREE) {
    this.scene = scene;
    this.THREE = THREE;

    this.group = new THREE.Group();
    this.dustParticles = null;
    this.dustPositions = null;
    this.dustCount = 600;
    this.dustRadius = 240;

    this._createStarfields();
    this._createNebulae();
    this._createCosmicSun();
    this._createSpaceDust();

    this.scene.add(this.group);
  }

  _createStarfields() {
    const THREE = this.THREE;

    // Layer 1: Distant Celestial Starfield
    const count = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const starColors = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x99ddff),
      new THREE.Color(0xffd480),
      new THREE.Color(0xff7799),
      new THREE.Color(0x77eeff)
    ];

    for (let i = 0; i < count; i++) {
      // Distribute on large sphere surface
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2400 + Math.random() * 400;

      const sinPhi = Math.sin(phi);
      positions[i * 3] = r * sinPhi * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.6; // Slight cosmic disc flattening
      positions[i * 3 + 2] = r * sinPhi * Math.sin(theta);

      const col = starColors[Math.floor(Math.random() * starColors.length)];
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = col.r * brightness;
      colors[i * 3 + 1] = col.g * brightness;
      colors[i * 3 + 2] = col.b * brightness;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starTexture = this._generateStarTexture();
    const material = new THREE.PointsMaterial({
      size: 3.5,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.starPoints = new THREE.Points(geometry, material);
    this.group.add(this.starPoints);
  }

  _createNebulae() {
    const THREE = this.THREE;
    const nebulaTexture = this._generateNebulaTexture();

    // 8 Major Volumetric Cosmic Nebula Clouds
    const nebulaeData = [
      { color: 0x6e22cf, size: 850, x: -900, y: 120, z: -1100, opacity: 0.35 }, // Violet
      { color: 0x1f75fe, size: 950, x: 1200, y: -80, z: -1400, opacity: 0.32 }, // Cyan Blue
      { color: 0xff3b77, size: 700, x: 750, y: 220, z: 900, opacity: 0.28 },   // Magenta
      { color: 0x00d4ff, size: 800, x: -1100, y: -150, z: 800, opacity: 0.30 }, // Neon Turquoise
      { color: 0xff8c00, size: 650, x: -400, y: 300, z: -1500, opacity: 0.25 }, // Amber Dust
      { color: 0x9400d3, size: 1100, x: 1500, y: 100, z: 400, opacity: 0.24 },  // Deep Purple
      { color: 0x00f5d4, size: 600, x: -600, y: -200, z: -700, opacity: 0.22 }, // Aquamarine
      { color: 0xe024c3, size: 750, x: 200, y: -300, z: 1300, opacity: 0.26 }   // Neon Pink
    ];

    nebulaeData.forEach(data => {
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
      sprite.scale.set(data.size, data.size * 0.75, 1);
      this.group.add(sprite);
    });
  }

  _createCosmicSun() {
    const THREE = this.THREE;
    const sunGroup = new THREE.Group();
    sunGroup.position.set(-1800, 450, -2200);

    // Glowing Sun Core
    const sunGeom = new THREE.SphereGeometry(140, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfff3d6,
      transparent: true,
      opacity: 0.98
    });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    sunGroup.add(sunMesh);

    // Corona Glow Sprite
    const coronaTexture = this._generateNebulaTexture();
    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTexture,
      color: 0xff9933,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const corona = new THREE.Sprite(coronaMat);
    corona.scale.set(700, 700, 1);
    sunGroup.add(corona);

    // Outer Blue Starburst / Lens flare
    const flareMat = new THREE.SpriteMaterial({
      map: coronaTexture,
      color: 0x55ccff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const flare = new THREE.Sprite(flareMat);
    flare.scale.set(1200, 1200, 1);
    sunGroup.add(flare);

    // Directional Sunlight Illuminating Cosmic Rocks and Starfighter
    const sunLight = new THREE.DirectionalLight(0xfff5ea, 1.4);
    sunLight.position.copy(sunGroup.position);
    this.scene.add(sunLight);

    // Ambient Space Radiance
    const ambientLight = new THREE.AmbientLight(0x1a2638, 0.75);
    this.scene.add(ambientLight);

    // Hemisphere light for cosmic sky-ground gradient
    const hemiLight = new THREE.HemisphereLight(0x283b54, 0x080c14, 0.85);
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
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.dustRadius * 2;

      // Subtle cyan/amber sparkle
      const isCyan = Math.random() > 0.4;
      colors[i * 3] = isCyan ? 0.3 : 0.9;
      colors[i * 3 + 1] = isCyan ? 0.8 : 0.6;
      colors[i * 3 + 2] = isCyan ? 1.0 : 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
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
    grad.addColorStop(0.2, 'rgba(230, 245, 255, 0.8)');
    grad.addColorStop(0.5, 'rgba(120, 200, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new this.THREE.CanvasTexture(canvas);
  }

  _generateNebulaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(200, 220, 255, 0.55)');
    grad.addColorStop(0.65, 'rgba(120, 80, 240, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new this.THREE.CanvasTexture(canvas);
  }

  update(playerPos) {
    // Keep the distant celestial starfield centered around the player
    // to provide infinite 360-degree cosmic parallax
    if (this.starPoints) {
      this.starPoints.position.set(playerPos.x * 0.92, 0, playerPos.z * 0.92);
    }

    // Wrap local space dust around the player's active volume
    if (this.dustParticles && this.dustPositions) {
      const posAttr = this.dustParticles.geometry.attributes.position;
      const r = this.dustRadius;
      for (let i = 0; i < this.dustCount; i++) {
        let x = this.dustPositions[i * 3];
        let z = this.dustPositions[i * 3 + 2];

        // Wrap relative to player
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
