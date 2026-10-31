/**
 * Photorealistic Starfighter Models & Flight Controller
 * Features 3 distinct flyable ships meticulously crafted after reference designs:
 * 1. Aether Vanguard - Sleek, highly agile interceptor with blue plasma trails
 * 2. Void Dreadnought - Heavy armored twin-hull cruiser with dark metallic matte finish
 * 3. Crimson Interceptor - Tactical fighter with silver-grey chassis and red/orange energy highlights
 */

export const SHIP_CONFIGS = {
  aether: {
    id: 'aether',
    name: 'AETHER VANGUARD',
    type: 'High-Agility Interceptor',
    description: 'Sleek aerodynamic spaceframe engineered for hyper-maneuverability. Features cranked delta wings, dual canted stabilizers, and twin high-frequency blue plasma cannons.',
    maxSpeed: 64,
    boostSpeed: 136,
    accelRate: 68,
    turnRate: 7.8,
    rollRate: 11.0,
    maxShield: 85,
    maxHull: 80,
    shieldRegenRate: 24,
    boostDrainRate: 26,
    fireInterval: 0.10,
    primaryColor: 0x3ef0ff,
    engineGlow: 0x3ef0ff,
    laserColor: 0x3ef0ff,
    weaponType: 'dual_rapid',
    stats: { speed: 95, agility: 98, shields: 75, hull: 70, firepower: 82 }
  },
  dreadnought: {
    id: 'dreadnought',
    name: 'VOID DREADNOUGHT',
    type: 'Heavy Twin-Hull Cruiser',
    description: 'Monolithic combat warship with stealth composite armor and dual reinforced catamarans. Deploys heavy kinetic plasma batteries and an impenetrable layered shield capacitor.',
    maxSpeed: 44,
    boostSpeed: 98,
    accelRate: 46,
    turnRate: 5.2,
    rollRate: 7.0,
    maxShield: 140,
    maxHull: 160,
    shieldRegenRate: 16,
    boostDrainRate: 32,
    fireInterval: 0.16,
    primaryColor: 0xff7700,
    engineGlow: 0xff5500,
    laserColor: 0xff8800,
    weaponType: 'heavy_dual',
    stats: { speed: 68, agility: 60, shields: 98, hull: 100, firepower: 95 }
  },
  crimson: {
    id: 'crimson',
    name: 'CRIMSON INTERCEPTOR',
    type: 'Tactical Strike Fighter',
    description: 'Advanced tactical strike craft built with brushed titanium alloys and racing crimson aero-foils. Features twin VTOL plasma turbine rings and a triple laser system.',
    maxSpeed: 55,
    boostSpeed: 120,
    accelRate: 58,
    turnRate: 6.8,
    rollRate: 9.2,
    maxShield: 105,
    maxHull: 105,
    shieldRegenRate: 20,
    boostDrainRate: 28,
    fireInterval: 0.12,
    primaryColor: 0xff1744,
    engineGlow: 0xff2244,
    laserColor: 0xff2244,
    weaponType: 'triple_pulse',
    stats: { speed: 85, agility: 86, shields: 85, hull: 85, firepower: 90 }
  }
};

export class Starfighter {
  constructor(scene, THREE, shipType = 'aether') {
    this.scene = scene;
    this.THREE = THREE;
    this.config = SHIP_CONFIGS[shipType] || SHIP_CONFIGS.aether;
    this.shipType = shipType;

    // Movement & Physics State
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.heading = 0;
    this.targetHeading = 0;
    this.roll = 0;
    this.pitch = 0;

    // Vitals from Config
    this.maxHull = this.config.maxHull;
    this.hull = this.maxHull;
    this.maxShield = this.config.maxShield;
    this.shield = this.maxShield;
    this.shieldRegenDelay = 3.0;
    this.lastDamageTime = 0;
    this.shieldRegenRate = this.config.shieldRegenRate;

    // Energy / Boost
    this.maxEnergy = 100;
    this.energy = 100;
    this.boostDrainRate = this.config.boostDrainRate;
    this.energyRegenRate = 22;
    this.isBoosting = false;
    this.invulnerableTimer = 0; // For Shield Overcharge power-up

    // Weapon Upgrades
    this.weaponLevel = 1; // 1 = Standard, 2 = Triple/Heavy, 3 = Hyper Quad
    this.weaponLevelTimer = 0;
    this.fireInterval = this.config.fireInterval;
    this.lastFireTime = 0;
    this.heat = 0;
    this.overheated = false;
    this.coolRate = 0.38;

    // 3D Objects & FX
    this.group = new THREE.Group();
    this.shipMesh = null;
    this.thrusterFlames = [];
    this.thrusterLights = [];
    this.laserMuzzleOffsets = [];
    this.shieldMesh = null;

    this._buildShipModel();
    this.scene.add(this.group);
  }

