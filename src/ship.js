/**
 * Photorealistic Starfighter Models & Flight Controller
 * Sculpted with high-detail extruded aerospace geometries, chamfered beveled armor,
 * authentic PBR materials, and faithful 1:1 engineering based on user reference designs:
 * 1. Void Dreadnought: Heavy Armored Stealth Twin-Hull Warship
 * 2. Aether Vanguard: High-Agility Cranked-Delta Interceptor
 * 3. Crimson Interceptor: Tactical Strike Fighter with Dual VTOL Turbine Rings
 */
import { SHIP_IMAGES, createProceduralPanelTexture, createProceduralNormalMap, createProceduralRoughnessMap } from './textures.js';

export const SHIP_CONFIGS = {
  dreadnought: {
    id: 'dreadnought',
    name: 'VOID DREADNOUGHT',
    type: 'Heavy Twin-Hull Warship',
    image: SHIP_IMAGES.dreadnought,
    description: 'Monolithic stealth combat warship with multi-tiered composite armor plating, dual outboard catamaran hulls, and forward-facing heavy kinetic railguns.',
    maxSpeed: 45,
    boostSpeed: 100,
    accelRate: 48,
    turnRate: 5.4,
    rollRate: 7.2,
    maxShield: 140,
    maxHull: 160,
    shieldRegenRate: 16,
    boostDrainRate: 32,
    fireInterval: 0.16,
    primaryColor: 0xff7700,
    engineGlow: 0xff5500,
    laserColor: 0xff8800,
    weaponType: 'heavy_dual',
    stats: { speed: 70, agility: 62, shields: 98, hull: 100, firepower: 96 }
  },
  aether: {
    id: 'aether',
    name: 'AETHER VANGUARD',
    type: 'High-Agility Interceptor',
    image: SHIP_IMAGES.aether,
    description: 'Sleek aerodynamic spaceframe with cranked-arrow delta wings, canted dorsal stabilizers, downturned winglet fences, and twin blue plasma bolters.',
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
  crimson: {
    id: 'crimson',
    name: 'CRIMSON INTERCEPTOR',
    type: 'Tactical Strike Fighter',
    image: SHIP_IMAGES.crimson,
    description: 'Advanced strike fighter crafted with brushed titanium armor, racing crimson cowlings, twin circular VTOL turbine rings, and triple pulse lasers.',
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

/** Helper to generate symmetric extruded 3D wing/fuselage shapes */
function createSymmetricExtrudedMesh(THREE, halfPoints, options, material) {
  const shape = new THREE.Shape();
  shape.moveTo(halfPoints[0][0], halfPoints[0][1]);
  for (let i = 1; i < halfPoints.length; i++) {
    shape.lineTo(halfPoints[i][0], halfPoints[i][1]);
  }
  for (let i = halfPoints.length - 1; i >= 0; i--) {
    shape.lineTo(-halfPoints[i][0], halfPoints[i][1]);
  }
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: options.depth || 0.25,
    bevelEnabled: options.bevel !== false,
    bevelSegments: options.bevelSegments || 3,
    bevelSize: options.bevelSize || 0.05,
    bevelThickness: options.bevelThickness || 0.05
  });

  geom.rotateX(Math.PI / 2);
  geom.translate(0, (options.depth || 0.25) / 2, 0);
  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export class Starfighter {
  constructor(scene, THREE, shipType = 'dreadnought') {
    this.scene = scene;
    this.THREE = THREE;
    this.config = SHIP_CONFIGS[shipType] || SHIP_CONFIGS.dreadnought;
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
    this.invulnerableTimer = 0;

    // Weapon Upgrades
    this.weaponLevel = 1;
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
    this.laserMuzzleOffsets = [];
    this.shieldMesh = null;

    this._buildShipModel();
    this.scene.add(this.group);
  }

  _buildShipModel() {
    const THREE = this.THREE;
    const type = this.shipType;

    if (type === 'dreadnought') {
      this._buildVoidDreadnought();
    } else if (type === 'aether') {
      this._buildAetherVanguard();
    } else {
      this._buildCrimsonInterceptor();
    }

    // Reactive Holographic Shield Bubble
    const shieldGeom = new THREE.IcosahedronGeometry(3.6, 2);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: this.config.primaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    this.shieldMesh.scale.set(1.25, 0.65, 1.45);
    this.group.add(this.shieldMesh);
  }

  /**
   * SHIP 1: VOID DREADNOUGHT (Ref Image 1)
   * Heavy Armored Stealth Twin-Hull Warship
   * - Stealth beveled multi-facet fuselage
   * - Catamaran outboard sponsons with kinetic railguns
   * - Canted outer stabilizers & obsidian faceted canopy
   */
  _buildVoidDreadnought() {
    const THREE = this.THREE;
    const shipRoot = new THREE.Group();

    // PBR Textures
    const panelTex = createProceduralPanelTexture(THREE, '#151b24', '#090d13', '#1c2635');
    const normalMap = createProceduralNormalMap(THREE);
    const roughnessMap = createProceduralRoughnessMap(THREE, 0.32);

    const stealthMat = new THREE.MeshStandardMaterial({
      color: 0x181e28,
      map: panelTex,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
      metalness: 0.88,
      roughness: 0.32,
      envMapIntensity: 1.6
    });

    const armorPlatesMat = new THREE.MeshStandardMaterial({
      color: 0x242e3d,
      map: panelTex,
      normalMap: normalMap,
      metalness: 0.92,
      roughness: 0.28,
      envMapIntensity: 1.8
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0f131a,
      metalness: 0.85,
      roughness: 0.45
    });

    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: 0x050c12,
      metalness: 0.96,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      emissive: 0x1f1000,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.94
    });

    const amberEnergyMat = new THREE.MeshStandardMaterial({
      color: 0xff7700,
      emissive: 0xff7700,
      emissiveIntensity: 3.5,
      roughness: 0.15
    });

    // 1. Center Fuselage Lifting Body (Extruded Chamfered Armor)
    const centerProfile = [
      [0, 2.8],
      [0.6, 1.8],
      [1.1, 0.6],
      [1.3, -0.8],
      [1.1, -2.0],
      [0.5, -2.3],
      [0, -2.1]
    ];
    const mainHull = createSymmetricExtrudedMesh(THREE, centerProfile, {
      depth: 0.36,
      bevelThickness: 0.07,
      bevelSize: 0.07,
      bevelSegments: 3
    }, stealthMat);
    mainHull.position.y = 0.02;
    shipRoot.add(mainHull);

    // 2. Chiseled Stealth Beak / Prow Wedge
    const beakProfile = [
      [0, 3.4],
      [0.45, 2.0],
      [0.65, 0.8],
      [0, 0.8]
    ];
    const prow = createSymmetricExtrudedMesh(THREE, beakProfile, {
      depth: 0.26,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 3
    }, armorPlatesMat);
    prow.position.y = 0.14;
    shipRoot.add(prow);

    // 3. Raised Dorsal Spine Armor
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, 2.8), armorPlatesMat);
    spine.position.set(0, 0.32, -0.1);
    shipRoot.add(spine);

    // 4. Faceted Cockpit Canopy Glass
    const canopyGeom = new THREE.ConeGeometry(0.42, 1.8, 4);
    canopyGeom.rotateX(Math.PI / 2);
    canopyGeom.rotateY(Math.PI / 4);
    const canopy = new THREE.Mesh(canopyGeom, canopyMat);
    canopy.position.set(0, 0.38, 1.1);
    canopy.scale.set(0.85, 0.42, 1.3);
    shipRoot.add(canopy);

    // Canopy armored frame
    const canopyFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 1.6), darkTrimMat);
    canopyFrame.position.set(0, 0.42, 1.0);
    shipRoot.add(canopyFrame);

    // 5. Outboard Catamaran Sponsons & Forward Railguns (Left & Right)
    [-1, 1].forEach(side => {
      const outriggerGroup = new THREE.Group();
      outriggerGroup.position.set(side * 1.9, 0, 0);

      const sponson = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.34, 4.2), stealthMat);
      sponson.position.set(0, 0.1, -0.2);
      outriggerGroup.add(sponson);

      // Upper armored sponson ridge
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 3.4), armorPlatesMat);
      ridge.position.set(0, 0.32, -0.3);
      outriggerGroup.add(ridge);

      // Kinetic Railgun Barrel Housing
      const railgunBody = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 2.6), darkTrimMat);
      railgunBody.position.set(0, 0.1, 1.8);
      outriggerGroup.add(railgunBody);

      // Twin Railgun Barrels
      const rail1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8), darkTrimMat);
      rail1.rotation.x = Math.PI / 2;
      rail1.position.set(-0.09, 0.1, 2.6);
      outriggerGroup.add(rail1);

      const rail2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8), darkTrimMat);
      rail2.rotation.x = Math.PI / 2;
      rail2.position.set(0.09, 0.1, 2.6);
      outriggerGroup.add(rail2);

      // Amber magnetic charging coils
      [1.8, 2.4, 3.0].forEach(zPos => {
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 16), amberEnergyMat);
        coil.position.set(0, 0.1, zPos);
        outriggerGroup.add(coil);
      });

      this.laserMuzzleOffsets.push({ side, x: side * 1.9, y: 0.1, z: 3.9 });

      // Canted Outer Stealth Fin
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 1.2), armorPlatesMat);
      fin.position.set(side * 0.42, 0.65, -1.5);
      fin.rotation.z = side * -0.32;
      fin.rotation.x = -0.22;
      outriggerGroup.add(fin);

      // Amber navigation indicator
      const navGlow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.4), amberEnergyMat);
      navGlow.position.set(side * 0.46, 0.1, 0.2);
      outriggerGroup.add(navGlow);

      shipRoot.add(outriggerGroup);
    });

    // 6. Rear Engine Exhaust Nozzles
    [-0.55, 0.55].forEach(xOffset => {
      const exhaustBell = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.36, 0.8, 16), darkTrimMat);
      exhaustBell.rotation.x = Math.PI / 2;
      exhaustBell.position.set(xOffset, 0.1, -2.3);
      shipRoot.add(exhaustBell);

      const interiorGlow = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 16), amberEnergyMat);
      interiorGlow.position.set(xOffset, 0.1, -2.6);
      shipRoot.add(interiorGlow);

      // Exhaust Flames (Hidden while idle/in hangar, trailing backward to -Z)
      const outerFlame = this._createFlameMesh(0.26, 2.2, 0xff6600);
      outerFlame.position.set(xOffset, 0.1, -2.6);
      shipRoot.add(outerFlame);

      const innerFlame = this._createFlameMesh(0.12, 1.4, 0xffd278);
      innerFlame.position.set(xOffset, 0.1, -2.6);
      shipRoot.add(innerFlame);

      this.thrusterFlames.push({ outer: outerFlame, inner: innerFlame });
    });

    this.shipMesh = shipRoot;
    this.group.add(shipRoot);
  }

  /**
   * SHIP 2: AETHER VANGUARD (Ref Image 2)
   * High-Agility Cranked-Delta Interceptor
   * - Swept cranked-arrow delta wings with downturned anhedral winglets
   * - Supersonic needle prow & blended lifting body
   * - Cobalt bubble canopy & dual cyan plasma ion engines
   */
  _buildAetherVanguard() {
    const THREE = this.THREE;
    const shipRoot = new THREE.Group();

    const panelTex = createProceduralPanelTexture(THREE, '#7ca8ca', '#466e8c', '#9bcbf0');
    const normalMap = createProceduralNormalMap(THREE);
    const roughnessMap = createProceduralRoughnessMap(THREE, 0.22);

    const aeroWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xd8e8f5,
      map: panelTex,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
      metalness: 0.72,
      roughness: 0.20,
      envMapIntensity: 1.8
    });

    const navalBlueMat = new THREE.MeshStandardMaterial({
      color: 0x1b344c,
      map: panelTex,
      normalMap: normalMap,
      metalness: 0.85,
      roughness: 0.28,
      envMapIntensity: 1.6
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x121c26,
      metalness: 0.88,
      roughness: 0.38
    });

    const cyanPlasmaMat = new THREE.MeshStandardMaterial({
      color: 0x3ef0ff,
      emissive: 0x3ef0ff,
      emissiveIntensity: 3.5,
      roughness: 0.15
    });

    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: 0x061a2b,
      metalness: 0.94,
      roughness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      emissive: 0x12486c,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.90
    });

    // 1. Cranked-Arrow Delta Wing Planform
    const wingProfile = [
      [0, 3.4],
      [0.6, 2.0],
      [1.7, 0.6],
      [3.2, -0.9],
      [1.8, -1.6],
      [0.6, -2.4],
      [0, -2.0]
    ];
    const mainWings = createSymmetricExtrudedMesh(THREE, wingProfile, {
      depth: 0.28,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 3
    }, aeroWhiteMat);
    mainWings.position.y = 0.02;
    shipRoot.add(mainWings);

    // 2. Supersonic Needle Nose & Center Chine Body
    const noseProfile = [
      [0, 3.8],
      [0.35, 2.4],
      [0.65, 0.8],
      [0, 0.8]
    ];
    const needleNose = createSymmetricExtrudedMesh(THREE, noseProfile, {
      depth: 0.24,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3
    }, navalBlueMat);
    needleNose.position.y = 0.14;
    shipRoot.add(needleNose);

    // Forward Pitot Probe / Vane
    const pitot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.2, 8), darkTrimMat);
    pitot.rotation.x = Math.PI / 2;
    pitot.position.set(0, 0.14, 4.2);
    shipRoot.add(pitot);

    // 3. Blended Dorsal Spine
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 3.2), navalBlueMat);
    spine.position.set(0, 0.28, -0.2);
    shipRoot.add(spine);

    // 4. Cobalt Glass Teardrop Canopy
    const canopyGeom = new THREE.ConeGeometry(0.38, 1.9, 5);
    canopyGeom.rotateX(Math.PI / 2);
    canopyGeom.rotateY(Math.PI / 5);
    const canopy = new THREE.Mesh(canopyGeom, canopyMat);
    canopy.position.set(0, 0.38, 0.9);
    canopy.scale.set(0.85, 0.48, 1.3);
    shipRoot.add(canopy);

    // 5. Down-Turned Anhedral Winglet Fences & Outboard Plasma Bolters
    [-1, 1].forEach(side => {
      // Down-turned winglet fence
      const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 1.4), navalBlueMat);
      winglet.position.set(side * 3.2, -0.15, -0.9);
      winglet.rotation.z = side * 0.25;
      winglet.rotation.x = -0.15;
      shipRoot.add(winglet);

      // Canted Dorsal Stabilizer
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.15, 1.3), aeroWhiteMat);
      fin.position.set(side * 0.65, 0.75, -1.3);
      fin.rotation.z = side * -0.25;
      fin.rotation.x = -0.22;
      shipRoot.add(fin);

      // Under-wing Plasma Bolter Pylon
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), darkTrimMat);
      pylon.rotation.x = Math.PI / 2;
      pylon.position.set(side * 1.6, 0.04, 1.4);
      shipRoot.add(pylon);

      const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8), cyanPlasmaMat);
      emitter.rotation.x = Math.PI / 2;
      emitter.position.set(side * 1.6, 0.04, 2.5);
      shipRoot.add(emitter);

      this.laserMuzzleOffsets.push({ side, x: side * 1.6, y: 0.04, z: 2.6 });
    });

    // 6. Dual Ion Turbine Exhausts
    [-0.42, 0.42].forEach(xOffset => {
      const engineBell = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.8, 16), darkTrimMat);
      engineBell.rotation.x = Math.PI / 2;
      engineBell.position.set(xOffset, 0.1, -2.3);
      shipRoot.add(engineBell);

      const ionRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 16), cyanPlasmaMat);
      ionRing.position.set(xOffset, 0.1, -2.6);
      shipRoot.add(ionRing);

      const outerFlame = this._createFlameMesh(0.24, 2.4, 0x00c8ff);
      outerFlame.position.set(xOffset, 0.1, -2.6);
      shipRoot.add(outerFlame);

      const innerFlame = this._createFlameMesh(0.12, 1.5, 0xffffff);
      innerFlame.position.set(xOffset, 0.1, -2.6);
      shipRoot.add(innerFlame);

      this.thrusterFlames.push({ outer: outerFlame, inner: innerFlame });
    });

    this.shipMesh = shipRoot;
    this.group.add(shipRoot);
  }

  /**
   * SHIP 3: CRIMSON INTERCEPTOR (Ref Image 3)
   * Tactical Strike Fighter with Brushed Titanium & Dual VTOL Rings
   * - Swept titanium wings with beveled chamfers
   * - Twin circular VTOL lift turbine rings with 8-blade rotors & red cowlings
   * - Long needle nose with underslung rotary cannon
   * - Stepped ruby cockpit & canted tailfins
   */
  _buildCrimsonInterceptor() {
    const THREE = this.THREE;
    const shipRoot = new THREE.Group();

    const panelTex = createProceduralPanelTexture(THREE, '#9ba8b8', '#647280', '#afbac8');
    const normalMap = createProceduralNormalMap(THREE);
    const roughnessMap = createProceduralRoughnessMap(THREE, 0.24);

    const silverAlloyMat = new THREE.MeshStandardMaterial({
      color: 0xabb8c6,
      map: panelTex,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
      metalness: 0.88,
      roughness: 0.26,
      envMapIntensity: 1.8
    });

    const crimsonRacingMat = new THREE.MeshStandardMaterial({
      color: 0xd90429,
      emissive: 0xff1744,
      emissiveIntensity: 1.4,
      metalness: 0.65,
      roughness: 0.20,
      envMapIntensity: 1.5
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x1f232b,
      metalness: 0.86,
      roughness: 0.40
    });

    const cockpitMat = new THREE.MeshPhysicalMaterial({
      color: 0x181014,
      metalness: 0.94,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      emissive: 0x4a0a16,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.92
    });

    // 1. Tactical Swept Wings & Main Chassis
    const wingProfile = [
      [0, 2.6],
      [0.7, 1.4],
      [1.5, 0.4],
      [2.2, 0.2],
      [2.8, -0.6],
      [1.6, -1.3],
      [0.6, -2.1],
      [0, -1.9]
    ];
    const mainWings = createSymmetricExtrudedMesh(THREE, wingProfile, {
      depth: 0.30,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 3
    }, silverAlloyMat);
    mainWings.position.y = 0.02;
    shipRoot.add(mainWings);

    // 2. Elongated Chisel Needle Nose (Ref Image 3)
    const noseProfile = [
      [0, 3.4],
      [0.32, 2.2],
      [0.6, 0.8],
      [0, 0.8]
    ];
    const needleNose = createSymmetricExtrudedMesh(THREE, noseProfile, {
      depth: 0.26,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3
    }, silverAlloyMat);
    needleNose.position.y = 0.12;
    shipRoot.add(needleNose);

    // Underslung Centerline Rotary Cannon
    const noseGun = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 8), darkTrimMat);
    noseGun.rotation.x = Math.PI / 2;
    noseGun.position.set(0, -0.06, 3.4);
    shipRoot.add(noseGun);

    const gunMuzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.35, 8), darkTrimMat);
    gunMuzzle.rotation.x = Math.PI / 2;
    gunMuzzle.position.set(0, -0.06, 4.6);
    shipRoot.add(gunMuzzle);

    this.laserMuzzleOffsets.push({ side: 0, x: 0, y: -0.06, z: 4.7 });

    // 3. Side Air Intake Cowlings with Crimson Trims
    [-1, 1].forEach(side => {
      const intake = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 1.2), crimsonRacingMat);
      intake.position.set(side * 0.58, 0.20, 0.6);
      intake.rotation.y = side * 0.12;
      shipRoot.add(intake);
    });

    // 4. Stepped Cockpit Canopy
    const canopyGeom = new THREE.ConeGeometry(0.40, 1.7, 4);
    canopyGeom.rotateX(Math.PI / 2);
    canopyGeom.rotateY(Math.PI / 4);
    const canopy = new THREE.Mesh(canopyGeom, cockpitMat);
    canopy.position.set(0, 0.36, 0.5);
    canopy.scale.set(0.85, 0.48, 1.2);
    shipRoot.add(canopy);

    // 5. THE DUAL CIRCULAR VTOL TURBINE RINGS (Direct Match to Ref Image 3!)
    [-1, 1].forEach(side => {
      const vtolGroup = new THREE.Group();
      vtolGroup.position.set(side * 1.45, 0.18, -0.7);

      // Outer Crimson Aerodynamic Ring Cowling
      const ringCowling = new THREE.Mesh(new THREE.TorusGeometry(0.50, 0.09, 16, 32), crimsonRacingMat);
      ringCowling.rotation.x = Math.PI / 2;
      vtolGroup.add(ringCowling);

      // Dark Interior Duct Shroud
      const innerDuct = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.22, 24, 1, true), darkTrimMat);
      vtolGroup.add(innerDuct);

      // Center Hub Axle Spinner
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.26, 16), darkTrimMat);
      vtolGroup.add(axle);

      // 8 Real 3D Fan Rotor Blades inside the Ring!
      for (let b = 0; b < 8; b++) {
        const theta = (b / 8) * Math.PI * 2;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.32), darkTrimMat);
        blade.position.set(Math.cos(theta) * 0.28, 0, Math.sin(theta) * 0.28);
        blade.rotation.y = -theta + 0.35;
        blade.rotation.x = 0.4;
        vtolGroup.add(blade);
      }

      shipRoot.add(vtolGroup);

      // Forward Wing Cannon Pylons (Ref Image 3)
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 2.2), silverAlloyMat);
      pylon.position.set(side * 1.85, 0.08, 1.2);
      shipRoot.add(pylon);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), darkTrimMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(side * 1.85, 0.08, 2.2);
      shipRoot.add(barrel);

      const redMuzzle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 16), crimsonRacingMat);
      redMuzzle.position.set(side * 1.85, 0.08, 3.3);
      shipRoot.add(redMuzzle);

      this.laserMuzzleOffsets.push({ side, x: side * 1.85, y: 0.08, z: 3.4 });

      // Canted Angular Twin Tailfins
      const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.15, 0.9), silverAlloyMat);
      tailFin.position.set(side * 0.45, 0.70, -1.3);
      tailFin.rotation.z = side * -0.28;
      tailFin.rotation.x = -0.24;
      shipRoot.add(tailFin);

      // Crimson fin cap
      const finCap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.7), crimsonRacingMat);
      finCap.position.set(side * 0.62, 1.18, -1.4);
      finCap.rotation.z = side * -0.28;
      finCap.rotation.x = -0.24;
      shipRoot.add(finCap);

      // Rear Jet Exhaust Nozzle
      const thrusterBell = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.30, 0.7, 16), darkTrimMat);
      thrusterBell.rotation.x = Math.PI / 2;
      thrusterBell.position.set(side * 0.38, 0.1, -2.0);
      shipRoot.add(thrusterBell);

      const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 16), crimsonRacingMat);
      glowRing.position.set(side * 0.38, 0.1, -2.3);
      shipRoot.add(glowRing);

      const outerFlame = this._createFlameMesh(0.24, 2.0, 0xff1744);
      outerFlame.position.set(side * 0.38, 0.1, -2.35);
      shipRoot.add(outerFlame);

      const innerFlame = this._createFlameMesh(0.12, 1.3, 0xffffff);
      innerFlame.position.set(side * 0.38, 0.1, -2.35);
      shipRoot.add(innerFlame);

      this.thrusterFlames.push({ outer: outerFlame, inner: innerFlame });
    });

    this.shipMesh = shipRoot;
    this.group.add(shipRoot);
  }

  _createFlameMesh(radius, length, colorCore) {
    const THREE = this.THREE;
    const geom = new THREE.ConeGeometry(radius, length, 16);
    // Exhaust cone points backward towards -Z!
    geom.rotateX(-Math.PI / 2);
    geom.translate(0, 0, -length / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: colorCore,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.visible = false; // Idle in hangar, ignited in flight!
    return mesh;
  }

  update(dt, inputState, worldBounds = null) {
    const THREE = this.THREE;
    const time = performance.now() * 0.001;

    // Recharge Shield Delay
    if (time - this.lastDamageTime > this.shieldRegenDelay && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * dt);
    }

    // Energy / Boost Handling
    const boostRequested = (inputState.boost || inputState.shift) && this.energy > 5;
    if (boostRequested && (inputState.forward || inputState.backward || inputState.mouseSteering)) {
      this.isBoosting = true;
      this.energy = Math.max(0, this.energy - this.boostDrainRate * dt);
    } else {
      this.isBoosting = false;
      this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * dt);
    }

    // Cooling weapons
    if (this.heat > 0) {
      this.heat = Math.max(0, this.heat - this.coolRate * dt);
      if (this.overheated && this.heat < 0.25) {
        this.overheated = false;
      }
    }

    // Weapon upgrade timer countdown
    if (this.weaponLevel > 1) {
      this.weaponLevelTimer -= dt;
      if (this.weaponLevelTimer <= 0) {
        this.weaponLevel = 1;
      }
    }

    // Invulnerability timer countdown
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.shipMesh.visible = Math.floor(time * 20) % 2 === 0;
    } else {
      this.shipMesh.visible = true;
    }

    // Arcade Flight Physics
    const targetSpeed = this.isBoosting ? this.config.boostSpeed : this.config.maxSpeed;
    const accel = this.config.accelRate;

    let forwardThrust = 0;
    if (inputState.forward) forwardThrust += 1;
    if (inputState.backward) forwardThrust -= 0.6;

    if (inputState.hasMouseTarget) {
      const dx = inputState.targetWorldX - this.position.x;
      const dz = inputState.targetWorldZ - this.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 1.5) {
        this.targetHeading = Math.atan2(dx, dz);
        forwardThrust = Math.min(1.0, Math.max(0.2, dist / 20));
      }
    } else if (inputState.left || inputState.right) {
      const turnDir = (inputState.left ? 1 : 0) - (inputState.right ? 1 : 0);
      this.heading += turnDir * this.config.turnRate * dt;
      this.targetHeading = this.heading;
    }

    // Smooth heading interpolation (no gimbal lock)
    let headingDiff = this.targetHeading - this.heading;
    while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
    while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;
    this.heading += headingDiff * Math.min(1.0, this.config.turnRate * dt);

    // Aerodynamic Banking / Roll
    const targetRoll = -headingDiff * 2.2;
    this.roll += (targetRoll - this.roll) * Math.min(1.0, this.config.rollRate * dt);

    // Pitch on acceleration/deceleration
    const targetPitch = forwardThrust * -0.08;
    this.pitch += (targetPitch - this.pitch) * 10 * dt;

    // Velocity update
    const forwardVec = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const desiredVel = forwardVec.clone().multiplyScalar(forwardThrust * targetSpeed);
    this.velocity.lerp(desiredVel, Math.min(1.0, accel * dt * 0.12));

    this.position.addScaledVector(this.velocity, dt);
    this.group.position.copy(this.position);

    // Apply rotations
    this.group.rotation.y = this.heading;
    this.shipMesh.rotation.z = this.roll;
    this.shipMesh.rotation.x = this.pitch;

    // Thruster Flames Scaling (Ignited only upon thrust/boost)
    const currentSpeed = this.velocity.length();
    const speedRatio = Math.min(1.0, currentSpeed / this.config.maxSpeed);
    const boostActive = this.isBoosting;
    const flameScale = 0.4 + speedRatio * 0.9 + (boostActive ? 1.4 : 0) + Math.sin(time * 40) * 0.12;

    this.thrusterFlames.forEach(({ outer, inner }) => {
      outer.scale.set(1.0 + (boostActive ? 0.35 : 0), 1.0 + (boostActive ? 0.35 : 0), flameScale);
      inner.scale.set(1.0, 1.0, flameScale * 1.15);
      outer.visible = speedRatio > 0.05 || forwardThrust > 0 || boostActive;
      inner.visible = outer.visible;
    });

    // Reactive Shield Bubble Fade
    if (this.shieldMesh) {
      if (this.shieldMesh.material.opacity > 0) {
        this.shieldMesh.material.opacity = Math.max(0, this.shieldMesh.material.opacity - dt * 2.5);
      }
    }
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return false;
    this.lastDamageTime = performance.now() * 0.001;

    // Flash shield
    if (this.shieldMesh) {
      this.shieldMesh.material.opacity = 0.85;
    }

    if (this.shield > 0) {
      const remainingShield = this.shield - amount;
      if (remainingShield >= 0) {
        this.shield = remainingShield;
        return false;
      } else {
        this.shield = 0;
        this.hull += remainingShield;
      }
    } else {
      this.hull -= amount;
    }

    if (this.hull <= 0) {
      this.hull = 0;
      return true; // Destroyed
    }
    return false;
  }

  canFire(time) {
    if (this.overheated) return false;
    return time - this.lastFireTime >= this.fireInterval;
  }

  recordFire(time) {
    this.lastFireTime = time;
    this.heat = Math.min(1.0, this.heat + 0.07);
    if (this.heat >= 1.0) {
      this.overheated = true;
    }
  }

  getMuzzlePositions() {
    const THREE = this.THREE;
    return this.laserMuzzleOffsets.map(offset => {
      const v = new THREE.Vector3(offset.x, offset.y, offset.z);
      v.applyEuler(this.shipMesh.rotation);
      v.applyEuler(this.group.rotation);
      v.add(this.position);
      return v;
    });
  }

  upgradeWeapon(level = 2, duration = 15.0) {
    this.weaponLevel = level;
    this.weaponLevelTimer = duration;
  }

  repair(hullAmount, shieldAmount) {
    this.hull = Math.min(this.maxHull, this.hull + hullAmount);
    this.shield = Math.min(this.maxShield, this.shield + shieldAmount);
  }

  reset(shipType = null) {
    if (shipType && shipType !== this.shipType) {
      this.shipType = shipType;
      this.config = SHIP_CONFIGS[shipType];
      while (this.group.children.length > 0) {
        this.group.remove(this.group.children[0]);
      }
      this.thrusterFlames = [];
      this.laserMuzzleOffsets = [];
      this._buildShipModel();
    }
    this.maxHull = this.config.maxHull;
    this.hull = this.maxHull;
    this.maxShield = this.config.maxShield;
    this.shield = this.maxShield;
    this.energy = this.maxEnergy;
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.heading = 0;
    this.targetHeading = 0;
    this.roll = 0;
    this.pitch = 0;
    this.heat = 0;
    this.overheated = false;
    this.weaponLevel = 1;
    this.invulnerableTimer = 0;
    this.group.position.copy(this.position);
    this.group.rotation.set(0, 0, 0);
    if (this.shipMesh) this.shipMesh.rotation.set(0, 0, 0);
  }
}