  _buildShipModel() {
    const THREE = this.THREE;
    const type = this.shipType;

    if (type === 'aether') {
      this._buildAetherVanguard();
    } else if (type === 'dreadnought') {
      this._buildVoidDreadnought();
    } else {
      this._buildCrimsonInterceptor();
    }

    // Reactive Holographic Shield Bubble
    const shieldGeom = new THREE.IcosahedronGeometry(3.2, 2);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: this.config.primaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    this.shieldMesh.scale.set(1.2, 0.65, 1.4);
    this.group.add(this.shieldMesh);
  }

  /**
   * SHIP 1: AETHER VANGUARD (Ref Image 1)
   * Sleek aerodynamic interceptor, cranked-arrow forward delta wings,
   * dual canted vertical stabilizers, canopy cockpit, and cyan energy trails.
   */
  _buildAetherVanguard() {
    const THREE = this.THREE;
    const shipRoot = new THREE.Group();

    // PBR Materials
    const aeroArmorMat = new THREE.MeshStandardMaterial({
      color: 0x8ebbd9,
      metalness: 0.82,
      roughness: 0.28,
      envMapIntensity: 1.5
    });

    const darkUnderbodyMat = new THREE.MeshStandardMaterial({
      color: 0x182433,
      metalness: 0.88,
      roughness: 0.35
    });

    const cyanEnergyMat = new THREE.MeshStandardMaterial({
      color: 0x3ef0ff,
      emissive: 0x3ef0ff,
      emissiveIntensity: 3.2,
      roughness: 0.15,
      metalness: 0.4
    });

    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: 0x071e2e,
      metalness: 0.95,
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      emissive: 0x16527a,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.88
    });

    // 1. Sleek needle-like faceted fuselage
    const noseGeom = new THREE.ConeGeometry(0.68, 3.8, 5);
    noseGeom.rotateX(Math.PI / 2);
    noseGeom.rotateY(Math.PI / 5);
    const noseMesh = new THREE.Mesh(noseGeom, aeroArmorMat);
    noseMesh.position.set(0, 0.1, 1.6);
    noseMesh.scale.set(0.9, 0.45, 1.3);
    shipRoot.add(noseMesh);

    // Fuselage center spine
    const spineGeom = new THREE.BoxGeometry(0.95, 0.46, 3.2);
    const spineMesh = new THREE.Mesh(spineGeom, aeroArmorMat);
    spineMesh.position.set(0, 0.15, -0.2);
    shipRoot.add(spineMesh);

    // Cyan glowing spine strip
    const spineGlow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 2.6), cyanEnergyMat);
    spineGlow.position.set(0, 0.39, -0.1);
    shipRoot.add(spineGlow);

    // 2. Cockpit canopy
    const canopyGeom = new THREE.ConeGeometry(0.42, 1.8, 4);
    canopyGeom.rotateX(Math.PI / 2);
    canopyGeom.rotateY(Math.PI / 4);
    const canopyMesh = new THREE.Mesh(canopyGeom, canopyMat);
    canopyMesh.position.set(0, 0.38, 0.45);
    canopyMesh.scale.set(0.85, 0.55, 1.25);
    shipRoot.add(canopyMesh);

    // 3. Cranked-Arrow Swept-Forward Delta Wings
    [-1, 1].forEach((side) => {
      const wingGroup = new THREE.Group();
      wingGroup.position.set(side * 0.45, 0.08, -0.4);

      // Main inner swept wing
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(side * 2.8, -0.8);
      wingShape.lineTo(side * 2.4, -1.8);
      wingShape.lineTo(0, -1.2);
      wingShape.closePath();

      const extrudeSettings = { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 };
      const wingGeom = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
      wingGeom.rotateX(Math.PI / 2);
      const wingMesh = new THREE.Mesh(wingGeom, aeroArmorMat);
      wingGroup.add(wingMesh);

      // Underwing structural panels
      const underWing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.2), darkUnderbodyMat);
      underWing.position.set(side * 1.3, -0.06, -0.8);
      underWing.rotation.y = side * 0.15;
      wingGroup.add(underWing);

      // Wingtip vertical canted winglets
      const wingletGeom = new THREE.BoxGeometry(0.08, 0.95, 0.9);
      const winglet = new THREE.Mesh(wingletGeom, aeroArmorMat);
      winglet.position.set(side * 2.65, 0.45, -1.1);
      winglet.rotation.z = side * -0.32;
      wingGroup.add(winglet);

      // Wingtip glowing cyan beacon
      const tipLight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.6), cyanEnergyMat);
      tipLight.position.set(side * 2.68, 0.45, -1.1);
      wingGroup.add(tipLight);

      // Wing-mounted laser cannons
      const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.2, 8), darkUnderbodyMat);
      cannon.rotation.x = Math.PI / 2;
      cannon.position.set(side * 1.25, -0.08, 1.2);
      wingGroup.add(cannon);

      const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8), cyanEnergyMat);
      emitter.rotation.x = Math.PI / 2;
      emitter.position.set(side * 1.25, -0.08, 2.3);
      wingGroup.add(emitter);

      this.laserMuzzleOffsets.push({ side, x: side * 1.7, y: -0.02, z: 2.8 });

      // Canted dorsal stabilizer fins
      const dorsalFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 1.4), aeroArmorMat);
      dorsalFin.position.set(side * 0.52, 0.65, -1.2);
      dorsalFin.rotation.z = side * -0.25;
      dorsalFin.rotation.x = -0.22;
      wingGroup.add(dorsalFin);

      // Rear Ion Engine Exhaust
      const engineBell = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.8, 16), darkUnderbodyMat);
      engineBell.rotation.x = Math.PI / 2;
      engineBell.position.set(side * 0.48, 0.1, -1.9);
      wingGroup.add(engineBell);

      const engineRing = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.04, 8, 16), cyanEnergyMat);
      engineRing.position.set(side * 0.48, 0.1, -2.3);
      wingGroup.add(engineRing);

      // Dual Thruster Flame (Inner Cyan Jet + Outer Flare)
      const outerFlame = this._createFlameMesh(0.26, 2.2, 0x00c8ff, 0x0055ff);
      outerFlame.position.set(side * 0.48, 0.1, -2.3);
      wingGroup.add(outerFlame);

      const innerFlame = this._createFlameMesh(0.12, 1.4, 0xffffff, 0x88ffff);
      innerFlame.position.set(side * 0.48, 0.1, -2.3);
      wingGroup.add(innerFlame);

      this.thrusterFlames.push({ outer: outerFlame, inner: innerFlame });

      shipRoot.add(wingGroup);
    });

    this.shipMesh = shipRoot;
    this.group.add(shipRoot);
  }

  /**
   * SHIP 2: VOID DREADNOUGHT (Ref Image 2)
   * Heavy armored twin-hull cruiser, dark matte gunmetal stealth plating,
   * broad catamaran prow, massive heavy cannons, glowing orange energy channels.
   */
  _buildVoidDreadnought() {
    const THREE = this.THREE;
    const shipRoot = new THREE.Group();

    const stealthMat = new THREE.MeshStandardMaterial({
      color: 0x141820,
      metalness: 0.92,
      roughness: 0.32,
      envMapIntensity: 1.2
    });

    const armorPlatesMat = new THREE.MeshStandardMaterial({
      color: 0x222a38,
      metalness: 0.85,
      roughness: 0.38
    });

    const orangeEnergyMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff7700,
      emissiveIntensity: 3.0,
      roughness: 0.2
    });

    const cockpitMat = new THREE.MeshPhysicalMaterial({
      color: 0x050c12,
      metalness: 0.95,
      roughness: 0.1,
      clearcoat: 1.0,
      emissive: 0x331800,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });

    // 1. Broad armored central hull
    const centerHull = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.52, 4.4), stealthMat);
    centerHull.position.set(0, 0.18, 0);
    centerHull.castShadow = true;
    shipRoot.add(centerHull);

    // Segmented upper armored deck plates
    const deckPlate = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.18, 3.2), armorPlatesMat);
    deckPlate.position.set(0, 0.45, -0.2);
    shipRoot.add(deckPlate);

    // Orange energy channels along deck
    [-0.55, 0.55].forEach(side => {
      const channel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.8), orangeEnergyMat);
      channel.position.set(side, 0.46, -0.2);
      shipRoot.add(channel);
    });

    // Armored low-profile cockpit
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.8, 4), cockpitMat);
    canopy.rotation.x = Math.PI / 2;
    canopy.rotation.y = Math.PI / 4;
    canopy.position.set(0, 0.48, 1.1);
    canopy.scale.set(0.9, 0.42, 1.2);
    shipRoot.add(canopy);

    // 2. Heavy Outrigger Catamaran Hulls
    const hullSpacing = 1.65;
    [-1, 1].forEach((side) => {
      const hullGroup = new THREE.Group();
      hullGroup.position.set(side * hullSpacing, 0.12, 0);

      // Heavy Outrigger Beam
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.48, 4.2), stealthMat);
      hullGroup.add(beam);

      // Forward Armor Beveled Ram Prow
      const prow = new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.6, 4), armorPlatesMat);
      prow.rotation.x = Math.PI / 2;
      prow.rotation.y = Math.PI / 4;
      prow.position.set(0, 0, 2.8);
      prow.scale.set(0.9, 0.65, 1.2);
      hullGroup.add(prow);

      // Heavy Outboard Rail-Cannons
      const cannonBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.6, 8), armorPlatesMat);
      cannonBarrel.rotation.x = Math.PI / 2;
      cannonBarrel.position.set(side * 0.45, -0.05, 2.2);
      hullGroup.add(cannonBarrel);

      const muzzleShroud = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.4, 8), orangeEnergyMat);
      muzzleShroud.rotation.x = Math.PI / 2;
      muzzleShroud.position.set(side * 0.45, -0.05, 3.4);
      hullGroup.add(muzzleShroud);

      this.laserMuzzleOffsets.push({ side, x: side * (hullSpacing + 0.45), y: 0.05, z: 3.5 });

      // Cross-connect armor bridges
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(hullSpacing, 0.22, 1.4), stealthMat);
      bridge.position.set(-side * (hullSpacing / 2), 0.08, -0.4);
      hullGroup.add(bridge);

      // Heavy Rear Fusion Drive
      const thrusterBell = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.9, 16), armorPlatesMat);
      thrusterBell.rotation.x = Math.PI / 2;
      thrusterBell.position.set(0, 0, -2.4);
      hullGroup.add(thrusterBell);

      const thrusterGlow = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 16), orangeEnergyMat);
      thrusterGlow.position.set(0, 0, -2.85);
      hullGroup.add(thrusterGlow);

      // Thruster Plasma Flare
      const outerFlame = this._createFlameMesh(0.35, 2.6, 0xff5500, 0xff2200);
      outerFlame.position.set(0, 0, -2.85);
      hullGroup.add(outerFlame);

      const innerFlame = this._createFlameMesh(0.18, 1.8, 0xffe066, 0xff8800);
      innerFlame.position.set(0, 0, -2.85);
      hullGroup.add(innerFlame);

      this.thrusterFlames.push({ outer: outerFlame, inner: innerFlame });

      shipRoot.add(hullGroup);
    });

    this.shipMesh = shipRoot;
    this.group.add(shipRoot);
  }

  /**
   * SHIP 3: CRIMSON INTERCEPTOR (Ref Image 3)
   * Tactical fighter with brushed titanium chassis, racing crimson energy strips,
   * elongated tapered nose, twin circular VTOL thruster rings, and triple lasers.
   */
  _buildCrimsonInterceptor() {
    const THREE = this.THREE;
    const shipRoot = new THREE.Group();

    const silverAlloyMat = new THREE.MeshStandardMaterial({
      color: 0xabb8c6,
      metalness: 0.88,
      roughness: 0.25,
      envMapIntensity: 1.4
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x242830,
      metalness: 0.85,
      roughness: 0.4
    });

    const crimsonRacingMat = new THREE.MeshStandardMaterial({
      color: 0xd90429,
      emissive: 0xff1744,
      emissiveIntensity: 2.8,
      roughness: 0.22
    });

    const cockpitMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1215,
      metalness: 0.92,
      roughness: 0.08,
      clearcoat: 1.0,
      emissive: 0x4a0a16,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.9
    });

    // 1. Elongated Tapered Titanium Needle Nose
    const noseGeom = new THREE.ConeGeometry(0.62, 4.2, 5);
    noseGeom.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeom, silverAlloyMat);
    nose.position.set(0, 0.1, 1.4);
    nose.scale.set(0.85, 0.45, 1.3);
    shipRoot.add(nose);

    // Crimson nose racing stripe
    const noseStripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 2.8), crimsonRacingMat);
    noseStripe.position.set(0, 0.32, 1.4);
    shipRoot.add(noseStripe);

    // Center Nose Needle Cannon
    const noseGun = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.0, 8), darkTrimMat);
    noseGun.rotation.x = Math.PI / 2;
    noseGun.position.set(0, -0.04, 3.2);
    shipRoot.add(noseGun);
    this.laserMuzzleOffsets.push({ side: 0, x: 0, y: -0.04, z: 4.2 });

    // Mid Cockpit
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.44, 1.6, 4), cockpitMat);
    canopy.rotation.x = Math.PI / 2;
    canopy.rotation.y = Math.PI / 4;
    canopy.position.set(0, 0.38, 0.3);
    canopy.scale.set(0.85, 0.52, 1.2);
    shipRoot.add(canopy);

    // 2. Wings, Dual Circular VTOL Thruster Rings & Outboard Guns
    [-1, 1].forEach((side) => {
      const wingGroup = new THREE.Group();
      wingGroup.position.set(side * 0.7, 0.1, -0.3);

      // Swept wing body
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 1.4), silverAlloyMat);
      wing.position.set(side * 0.8, 0, -0.4);
      wing.rotation.y = side * 0.18;
      wingGroup.add(wing);

      // Crimson wing highlight strip
      const wingStripe = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.22), crimsonRacingMat);
      wingStripe.position.set(side * 0.8, 0.07, -0.4);
      wingGroup.add(wingStripe);

      // Unique Circular VTOL / Lift Turbine Rings
      const ringTorus = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.1, 12, 24), crimsonRacingMat);
      ringTorus.rotation.x = Math.PI / 2;
      ringTorus.position.set(side * 1.35, 0.05, -0.9);
      wingGroup.add(ringTorus);

      const turbineCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.2, 12), darkTrimMat);
      turbineCenter.position.set(side * 1.35, 0.05, -0.9);
      wingGroup.add(turbineCenter);

      // Forward Wing Pylon Cannons
      const wingCannon = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), darkTrimMat);
      wingCannon.rotation.x = Math.PI / 2;
      wingCannon.position.set(side * 1.65, 0, 0.6);
      wingGroup.add(wingCannon);

      const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 16), crimsonRacingMat);
      muzzleRing.position.set(side * 1.65, 0, 1.8);
      wingGroup.add(muzzleRing);

      this.laserMuzzleOffsets.push({ side, x: side * 2.35, y: 0.1, z: 2.2 });

      // Angled Twin Tailfins
      const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.9), silverAlloyMat);
      tailFin.position.set(side * 0.42, 0.65, -1.3);
      tailFin.rotation.z = side * -0.28;
      tailFin.rotation.x = -0.25;
      wingGroup.add(tailFin);

      // Main Rear Thrusters
      const thrusterBell = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.7, 16), darkTrimMat);
      thrusterBell.rotation.x = Math.PI / 2;
      thrusterBell.position.set(side * 0.38, 0.02, -1.8);
      wingGroup.add(thrusterBell);

      const outerFlame = this._createFlameMesh(0.26, 2.0, 0xff1744, 0xff5500);
      outerFlame.position.set(side * 0.38, 0.02, -2.15);
      wingGroup.add(outerFlame);

      const innerFlame = this._createFlameMesh(0.12, 1.3, 0xffffff, 0xff88aa);
      innerFlame.position.set(side * 0.38, 0.02, -2.15);
      wingGroup.add(innerFlame);

      this.thrusterFlames.push({ outer: outerFlame, inner: innerFlame });

      shipRoot.add(wingGroup);
    });

    this.shipMesh = shipRoot;
    this.group.add(shipRoot);
  }

  _createFlameMesh(radius, length, colorCore, colorOuter) {
    const THREE = this.THREE;
    const geom = new THREE.ConeGeometry(radius, length, 16, 1, true);
    geom.rotateX(-Math.PI / 2);
    geom.translate(0, 0, -length / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: colorCore,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    return new THREE.Mesh(geom, mat);
  }

  update(dt, input, time) {
    // 1. RECHARGE & TIMERS
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      if (this.shieldMesh) this.shieldMesh.material.opacity = 0.85;
    }

    if (this.weaponLevelTimer > 0) {
      this.weaponLevelTimer -= dt;
      if (this.weaponLevelTimer <= 0) this.weaponLevel = 1;
    }

    if (this.isBoosting) {
      this.energy = Math.max(0, this.energy - this.boostDrainRate * dt);
      if (this.energy <= 0) this.isBoosting = false;
    } else {
      this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * dt);
    }

    // Shield Auto-Recharge out of combat
    if (time - this.lastDamageTime > this.shieldRegenDelay && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * dt);
    }

    // Weapon Heat dissipation
    this.heat = Math.max(0, this.heat - this.coolRate * dt);
    if (this.overheated && this.heat <= 0.05) this.overheated = false;

    // Shield mesh fade
    if (this.shieldMesh && this.shieldMesh.material.opacity > 0 && this.invulnerableTimer <= 0) {
      this.shieldMesh.material.opacity = Math.max(0, this.shieldMesh.material.opacity - dt * 2.5);
    }

    // 2. FLIGHT PHYSICS & STEERING
    const boostActive = input.boost && this.energy > 5;
    this.isBoosting = boostActive;
    const maxSpeed = boostActive ? this.config.boostSpeed : this.config.maxSpeed;

    // Heading calculation: Shortest angle interpolation to avoid gimbal locks
    let angleDiff = Math.atan2(Math.sin(this.targetHeading - this.heading), Math.cos(this.targetHeading - this.heading));
    const smoothFactor = 1 - Math.exp(-this.config.turnRate * dt);
    this.heading += angleDiff * smoothFactor;

    // Banking (Roll) based on angular turning velocity
    const targetRoll = -angleDiff * 0.95;
    this.roll += (targetRoll - this.roll) * (1 - Math.exp(-this.config.rollRate * dt));

    // Pitch based on forward throttle
    const forwardThrust = input.thrust;
    const targetPitch = forwardThrust * (boostActive ? 0.14 : 0.07);
    this.pitch += (targetPitch - this.pitch) * (1 - Math.exp(-8.0 * dt));

    // Forward Direction Vector in Open Cosmic Space
    const forwardX = Math.sin(this.heading);
    const forwardZ = Math.cos(this.heading);

    // Apply Acceleration
    if (forwardThrust > 0) {
      const accel = this.config.accelRate * (boostActive ? 1.85 : 1.0) * forwardThrust;
      this.velocity.x += forwardX * accel * dt;
      this.velocity.z += forwardZ * accel * dt;
    } else if (forwardThrust < 0) {
      // Reverse / Airbrake
      this.velocity.x -= forwardX * 65.0 * dt;
      this.velocity.z -= forwardZ * 65.0 * dt;
    }

    // Velocity Clamping & Cosmic Friction
    const currentSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (currentSpeed > maxSpeed) {
      const scale = maxSpeed / currentSpeed;
      this.velocity.x *= scale;
      this.velocity.z *= scale;
    }

    if (forwardThrust === 0) {
      const dragFactor = Math.pow(0.985, dt * 60);
      this.velocity.x *= dragFactor;
      this.velocity.z *= dragFactor;
    }

    // Infinite 360-degree open movement
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    // Synchronize 3D Transforms
    this.group.position.set(this.position.x, 0, this.position.z);
    this.group.rotation.y = this.heading;
    this.shipMesh.rotation.z = this.roll;
    this.shipMesh.rotation.x = this.pitch;

    // 3. Thruster Flame Scaling
    const speedRatio = Math.min(1.0, currentSpeed / this.config.maxSpeed);
    const flameScale = 0.5 + speedRatio * 0.8 + (boostActive ? 1.4 : 0) + Math.sin(time * 35) * 0.14;

    this.thrusterFlames.forEach(({ outer, inner }) => {
      outer.scale.set(1.0 + (boostActive ? 0.35 : 0), 1.0 + (boostActive ? 0.35 : 0), flameScale);
      inner.scale.set(1.0, 1.0, flameScale * 1.15);
      outer.visible = speedRatio > 0.05 || forwardThrust > 0 || boostActive;
      inner.visible = outer.visible;
    });

    // Gentle floating idle bobbing
    this.shipMesh.position.y = Math.sin(time * 2.4) * 0.08;
  }

  takeDamage(amount, time) {
    if (this.invulnerableTimer > 0) return { isFatal: false, hitShield: true };

    this.lastDamageTime = time;
    if (this.shieldMesh) this.shieldMesh.material.opacity = 0.9;

    if (this.shield > 0) {
      if (this.shield >= amount) {
        this.shield -= amount;
        return { isFatal: false, hitShield: true };
      } else {
        const overflow = amount - this.shield;
        this.shield = 0;
        this.hull = Math.max(0, this.hull - overflow);
      }
    } else {
      this.hull = Math.max(0, this.hull - amount);
    }

    return { isFatal: this.hull <= 0, hitShield: false };
  }

  repairShield(amount) {
    this.shield = Math.min(this.maxShield, this.shield + amount);
    if (this.shieldMesh) this.shieldMesh.material.opacity = 0.6;
  }

  repairHull(amount) {
    this.hull = Math.min(this.maxHull, this.hull + amount);
  }

  applyOvercharge() {
    this.shield = this.maxShield;
    this.invulnerableTimer = 6.0; // 6 seconds invulnerability
    if (this.shieldMesh) this.shieldMesh.material.opacity = 1.0;
  }

  upgradeWeapons() {
    this.weaponLevel = Math.min(3, this.weaponLevel + 1);
    this.weaponLevelTimer = 18.0; // 18 seconds weapon power boost
  }

  canFire(time) {
    const effectiveInterval = this.weaponLevel >= 3 ? this.fireInterval * 0.75 : this.fireInterval;
    return !this.overheated && (time - this.lastFireTime >= effectiveInterval);
  }

  recordShot(time) {
    this.lastFireTime = time;
    this.heat = Math.min(1.0, this.heat + 0.045);
    if (this.heat >= 1.0) this.overheated = true;
  }

  getLaserSpawns() {
    const cosH = Math.cos(this.heading);
    const sinH = Math.sin(this.heading);
    const speed = 175;

    const baseSpawns = this.laserMuzzleOffsets.map(offset => {
      const worldX = this.position.x + (offset.x * cosH + offset.z * sinH);
      const worldZ = this.position.z + (-offset.x * sinH + offset.z * cosH);
      return {
        x: worldX,
        y: offset.y,
        z: worldZ,
        vx: sinH * speed + this.velocity.x * 0.35,
        vz: cosH * speed + this.velocity.z * 0.35,
        heading: this.heading,
        color: this.config.laserColor
      };
    });

    // Weapon Level 3: Quad / Triple Spread Volley
    if (this.weaponLevel >= 2) {
      const spreadAngle = 0.12;
      const leftSpread = {
        ...baseSpawns[0],
        vx: Math.sin(this.heading - spreadAngle) * speed + this.velocity.x * 0.35,
        vz: Math.cos(this.heading - spreadAngle) * speed + this.velocity.z * 0.35,
        heading: this.heading - spreadAngle
      };
      const rightSpread = {
        ...baseSpawns[baseSpawns.length - 1],
        vx: Math.sin(this.heading + spreadAngle) * speed + this.velocity.x * 0.35,
        vz: Math.cos(this.heading + spreadAngle) * speed + this.velocity.z * 0.35,
        heading: this.heading + spreadAngle
      };
      return [...baseSpawns, leftSpread, rightSpread];
    }

    return baseSpawns;
  }
}
